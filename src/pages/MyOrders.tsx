import React, { useEffect } from 'react';
import { usePageTitle } from '../lib/usePageTitle';
import { Link } from 'react-router-dom';
import { useAppStore, Order } from '../store';
import { Package, Truck, CheckCircle, Clock, XCircle, ChevronRight, Download } from 'lucide-react';
import { generateGSTInvoice } from '../lib/gstInvoice';

const STATUS_CONFIG: Record<Order['status'], { icon: React.ElementType; color: string; bg: string; label: string }> = {
  pending:    { icon: Clock,         color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-200',   label: 'Order Placed' },
  processing: { icon: Package,       color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200',     label: 'Processing' },
  shipped:    { icon: Truck,         color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', label: 'Shipped' },
  delivered:  { icon: CheckCircle,   color: 'text-green-700',  bg: 'bg-green-50 border-green-200',   label: 'Delivered' },
  cancelled:  { icon: XCircle,       color: 'text-red-700',    bg: 'bg-red-50 border-red-200',       label: 'Cancelled' },
};

const PAYMENT_STATUS_COLORS: Record<Order['payment_status'], string> = {
  pending:  'text-amber-600',
  paid:     'text-green-600',
  failed:   'text-red-600',
  refunded: 'text-blue-600',
};

export default function MyOrders() {
  usePageTitle('My Orders');
  const { myOrders, isLoadingOrders, fetchMyOrders, user } = useAppStore();

  const handleCancelOrder = async (orderId: string, paymentStatus: string, paymentId: string, totalAmount: number) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      // RLS policy only allows cancelling 'pending' orders
      const { error } = await supabase.from('orders').update({
        status: 'cancelled',
      }).eq('id', orderId).eq('buyer_id', user?.id).eq('status', 'pending');
      if (error) throw error;

      // Trigger refund if order was already paid
      if (paymentStatus === 'paid' && paymentId && !paymentId.startsWith('DEMO-') && !paymentId.startsWith('COD-')) {
        const { processRefund } = await import('../lib/email');
        const result = await processRefund(paymentId, totalAmount, { reason: 'Cancelled by buyer' });
        if (result.success) {
          await supabase.from('orders').update({ payment_status: 'refunded' }).eq('id', orderId);
          toastSuccess('Order cancelled. Refund of ₹' + totalAmount.toLocaleString('en-IN') + ' initiated — arrives in 5–7 business days.');
        } else {
          toastSuccess('Order cancelled. Contact support@byndio.in to process your refund.');
        }
      } else {
        toastSuccess('Order cancelled successfully.');
      }
      fetchMyOrders();
    } catch {
      toast('Could not cancel this order. Only pending orders can be cancelled — contact support if needed.', 'error');
    }
  };

  const downloadInvoice = async (order: Order) => {
    await generateGSTInvoice({
      orderId: order.id,
      orderDate: order.created_at,
      buyerName: order.shipping_address.fullName || user?.name || 'Customer',
      buyerAddress: `${order.shipping_address.line1 || ''}, ${order.shipping_address.city || ''}, ${order.shipping_address.state || ''} - ${order.shipping_address.pin || ''}`,
      sellerName: 'BYNDIO Technologies Pvt Ltd',
      sellerGST: '',
      items: (order.order_items || []).map(item => ({
        name: (item.products as any)?.name || 'Product',
        qty: item.quantity,
        price: item.price,
        gstRate: 18,
        hsn: '6203',
      })),
      shippingFee: 0,
      platformFee: 10,
      totalAmount: order.total_amount,
    });
  };

  useEffect(() => {
    fetchMyOrders();
  }, []);

  if (isLoadingOrders) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#0D47A1] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500 font-medium">Loading your orders...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F5F5F5] min-h-screen">
      <div className="flex items-center gap-1.5 text-xs text-gray-500 px-4 py-2.5 bg-white border-b border-gray-200">
        <Link to="/" className="text-[#1565C0] hover:underline">Home</Link> ›
        <span className="font-semibold text-gray-800">My Orders</span>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-black flex items-center gap-2">
            📦 My Orders
            <span className="bg-[#E3F2FD] text-[#0D47A1] text-[10px] font-bold px-2 py-0.5 rounded-full">
              {myOrders.length} orders
            </span>
          </h1>
          <button
            onClick={fetchMyOrders}
            className="text-[12px] text-[#1565C0] font-semibold hover:underline"
          >
            ↻ Refresh
          </button>
        </div>

        {myOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center gap-4">
            <span className="text-6xl">📦</span>
            <h3 className="text-lg font-extrabold">No orders yet</h3>
            <p className="text-gray-500 max-w-xs">
              Your orders will appear here once you've made a purchase.
            </p>
            <Link
              to="/products"
              className="bg-[#0D47A1] hover:bg-[#1565C0] text-white px-6 py-2.5 rounded-md font-bold transition-colors mt-2"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {myOrders.map(order => {
              const statusCfg = STATUS_CONFIG[order.status];
              const StatusIcon = statusCfg.icon;
              const date = new Date(order.created_at).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric',
              });

              return (
                <div key={order.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  {/* Order header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50">
                    <div className="flex items-center gap-4 flex-wrap">
                      <div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold">Order ID</div>
                        <div className="text-[13px] font-bold text-[#0D47A1]">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold">Placed On</div>
                        <div className="text-[13px] font-semibold">{date}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold">Total</div>
                        <div className="text-[13px] font-bold">₹{order.total_amount.toLocaleString('en-IN')}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-bold capitalize ${PAYMENT_STATUS_COLORS[order.payment_status]}`}>
                        {order.payment_status === 'paid' ? '✓ Paid' : order.payment_status}
                      </span>
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[12px] font-bold ${statusCfg.bg} ${statusCfg.color}`}>
                        <StatusIcon size={13} />
                        {statusCfg.label}
                      </div>
                    </div>
                  </div>

                  {/* Order items */}
                  <div className="px-4 py-3">
                    {order.order_items && order.order_items.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        {order.order_items.map(item => (
                          <div key={item.id} className="flex items-center gap-3">
                            <div className="text-2xl w-9 h-9 bg-gray-50 rounded-md flex items-center justify-center shrink-0">
                              {item.products?.images?.[0] || '📦'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[13px] font-semibold truncate">
                                {item.products?.name || 'Product'}
                              </div>
                              <div className="text-[11px] text-gray-500">
                                Qty: {item.quantity} × ₹{item.price.toLocaleString('en-IN')}
                              </div>
                            </div>
                            <div className="text-[13px] font-bold">
                              ₹{(item.quantity * item.price).toLocaleString('en-IN')}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">Order details loading...</div>
                    )}
                  </div>

                  {/* Order progress */}
                  {order.status !== 'cancelled' && (
                    <div className="px-4 py-3 border-t border-gray-100">
                      <div className="flex items-center gap-0">
                        {(['pending', 'processing', 'shipped', 'delivered'] as const).map((step, i, arr) => {
                          const stepConfig = STATUS_CONFIG[step];
                          const StepIcon = stepConfig.icon;
                          const isCompleted = ['pending', 'processing', 'shipped', 'delivered'].indexOf(order.status) >= i;
                          const isCurrent = order.status === step;

                          return (
                            <div key={step} className="flex items-center flex-1 last:flex-none">
                              <div className={`flex flex-col items-center gap-1 ${isCurrent ? 'scale-110' : ''} transition-transform`}>
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                                  isCompleted ? 'bg-[#0D47A1] text-white' : 'bg-gray-100 text-gray-400'
                                }`}>
                                  <StepIcon size={13} />
                                </div>
                                <span className={`text-[9px] font-semibold whitespace-nowrap hidden sm:block ${
                                  isCurrent ? 'text-[#0D47A1]' : isCompleted ? 'text-gray-600' : 'text-gray-400'
                                }`}>{stepConfig.label}</span>
                              </div>
                              {i < arr.length - 1 && (
                                <div className={`flex-1 h-0.5 mx-1 ${
                                  ['pending', 'processing', 'shipped', 'delivered'].indexOf(order.status) > i
                                    ? 'bg-[#0D47A1]'
                                    : 'bg-gray-200'
                                }`} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Delivery address */}
                  <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-2">
                    <div className="text-[11px] text-gray-500 truncate">
                      📍 {order.shipping_address.line1}, {order.shipping_address.city}, {order.shipping_address.pin}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <button onClick={() => downloadInvoice(order)}
                        className="text-[11px] text-[#388E3C] font-semibold hover:underline flex items-center gap-1">
                        <Download size={11} /> Invoice
                      </button>
                      {order.status === 'pending' && (
                    <button onClick={() => handleCancelOrder(order.id, order.payment_status, order.payment_id, order.total_amount)}
                      className="px-3 py-1.5 text-[11px] font-bold border border-red-300 text-red-600 rounded hover:bg-red-50 transition-colors">
                      Cancel Order
                    </button>
                  )}
                  {order.tracking_awb && (
                    <a href={order.tracking_url || `https://www.google.com/search?q=${order.courier_name}+tracking+${order.tracking_awb}`}
                      target="_blank" rel="noopener"
                      className="px-3 py-1.5 text-[11px] font-bold bg-[#E8F5E9] text-[#2E7D32] border border-[#A5D6A7] rounded hover:bg-[#C8E6C9] transition-colors">
                      🚚 Track: {order.tracking_awb}
                    </a>
                  )}
                  <Link to="/returns" className="text-[11px] text-[#1565C0] font-semibold hover:underline flex items-center gap-0.5">
                        Return <ChevronRight size={11} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
