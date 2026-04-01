import { useState, useEffect } from 'react';
import { usePageTitle } from '../lib/usePageTitle';
import { ShoppingBag, BarChart2, Package, Tag, DollarSign, TrendingUp, Star, Megaphone, Settings, Plus, X, Upload, Trophy } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { initiateSubscriptionPayment } from '../lib/subscriptionPayment';
import { toast, toastSuccess } from '../components/Toast';
import { useAppStore } from '../store';
import BulkUpload from '../components/BulkUpload';
import { generateGSTInvoice } from '../lib/gstInvoice';

export default function Dashboard() {
  usePageTitle('Seller Dashboard');
  const { user } = useAppStore();
  const [tab, setTab] = useState('overview');
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [imgUploading, setImgUploading] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  // FIX #5: Edit product state
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [showEditProduct, setShowEditProduct] = useState(false);

  // FIX #2: Store info state
  const [storeInfo, setStoreInfo] = useState({ store_name: '', business_email: '', support_phone: '', store_location: '' });
  const [isSavingStore, setIsSavingStore] = useState(false);

  // FIX #2: Bank details state
  const [bankDetails, setBankDetails] = useState({ account_holder: '', account_number: '', ifsc: '', bank_name: '' });
  const [isSavingBank, setIsSavingBank] = useState(false);

  // FIX #2: KYC state
  const [kycData, setKycData] = useState({ gst_number: '', pan_number: '' });
  const [isSavingKyc, setIsSavingKyc] = useState(false);

  // FIX #4: Withdraw state
  const [walletBalance, setWalletBalance] = useState(0);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Add Product Form State
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    mrp: '',
    category: 'Electronics',
    stock_quantity: '10',
    images: '📦'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user && user.role === 'seller') {
      fetchDashboardData();
      loadSellerSettings();
    }
  }, [user]);

  const loadSellerSettings = async () => {
    if (!user) return;
    const { data } = await supabase.from('sellers').select('*').eq('id', user.id).maybeSingle();
    if (data) {
      setStoreInfo({
        store_name: data.business_name || '',
        business_email: user.email || '',
        support_phone: '',
        store_location: data.business_address || '',
      });
      setBankDetails({
        account_holder: user.name || '',
        account_number: data.bank_account_number || '',
        ifsc: data.ifsc_code || '',
        bank_name: '',
      });
      setKycData({
        gst_number: data.gst_number || '',
        pan_number: data.pan_number || '',
      });
    }
    const { data: wallet } = await supabase.from('wallets').select('balance').eq('user_id', user.id).maybeSingle();
    setWalletBalance(wallet?.balance || 0);
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch Products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', user?.id);
      
      if (!productsError && productsData) {
        setProducts(productsData);
      }

      // Fetch Orders (Mocked or Real if table exists)
      // We will try to fetch from order_items joined with orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('order_items')
        .select(`
          id,
          quantity,
          price,
          created_at,
          orders ( id, status, buyer_id, shipping_address ),
          products ( name, images )
        `)
        .eq('seller_id', user?.id)
        .order('created_at', { ascending: false });

      if (!ordersError && ordersData) {
        setOrders(ordersData);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    try {
      const price = parseFloat(newProduct.price);
      const mrp = parseFloat(newProduct.mrp);
      const stock = parseInt(newProduct.stock_quantity);
      if (isNaN(price) || price <= 0) throw new Error('Enter a valid price');
      if (isNaN(mrp) || mrp < price) throw new Error('MRP must be ≥ price');
      if (isNaN(stock) || stock < 0) throw new Error('Enter a valid stock quantity');

      const { error } = await supabase.from('products').insert({
        seller_id: user.id,
        name: newProduct.name.trim(),
        description: newProduct.description.trim(),
        price,
        mrp,
        category: newProduct.category,
        stock_quantity: stock,
        images: [newProduct.images],
        is_active: true,
      });

      if (error) throw error;

      setShowAddProduct(false);
      setNewProduct({ name: '', description: '', price: '', mrp: '', category: 'Electronics', stock_quantity: '10', images: '📦' });
      fetchDashboardData();
    } catch (err: any) {
      toast(err.message || 'Failed to add product. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // FIX #2: Save store info to DB
  const handleSaveStore = async () => {
    if (!user) return;
    setIsSavingStore(true);
    try {
      const { error } = await supabase.from('sellers').upsert({
        id: user.id,
        business_name: storeInfo.store_name.trim() || `${user.name}'s Store`,
        business_address: storeInfo.store_location.trim(),
      }, { onConflict: 'id' });
      // Also update the users table for email/phone (best-effort)
      await supabase.from('users').update({
        full_name: storeInfo.store_name.trim() || user.name,
      }).eq('id', user.id);
      if (error) throw error;
      toastSuccess('Store settings saved successfully!');
    } catch (err: any) {
      toast(err.message || 'Failed to save store settings.', 'error');
    } finally {
      setIsSavingStore(false);
    }
  };

  // FIX #2: Save bank details to DB
  const handleSaveBank = async () => {
    if (!user) return;
    setIsSavingBank(true);
    try {
      const { error } = await supabase.from('sellers').upsert({
        id: user.id,
        bank_account_number: bankDetails.account_number.trim(),
        ifsc_code: bankDetails.ifsc.trim().toUpperCase(),
        business_name: storeInfo.store_name.trim() || `${user.name}'s Store`,
      }, { onConflict: 'id' });
      if (error) throw error;
      toastSuccess('Bank details saved successfully!');
    } catch (err: any) {
      toast(err.message || 'Failed to save bank details.', 'error');
    } finally {
      setIsSavingBank(false);
    }
  };

  // FIX #2: Save KYC details to DB
  const handleSaveKyc = async () => {
    if (!user) return;
    setIsSavingKyc(true);
    try {
      const { error } = await supabase.from('sellers').upsert({
        id: user.id,
        gst_number: kycData.gst_number.trim().toUpperCase(),
        pan_number: kycData.pan_number.trim().toUpperCase(),
        kyc_status: 'submitted',
        business_name: storeInfo.store_name.trim() || `${user.name}'s Store`,
      }, { onConflict: 'id' });
      if (error) throw error;
      toastSuccess('KYC details submitted for verification!');
    } catch (err: any) {
      toast(err.message || 'Failed to submit KYC.', 'error');
    } finally {
      setIsSavingKyc(false);
    }
  };

  // FIX #4: Submit real withdrawal request to DB
  const handleWithdraw = async () => {
    if (!user) return;
    if (walletBalance <= 0) { toast('No balance available to withdraw.', 'error'); return; }
    setIsWithdrawing(true);
    try {
      const { error } = await supabase.from('withdrawal_requests').insert({
        user_id: user.id,
        amount: walletBalance,
        status: 'pending',
        requested_at: new Date().toISOString(),
      });
      if (error) throw error;
      toastSuccess(`Withdrawal of ₹${walletBalance.toLocaleString('en-IN')} requested! Funds arrive in 7 working days.`);
    } catch (err: any) {
      toast(err.message || 'Failed to submit withdrawal request.', 'error');
    } finally {
      setIsWithdrawing(false);
    }
  };

  // FIX #5: Edit product — save changes to DB
  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !user) return;
    setIsSubmitting(true);
    try {
      const price = parseFloat(editingProduct.price);
      const mrp = parseFloat(editingProduct.mrp);
      const stock = parseInt(editingProduct.stock_quantity);
      if (isNaN(price) || price <= 0) throw new Error('Enter a valid price');
      if (isNaN(mrp) || mrp < price) throw new Error('MRP must be ≥ price');
      if (isNaN(stock) || stock < 0) throw new Error('Enter a valid stock quantity');

      const { error } = await supabase.from('products').update({
        name: editingProduct.name.trim(),
        description: editingProduct.description?.trim() || '',
        price,
        mrp,
        category: editingProduct.category,
        stock_quantity: stock,
        images: [editingProduct.images],
      }).eq('id', editingProduct.id).eq('seller_id', user.id);

      if (error) throw error;

      setShowEditProduct(false);
      setEditingProduct(null);
      fetchDashboardData();
      toastSuccess('Product updated successfully!');
    } catch (err: any) {
      toast(err.message || 'Failed to update product.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const navItems = [
    { id: 'overview', icon: BarChart2, label: 'Overview' },
    { id: 'orders', icon: Package, label: 'Orders' },
    { id: 'products', icon: Tag, label: 'My Products' },
    { id: 'earnings', icon: DollarSign, label: 'Earnings & Plans' },
    { id: 'analytics', icon: TrendingUp, label: 'Analytics' },
    { id: 'affiliate', icon: Star, label: 'Affiliate Links' },
    { id: 'ads', icon: Megaphone, label: 'Ads & Boost' },
    { id: 'leaderboard', icon: Trophy, label: 'Leaderboard' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered': case 'Active': return 'bg-[#E8F5E9] text-[#2E7D32]';
      case 'Shipped': case 'Pending': return 'bg-[#E3F2FD] text-[#0D47A1]';
      case 'Processing': case 'Low Stock': return 'bg-[#FFF3E0] text-[#E65100]';
      case 'Returned': return 'bg-[#FFEBEE] text-[#C62828]';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderContent = () => {
    if (loading) {
      return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0D47A1]"></div></div>;
    }

    switch (tab) {
      case 'overview':
        return (
          <>
            <div className="text-xl font-black text-[#0D47A1] mb-4">📊 Overview</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
              <div className="bg-white rounded-[10px] p-4.5 shadow-sm flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-[10px] bg-[#E3F2FD] flex items-center justify-center text-[28px] shrink-0">📦</div>
                <div><div className="text-[22px] font-black">₹{orders.reduce((sum, o) => sum + (o.price * o.quantity), 0).toLocaleString('en-IN')}</div><div className="text-xs text-gray-500">Total Revenue</div></div>
              </div>
              <div className="bg-white rounded-[10px] p-4.5 shadow-sm flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-[10px] bg-[#E8F5E9] flex items-center justify-center text-[28px] shrink-0">🛒</div>
                <div><div className="text-[22px] font-black">{orders.length}</div><div className="text-xs text-gray-500">Total Orders</div></div>
              </div>
              <div className="bg-white rounded-[10px] p-4.5 shadow-sm flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-[10px] bg-[#FFF3E0] flex items-center justify-center text-[28px] shrink-0">🏷️</div>
                <div><div className="text-[22px] font-black">{products.length}</div><div className="text-xs text-gray-500">Active Products</div></div>
              </div>
              <div className="bg-white rounded-[10px] p-4.5 shadow-sm flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-[10px] bg-[#F3E5F5] flex items-center justify-center text-[28px] shrink-0">⭐</div>
                <div><div className="text-[22px] font-black">4.7</div><div className="text-xs text-gray-500">Avg. Rating</div></div>
              </div>
            </div>
            <div className="bg-white rounded-[10px] shadow-sm overflow-hidden">
              <div className="flex items-center justify-between p-3.5 border-b border-gray-200">
                <span className="text-[15px] font-black">Recent Orders</span>
                <button onClick={() => setTab('orders')} className="text-xs text-[#1565C0] font-bold hover:underline">View All →</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[13px] text-left">
                  <thead className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                    <tr><th className="p-3 border-b border-gray-200">Order ID</th><th className="p-3 border-b border-gray-200">Product</th><th className="p-3 border-b border-gray-200">Amount</th><th className="p-3 border-b border-gray-200">Date</th><th className="p-3 border-b border-gray-200">Status</th></tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 5).map((o, i) => (
                      <tr key={i} className="hover:bg-blue-50/50">
                        <td className="p-3 border-b border-gray-200 font-bold text-[#1565C0]">{o.orders?.id?.slice(0, 8)}...</td>
                        <td className="p-3 border-b border-gray-200">{o.products?.name || 'Unknown Product'} (x{o.quantity})</td>
                        <td className="p-3 border-b border-gray-200 font-bold">₹{(o.price * o.quantity).toLocaleString('en-IN')}</td>
                        <td className="p-3 border-b border-gray-200">{new Date(o.created_at).toLocaleDateString()}</td>
                        <td className="p-3 border-b border-gray-200"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusColor(o.orders?.status || 'Pending')}`}>{o.orders?.status || 'Pending'}</span></td>
                      </tr>
                    ))}
                    {orders.length === 0 && (
                      <tr><td colSpan={5} className="p-4 text-center text-gray-500">No orders yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        );
      case 'orders':
        return (
          <>
            <div className="text-xl font-black text-[#0D47A1] mb-4">📦 Orders</div>
            <div className="bg-white rounded-[10px] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-[13px] text-left">
                  <thead className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                    <tr><th className="p-3 border-b border-gray-200">Order ID</th><th className="p-3 border-b border-gray-200">Product</th><th className="p-3 border-b border-gray-200">Amount</th><th className="p-3 border-b border-gray-200">Date</th><th className="p-3 border-b border-gray-200">Status</th><th className="p-3 border-b border-gray-200">Action</th></tr>
                  </thead>
                  <tbody>
                    {orders.map((o, i) => (
                      <tr key={i} className="hover:bg-blue-50/50">
                        <td className="p-3 border-b border-gray-200 font-bold text-[#1565C0]">{o.orders?.id?.slice(0, 8)}...</td>
                        <td className="p-3 border-b border-gray-200">{o.products?.name || 'Unknown Product'} (x{o.quantity})</td>
                        <td className="p-3 border-b border-gray-200 font-bold">₹{(o.price * o.quantity).toLocaleString('en-IN')}</td>
                        <td className="p-3 border-b border-gray-200">{new Date(o.created_at).toLocaleDateString()}</td>
                        <td className="p-3 border-b border-gray-200"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusColor(o.orders?.status || 'Pending')}`}>{o.orders?.status || 'Pending'}</span></td>
                        <td className="p-3 border-b border-gray-200">
                          <button onClick={async () => {
                            // Fetch tracking info from orders table
                            const { data: orderRow } = await supabase
                              .from('orders')
                              .select('tracking_url, tracking_awb, status')
                              .eq('id', o.orders?.id)
                              .maybeSingle();
                            if (orderRow?.tracking_url) {
                              window.open(orderRow.tracking_url, '_blank');
                            } else if (orderRow?.tracking_awb) {
                              window.open(`https://shiprocket.co/tracking/${orderRow.tracking_awb}`, '_blank');
                            } else {
                              const awb = window.prompt('Enter AWB / tracking number to attach to this order:');
                              if (awb && awb.trim()) {
                                const { error } = await supabase.from('orders').update({
                                  tracking_awb: awb.trim(),
                                  tracking_url: `https://shiprocket.co/tracking/${awb.trim()}`,
                                  status: 'shipped',
                                }).eq('id', o.orders?.id);
                                if (!error) { toastSuccess(`AWB ${awb.trim()} saved. Order marked as Shipped.`); fetchDashboardData(); }
                                else toast('Failed to save tracking: ' + error.message, 'error');
                              }
                            }
                          }} className="text-[11px] text-[#1565C0] font-bold hover:underline mr-2">Track</button>
                          <button onClick={async () => {
                            await generateGSTInvoice({
                              orderId: o.orders?.id || 'N/A',
                              orderDate: o.created_at,
                              buyerName: o.orders?.shipping_address?.fullName || 'Customer',
                              buyerAddress: `${o.orders?.shipping_address?.line1 || ''}, ${o.orders?.shipping_address?.city || ''}`,
                              sellerName: user?.name || 'Seller',
                              sellerGST: 'N/A',
                              items: [{ name: o.products?.name || 'Product', qty: o.quantity, price: o.price, gstRate: 18, hsn: '6203' }],
                              shippingFee: 0,
                              platformFee: 10,
                              totalAmount: o.price * o.quantity,
                            });
                          }} className="text-[11px] text-[#388E3C] font-bold hover:underline">Invoice</button>
                        </td>
                      </tr>
                    ))}
                    {orders.length === 0 && (
                      <tr><td colSpan={6} className="p-4 text-center text-gray-500">No orders yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        );
      case 'products':
        return (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="text-xl font-black text-[#0D47A1]">🏷️ My Products</div>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowBulkUpload(true)}
                  className="flex items-center gap-1.5 bg-white hover:bg-gray-50 border-2 border-[#0D47A1] text-[#0D47A1] px-3 py-2 rounded-md font-bold text-sm transition-colors">
                  <Upload size={15} /> Bulk CSV
                </button>
                <button onClick={() => setShowAddProduct(true)}
                  className="bg-[#0D47A1] hover:bg-[#1565C0] text-white px-4 py-2 rounded-md font-bold text-sm transition-colors flex items-center gap-1.5">
                  <Plus size={16} /> Add Product
                </button>
              </div>
            </div>

            {showAddProduct && (
              <div className="bg-white rounded-[10px] shadow-sm p-5 mb-5 border border-[#1565C0]/20 relative">
                <button onClick={() => setShowAddProduct(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
                <h3 className="text-lg font-bold text-[#0D47A1] mb-4">Add New Product</h3>
                <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-gray-500 uppercase">Product Name</label>
                    <input required type="text" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="p-2 border border-gray-300 rounded-md text-sm outline-none focus:border-[#1565C0]" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-gray-500 uppercase">Category</label>
                    <select value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} className="p-2 border border-gray-300 rounded-md text-sm outline-none focus:border-[#1565C0] bg-white">
                      <option>Electronics</option><option>Fashion</option><option>Home</option><option>Beauty</option><option>Sports</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-gray-500 uppercase">Selling Price (₹)</label>
                    <input required type="number" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} className="p-2 border border-gray-300 rounded-md text-sm outline-none focus:border-[#1565C0]" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-gray-500 uppercase">MRP (₹)</label>
                    <input required type="number" value={newProduct.mrp} onChange={e => setNewProduct({...newProduct, mrp: e.target.value})} className="p-2 border border-gray-300 rounded-md text-sm outline-none focus:border-[#1565C0]" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-gray-500 uppercase">Stock Quantity</label>
                    <input required type="number" value={newProduct.stock_quantity} onChange={e => setNewProduct({...newProduct, stock_quantity: e.target.value})} className="p-2 border border-gray-300 rounded-md text-sm outline-none focus:border-[#1565C0]" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-gray-500 uppercase">Image Emoji/URL</label>
                    <input required type="text" value={newProduct.images} onChange={e => setNewProduct({...newProduct, images: e.target.value})} className="p-2 border border-gray-300 rounded-md text-sm outline-none focus:border-[#1565C0]" />
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-[11px] font-bold text-gray-500 uppercase">Description</label>
                    <textarea required rows={3} value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} className="p-2 border border-gray-300 rounded-md text-sm outline-none focus:border-[#1565C0]"></textarea>
                  </div>
                  <div className="md:col-span-2 flex justify-end mt-2">
                    <button type="submit" disabled={isSubmitting} className="bg-[#E65100] hover:bg-[#F57C00] disabled:bg-gray-400 text-white px-6 py-2 rounded-md font-bold text-sm transition-colors">
                      {isSubmitting ? 'Adding...' : 'Save Product'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="bg-white rounded-[10px] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-[13px] text-left">
                  <thead className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                    <tr><th className="p-3 border-b border-gray-200 w-12"></th><th className="p-3 border-b border-gray-200">Product</th><th className="p-3 border-b border-gray-200">Price</th><th className="p-3 border-b border-gray-200">Stock</th><th className="p-3 border-b border-gray-200">Status</th><th className="p-3 border-b border-gray-200">Actions</th></tr>
                  </thead>
                  <tbody>
                    {products.map((p, i) => (
                      <tr key={i} className="hover:bg-blue-50/50">
                        <td className="p-3 border-b border-gray-200 text-2xl text-center">{p.images?.[0] || '📦'}</td>
                        <td className="p-3 border-b border-gray-200 font-semibold">{p.name}</td>
                        <td className="p-3 border-b border-gray-200 font-bold">₹{p.price}</td>
                        <td className="p-3 border-b border-gray-200">{p.stock_quantity}</td>
                        <td className="p-3 border-b border-gray-200"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusColor(p.is_active ? 'Active' : 'Pending')}`}>{p.is_active ? 'Active' : 'Inactive'}</span></td>
                        <td className="p-3 border-b border-gray-200 flex gap-2 items-center">
                          <button onClick={() => {
                            setEditingProduct({ ...p, images: p.images?.[0] || '📦', price: String(p.price), mrp: String(p.mrp), stock_quantity: String(p.stock_quantity) });
                            setShowEditProduct(true);
                          }} className="text-[11px] text-[#1565C0] font-bold hover:underline">Edit</button>
                          <button onClick={async () => {
                            if (!window.confirm('Delete this product? This cannot be undone.')) return;
                            const { error: delErr } = await supabase.from('products').update({ is_active: false }).eq('id', p.id);
                            if (delErr) { toast('Failed to delete product: ' + delErr.message, 'error'); }
                            else { toastSuccess('Product removed from your store.'); fetchDashboardData(); }
                          }} className="text-[11px] text-red-500 font-bold hover:underline">Delete</button>
                        </td>
                      </tr>
                    ))}
                    {products.length === 0 && (
                      <tr><td colSpan={6} className="p-4 text-center text-gray-500">No products found. Add your first product!</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        );
      case 'earnings':
        return (
          <>
            <div className="text-xl font-black text-[#0D47A1] mb-4">💰 Earnings & Wallet</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-5">
              <div className="bg-gradient-to-br from-[#0D47A1] to-[#1565C0] text-white rounded-[10px] p-4.5 shadow-sm flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-[10px] bg-white/20 flex items-center justify-center text-[28px] shrink-0">💰</div>
                <div><div className="text-[22px] font-black">₹{orders.reduce((sum, o) => sum + (o.price * o.quantity), 0).toLocaleString('en-IN')}</div><div className="text-xs text-white/80">Wallet Balance</div></div>
              </div>
              <div className="bg-white rounded-[10px] p-4.5 shadow-sm flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-[10px] bg-[#E8F5E9] flex items-center justify-center text-[28px] shrink-0">📅</div>
                <div><div className="text-[22px] font-black">₹0</div><div className="text-xs text-gray-500">This Week</div><div className="text-[11px] text-[#388E3C] font-semibold">Settlement: Every Monday</div></div>
              </div>
              <div className="bg-white rounded-[10px] p-4.5 shadow-sm flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-[10px] bg-[#E3F2FD] flex items-center justify-center text-[28px] shrink-0">📊</div>
                <div><div className="text-[22px] font-black">{orders.length}</div><div className="text-xs text-gray-500">Total Orders</div></div>
              </div>
            </div>
            <div className="bg-white rounded-[10px] p-5 shadow-sm mb-4">
              <div className="text-[14px] font-black mb-3">Payout Options</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="font-bold text-[13px] mb-1">Standard Payout (Free)</div>
                  <div className="text-[11px] text-gray-500 mb-1">7-day settlement to bank account. No fee.</div>
                  <div className="text-[12px] font-semibold text-[#0D47A1] mb-3">
                    Available: ₹{walletBalance.toLocaleString('en-IN')}
                  </div>
                  <button onClick={handleWithdraw} disabled={isWithdrawing || walletBalance <= 0}
                    className="bg-[#388E3C] hover:bg-[#2E7D32] disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md text-[12px] font-bold transition-colors">
                    {isWithdrawing ? 'Submitting...' : '💸 Withdraw Funds'}
                  </button>
                </div>
                <div className="border-2 border-[#0D47A1] rounded-lg p-4 relative">
                  <div className="absolute -top-3 left-3 bg-[#0D47A1] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">PRO</div>
                  <div className="font-bold text-[13px] mb-1">Instant Payout (1–2% fee)</div>
                  <div className="text-[11px] text-gray-500 mb-3">Get funds in 24–48 hours. Available with Seller Pro.</div>
                  <button onClick={() => toast('Upgrade to Seller Pro for instant payouts!', 'info')} className="bg-white text-[#0D47A1] border-2 border-[#0D47A1] px-4 py-2 rounded-md text-[12px] font-bold hover:bg-[#E3F2FD] transition-colors">Upgrade to Pro</button>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-[10px] p-5 shadow-sm">
              <div className="text-[14px] font-black mb-3">Seller Subscription Plans</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { name: 'Free', price: '₹0/mo', features: ['Unlimited listings', '0% commission', 'Basic analytics', '7-day payout'], color: 'border-gray-200' },
                  { name: 'Pro', price: '₹1,999/mo', features: ['Everything in Free', 'Bulk CSV upload', 'Advanced analytics', 'COD protection', 'Priority support', 'Instant payout'], color: 'border-[#0D47A1]', popular: true },
                  { name: 'Enterprise', price: 'Custom', features: ['Everything in Pro', 'Dedicated manager', 'API access', 'Custom integrations', 'White-label options'], color: 'border-gray-200' },
                ].map((plan, i) => (
                  <div key={i} className={`border-2 ${plan.color} rounded-xl p-4 relative`}>
                    {(plan as any).popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FF9800] text-white text-[10px] font-bold px-3 py-0.5 rounded-full whitespace-nowrap">★ Most Popular</div>}
                    <div className="font-black text-[15px] mb-0.5">{plan.name}</div>
                    <div className="text-[22px] font-black text-[#0D47A1] mb-3">{plan.price}</div>
                    {plan.features.map(f => <div key={f} className="text-[12px] text-gray-600 flex items-center gap-1.5 mb-1"><span className="text-[#388E3C] font-black">✓</span>{f}</div>)}
                    <button
                      disabled={plan.name === 'Free' || user?.subscription_plan === plan.name.toLowerCase()}
                      onClick={() => {
                        if (plan.name === 'Free' || !plan.price) return;
                        const prices: Record<string, number> = { Pro: 1999, Enterprise: 9999 };
                        initiateSubscriptionPayment(
                          { name: plan.name, price: prices[plan.name] || 1999, priceDisplay: plan.price, role: 'seller' },
                          { id: user!.id, name: user!.name, email: user!.email },
                          (planName) => { toast(`🎉 ${planName} plan activated!`, 'success'); },
                          (msg) => { toast(msg, 'error'); },
                        );
                      }}
                      className="w-full mt-3 bg-[#0D47A1] hover:bg-[#1565C0] disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-2 rounded-md text-[12px] font-bold transition-colors">
                      {user?.subscription_plan === plan.name.toLowerCase() ? '✓ Current Plan' : plan.name === 'Free' ? 'Free Plan' : `Get ${plan.name}`}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        );
      case 'affiliate':
        return (
          <>
            <div className="text-xl font-black text-[#0D47A1] mb-4">🔗 Affiliate Links</div>
            <div className="bg-[#E3F2FD] border border-[#90CAF9] rounded-xl p-4 mb-4">
              <div className="font-black text-[14px] text-[#0D47A1] mb-1">Generate Affiliate Links for Your Products</div>
              <p className="text-[12px] text-gray-600">Share product links and earn 8% commission on every sale through your link. Works the same as influencer links!</p>
            </div>
            <div className="bg-white rounded-[10px] p-5 shadow-sm mb-4">
              <div className="text-[14px] font-bold mb-3">Your Products — Generate Links</div>
              {products.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-sm">Add products first to generate affiliate links.</div>
              ) : (
                <div className="flex flex-col gap-2">
                  {products.map(p => {
                    const code = `seller-${user?.id?.slice(0,8)}-${p.id?.toString().slice(0,8)}`;
                    const url = `${window.location.origin}/products?ref=${code}`;
                    return (
                      <div key={p.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                        <span className="text-2xl">{p.images?.[0] || '📦'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-bold truncate">{p.name}</div>
                          <code className="text-[10px] text-gray-500 truncate block">{url}</code>
                        </div>
                        <button onClick={() => { navigator.clipboard.writeText(url).catch(()=>{}); toastSuccess('Affiliate link copied to clipboard!') }}
                          className="text-[11px] font-bold text-[#0D47A1] hover:underline whitespace-nowrap">Copy Link</button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        );
      case 'influencers':
        return (
          <>
            <div className="text-xl font-black text-[#0D47A1] mb-4">⭐ Creator Partnerships</div>
            <div className="bg-white rounded-[10px] p-5 shadow-sm">
              <p className="text-[13px] text-gray-500 mb-4">Connect with verified creators to boost your product visibility and sales</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {[
                  { name: '@StyleByRiya', cat: 'Fashion', followers: '2.4M', rate: '₹8,000/post' },
                  { name: '@GlowWithNisha', cat: 'Beauty', followers: '3.1M', rate: '₹10,000/post' },
                  { name: '@FitIndia', cat: 'Sports', followers: '1.2M', rate: '₹5,000/post' }
                ].map((c, i) => (
                  <div key={i} className="border border-gray-200 rounded-[10px] p-4 text-center">
                    <span className="text-4xl block mb-2">⭐</span>
                    <div className="text-xs font-extrabold mb-0.5">{c.name}</div>
                    <div className="text-[10px] text-[#7B1FA2] font-semibold">{c.cat}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">{c.followers} followers</div>
                    <div className="text-[11px] font-bold text-[#1565C0] mt-1">{c.rate}</div>
                    <button onClick={() => toastSuccess(`Partnership request sent to ${c.name}!`)} className="w-full mt-2 bg-[#0D47A1] hover:bg-[#1565C0] text-white py-1.5 rounded text-[11px] font-bold transition-colors">
                      Request Partnership
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        );
      case 'analytics':
        return (
          <>
            <div className="text-xl font-black text-[#0D47A1] mb-4">📈 Sales Analytics</div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
              {[
                { label: 'Total Revenue', value: `₹${orders.reduce((s, o) => s + o.price * o.quantity, 0).toLocaleString('en-IN')}`, icon: '💰', sub: 'all time' },
                { label: 'Total Orders', value: orders.length, icon: '📦', sub: 'fulfilled' },
                { label: 'Products Listed', value: products.length, icon: '🏷️', sub: 'active' },
                { label: 'Avg. Order Value', value: orders.length ? `₹${Math.round(orders.reduce((s, o) => s + o.price * o.quantity, 0) / orders.length).toLocaleString('en-IN')}` : '₹0', icon: '📊', sub: 'per order' },
              ].map((s, i) => (
                <div key={i} className="bg-white rounded-[10px] p-4 shadow-sm">
                  <div className="text-[22px] mb-1">{s.icon}</div>
                  <div className="text-[20px] font-black">{s.value}</div>
                  <div className="text-xs text-gray-500">{s.label}</div>
                  <div className="text-[10px] text-[#388E3C] font-semibold mt-0.5">{s.sub}</div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-[10px] p-5 shadow-sm mb-4">
              <div className="text-[14px] font-black mb-3">Top Products by Revenue</div>
              {products.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-sm">No products yet. Add products to see analytics.</div>
              ) : (() => {
                // Compute real revenue per product from actual order data
                const withRev = products.slice(0, 5).map(p => ({
                  ...p,
                  rev: orders.filter(o => o.products?.name === p.name).reduce((s: number, o: any) => s + o.price * o.quantity, 0),
                }));
                const maxRev = Math.max(...withRev.map(p => p.rev), 1);
                return (
                  <div className="flex flex-col gap-2">
                    {withRev.map((p, i) => {
                      // Bar width based on real revenue proportion; min 4% so bar is always visible
                      const pct = p.rev > 0 ? Math.max(4, Math.round((p.rev / maxRev) * 100)) : 4;
                      return (
                        <div key={p.id} className="flex items-center gap-3">
                          <span className="text-[11px] text-gray-400 w-5">{i + 1}</span>
                          <span className="text-xl shrink-0">{p.images?.[0] || '📦'}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-[12px] font-semibold truncate">{p.name}</div>
                            <div className="h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                              <div className="h-full bg-[#0D47A1] rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                          <div className="text-[12px] font-black text-[#388E3C] shrink-0">
                            {p.rev > 0 ? `₹${p.rev.toLocaleString('en-IN')}` : 'No sales yet'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
            <div className="bg-[#E3F2FD] border border-[#90CAF9] rounded-lg p-4 text-center">
              <div className="font-bold text-[#0D47A1] text-[13px] mb-1">Advanced Analytics Available with Seller Pro</div>
              <div className="text-[11px] text-gray-600">Detailed charts, conversion funnels, customer demographics, and export reports.</div>
            </div>
          </>
        );

      case 'leaderboard':
        return (
          <>
            <div className="text-xl font-black text-[#0D47A1] mb-4">🏆 Leaderboard</div>
            <div className="bg-[#E3F2FD] border border-[#90CAF9] rounded-xl p-4 mb-4 flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="font-black text-[14px] text-[#0D47A1]">See how you rank among all BYNDIO sellers & creators</div>
                <div className="text-[12px] text-gray-600 mt-0.5">Rankings update every 24 hours based on total affiliate earnings.</div>
              </div>
              <a href="/leaderboard" target="_blank" rel="noopener"
                className="bg-[#0D47A1] text-white px-4 py-2 rounded-md text-[12px] font-bold hover:bg-[#1565C0] transition-colors">
                View Full Leaderboard →
              </a>
            </div>
            <div className="bg-white rounded-[10px] p-5 shadow-sm">
              <div className="text-[13px] font-bold mb-3 text-gray-600">Your Stats</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Affiliate Earnings', val: '₹0', icon: '💰' },
                  { label: 'Total Clicks', val: '0', icon: '👆' },
                  { label: 'Conversions', val: '0', icon: '🛒' },
                  { label: 'Your Rank', val: '—', icon: '🏆' },
                ].map((s, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-[20px] mb-1">{s.icon}</div>
                    <div className="text-[16px] font-black">{s.val}</div>
                    <div className="text-[10px] text-gray-500">{s.label}</div>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-gray-400 mt-3 text-center">Generate affiliate links and promote your products to start climbing the leaderboard!</p>
            </div>
          </>
        );

      case 'settings':
        return (
          <>
            <div className="text-xl font-black text-[#0D47A1] mb-4">⚙️ Account Settings</div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-[10px] p-5 shadow-sm">
                <div className="text-[14px] font-bold mb-4 border-b border-gray-100 pb-2">Store Information</div>
                <div className="flex flex-col gap-3">
                  {[
                    { label: 'Store Name', field: 'store_name', placeholder: `${user?.name}'s Store`, type: 'text' },
                    { label: 'Business Email', field: 'business_email', placeholder: user?.email || 'store@example.com', type: 'email' },
                    { label: 'Support Phone', field: 'support_phone', placeholder: '+91 98765 43210', type: 'tel' },
                    { label: 'Store Location', field: 'store_location', placeholder: 'Mumbai, Maharashtra', type: 'text' },
                  ].map(f => (
                    <div key={f.label} className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">{f.label}</label>
                      <input type={f.type} placeholder={f.placeholder} value={(storeInfo as any)[f.field]} onChange={e => setStoreInfo({ ...storeInfo, [f.field]: e.target.value })}
                        className="p-2.5 border border-gray-300 rounded-md text-[13px] outline-none focus:border-[#1565C0]" />
                    </div>
                  ))}
                  <button onClick={handleSaveStore} disabled={isSavingStore}
                    className="bg-[#0D47A1] hover:bg-[#1565C0] disabled:bg-gray-400 text-white py-2.5 rounded-md text-[13px] font-bold transition-colors mt-1">
                    {isSavingStore ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
              <div className="bg-white rounded-[10px] p-5 shadow-sm">
                <div className="text-[14px] font-bold mb-4 border-b border-gray-100 pb-2">Bank Account for Payouts</div>
                <div className="flex flex-col gap-3">
                  {[
                    { label: 'Account Holder Name', field: 'account_holder', placeholder: 'As per bank records', type: 'text' },
                    { label: 'Account Number', field: 'account_number', placeholder: '••••••••1234', type: 'text' },
                    { label: 'IFSC Code', field: 'ifsc', placeholder: 'HDFC0001234', type: 'text' },
                    { label: 'Bank Name', field: 'bank_name', placeholder: 'HDFC Bank', type: 'text' },
                  ].map(f => (
                    <div key={f.label} className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">{f.label}</label>
                      <input type={f.type} placeholder={f.placeholder} value={(bankDetails as any)[f.field]} onChange={e => setBankDetails({ ...bankDetails, [f.field]: e.target.value })}
                        className="p-2.5 border border-gray-300 rounded-md text-[13px] outline-none focus:border-[#1565C0]" />
                    </div>
                  ))}
                  <button onClick={handleSaveBank} disabled={isSavingBank}
                    className="bg-[#388E3C] hover:bg-[#2E7D32] disabled:bg-gray-400 text-white py-2.5 rounded-md text-[13px] font-bold transition-colors mt-1">
                    {isSavingBank ? 'Saving...' : '💰 Save Bank Details'}
                  </button>
                </div>
              </div>
              <div className="bg-white rounded-[10px] p-5 shadow-sm">
                <div className="text-[14px] font-bold mb-4 border-b border-gray-100 pb-2">KYC & Compliance</div>
                <div className="flex flex-col gap-3">
                  {[
                    { label: 'GST Number', field: 'gst_number', placeholder: '22AAAAA0000A1Z5' },
                    { label: 'PAN Number', field: 'pan_number', placeholder: 'ABCDE1234F' },
                  ].map(f => (
                    <div key={f.label} className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">{f.label}</label>
                      <input type="text" placeholder={f.placeholder} value={(kycData as any)[f.field]} onChange={e => setKycData({ ...kycData, [f.field]: e.target.value })}
                        className="p-2.5 border border-gray-300 rounded-md text-[13px] outline-none focus:border-[#1565C0]" />
                    </div>
                  ))}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-[#0D47A1] transition-colors">
                    <div className="text-2xl mb-1">📄</div>
                    <div className="text-[12px] font-semibold text-gray-600">Upload GST Certificate / PAN Card</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">PDF, JPG, PNG — max 5MB</div>
                  </div>
                  <button onClick={handleSaveKyc} disabled={isSavingKyc}
                    className="bg-[#7B1FA2] hover:bg-[#6A1B9A] disabled:bg-gray-400 text-white py-2.5 rounded-md text-[13px] font-bold transition-colors">
                    {isSavingKyc ? 'Submitting...' : 'Submit for KYC Verification'}
                  </button>
                </div>
              </div>
              <div className="bg-white rounded-[10px] p-5 shadow-sm">
                <div className="text-[14px] font-bold mb-4 border-b border-gray-100 pb-2">Notification Preferences</div>
                <div className="flex flex-col gap-3">
                  {[
                    { label: 'New order received', defaultChecked: true },
                    { label: 'Order status updates', defaultChecked: true },
                    { label: 'Weekly earnings report', defaultChecked: true },
                    { label: 'Platform announcements', defaultChecked: false },
                    { label: 'Flash sale invitations', defaultChecked: true },
                  ].map(pref => (
                    <label key={pref.label} className="flex items-center justify-between p-2.5 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <span className="text-[13px] font-semibold">{pref.label}</span>
                      <input type="checkbox" defaultChecked={pref.defaultChecked} className="accent-[#0D47A1] w-4 h-4" />
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </>
        );
        return (
          <>
            <div className="text-xl font-black text-[#0D47A1] mb-4">🚀 Ads & Boost</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="bg-white border border-gray-200 rounded-[10px] p-5 flex items-start gap-3.5">
                <div className="text-[28px] shrink-0">🔝</div>
                <div className="flex-1">
                  <div className="text-sm font-extrabold mb-1">Homepage Featured</div>
                  <div className="text-xs text-gray-500 leading-relaxed mb-3">Get featured on homepage for 10X more views. ₹2,999/week</div>
                  {products.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      <select id="boost-product" className="p-2 border border-gray-300 rounded text-xs outline-none focus:border-[#E65100]">
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      <button onClick={async () => {
                        const sel = (document.getElementById('boost-product') as HTMLSelectElement)?.value;
                        if (!sel) return;
                        const until = new Date(Date.now() + 7 * 24 * 3600000).toISOString();
                        const { error } = await supabase.from('products').update({ is_sponsored: true, sponsored_until: until }).eq('id', sel).eq('seller_id', user!.id);
                        if (!error) toastSuccess('Homepage boost activated for 7 days!');
                        else toast('Failed to activate boost: ' + error.message, 'error');
                      }} className="bg-[#E65100] hover:bg-[#F57C00] text-white px-4 py-2 rounded text-xs font-bold transition-colors">Boost Now — ₹2,999/week</button>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">Add products first to boost them.</p>
                  )}
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-[10px] p-5 flex items-start gap-3.5">
                <div className="text-[28px] shrink-0">📊</div>
                <div className="flex-1">
                  <div className="text-sm font-extrabold mb-1">Sponsored Listing</div>
                  <div className="text-xs text-gray-500 leading-relaxed mb-3">Appear first in category search results. ₹999/week</div>
                  {products.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      <select id="sponsor-product" className="p-2 border border-gray-300 rounded text-xs outline-none focus:border-[#E65100]">
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      <button onClick={async () => {
                        const sel = (document.getElementById('sponsor-product') as HTMLSelectElement)?.value;
                        if (!sel) return;
                        const until = new Date(Date.now() + 7 * 24 * 3600000).toISOString();
                        const { error } = await supabase.from('products').update({ is_sponsored: true, sponsored_until: until }).eq('id', sel).eq('seller_id', user!.id);
                        if (!error) toastSuccess('Sponsored listing activated for 7 days!');
                        else toast('Failed to activate sponsorship: ' + error.message, 'error');
                      }} className="bg-[#E65100] hover:bg-[#F57C00] text-white px-4 py-2 rounded text-xs font-bold transition-colors">Sponsor Now — ₹999/week</button>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">Add products first to sponsor them.</p>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-4 bg-[#FFF3E0] border border-[#FFE0B2] rounded-lg p-4 text-[12px] text-[#E65100]">
              💳 Boost charges are deducted from your seller wallet. Ensure sufficient balance before activating.
            </div>
          </>
        );
      default:
        return (
          <>
            <div className="text-xl font-black text-[#0D47A1] mb-4">⚙️ {tab.charAt(0).toUpperCase() + tab.slice(1)}</div>
            <div className="bg-white rounded-[10px] p-5 shadow-sm text-gray-500">
              This section is under development. Coming soon!
            </div>
          </>
        );
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-115px)] bg-[#F5F5F5]">
      {/* Sidebar */}
      <div className="w-full md:w-[220px] bg-[#1A1A2E] text-white flex flex-col shrink-0">
        <div className="p-4 border-b border-white/10 flex items-center gap-2">
          <div className="bg-[#F57C00] w-8 h-8 rounded-t-md rounded-b-xl flex items-center justify-center text-white shrink-0">
            <ShoppingBag size={18} />
          </div>
          <div>
            <div className="text-lg font-black leading-none">BYNDIO</div>
            <div className="text-[10px] opacity-50 uppercase tracking-widest mt-0.5">Seller Center</div>
          </div>
        </div>
        <div className="py-2 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] transition-colors border-l-[3px] ${tab === item.id ? 'bg-white/10 text-white border-[#FF9800]' : 'text-white/70 border-transparent hover:bg-white/5 hover:text-white'}`}
              >
                <Icon size={16} /> {item.label}
              </button>
            );
          })}
        </div>
        <div className="p-4 border-t border-white/10">
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <div className="text-[10px] opacity-50 uppercase mb-1">Current Plan</div>
            <div className="text-[13px] font-bold text-[#FF9800]">PRO PLAN</div>
            <button onClick={() => setTab('settings')} className="mt-2 text-[11px] text-white/60 hover:text-white underline">Upgrade</button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto">
        {renderContent()}
      </div>

      {showBulkUpload && (
        <BulkUpload
          onClose={() => setShowBulkUpload(false)}
          onSuccess={() => { fetchDashboardData(); setShowBulkUpload(false); }}
        />
      )}

      {/* FIX #5: Edit Product Modal */}
      {showEditProduct && editingProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl relative">
            <button onClick={() => { setShowEditProduct(false); setEditingProduct(null); }} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
            <h3 className="text-lg font-bold text-[#0D47A1] mb-4">Edit Product</h3>
            <form onSubmit={handleEditProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Product Name</label>
                <input required type="text" value={editingProduct.name} onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })} className="p-2 border border-gray-300 rounded-md text-sm outline-none focus:border-[#1565C0]" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Category</label>
                <select value={editingProduct.category} onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })} className="p-2 border border-gray-300 rounded-md text-sm outline-none focus:border-[#1565C0] bg-white">
                  <option>Electronics</option><option>Fashion</option><option>Home</option><option>Beauty</option><option>Sports</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Selling Price (₹)</label>
                <input required type="number" value={editingProduct.price} onChange={e => setEditingProduct({ ...editingProduct, price: e.target.value })} className="p-2 border border-gray-300 rounded-md text-sm outline-none focus:border-[#1565C0]" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase">MRP (₹)</label>
                <input required type="number" value={editingProduct.mrp} onChange={e => setEditingProduct({ ...editingProduct, mrp: e.target.value })} className="p-2 border border-gray-300 rounded-md text-sm outline-none focus:border-[#1565C0]" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Stock Quantity</label>
                <input required type="number" value={editingProduct.stock_quantity} onChange={e => setEditingProduct({ ...editingProduct, stock_quantity: e.target.value })} className="p-2 border border-gray-300 rounded-md text-sm outline-none focus:border-[#1565C0]" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Image Emoji/URL</label>
                <input required type="text" value={editingProduct.images} onChange={e => setEditingProduct({ ...editingProduct, images: e.target.value })} className="p-2 border border-gray-300 rounded-md text-sm outline-none focus:border-[#1565C0]" />
              </div>
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Description</label>
                <textarea required rows={3} value={editingProduct.description || ''} onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })} className="p-2 border border-gray-300 rounded-md text-sm outline-none focus:border-[#1565C0]"></textarea>
              </div>
              <div className="md:col-span-2 flex justify-end gap-2 mt-2">
                <button type="button" onClick={() => { setShowEditProduct(false); setEditingProduct(null); }} className="border border-gray-300 text-gray-600 px-5 py-2 rounded-md font-bold text-sm hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="bg-[#0D47A1] hover:bg-[#1565C0] disabled:bg-gray-400 text-white px-6 py-2 rounded-md font-bold text-sm transition-colors">
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
