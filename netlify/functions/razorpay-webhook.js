// ================================================================
// RAZORPAY WEBHOOK HANDLER
// Handles payment.captured, payment.failed, order.paid events
// CRITICAL: Verifies X-Razorpay-Signature header
// ================================================================
const crypto = require('crypto');
const https = require('https');
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': 'https://byndio.in',
    'Access-Control-Allow-Headers': 'Content-Type, X-Razorpay-Signature',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  // Initialize Supabase with service role (admin access)
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    const signature = event.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      console.error('[razorpay-webhook] Missing signature or webhook secret');
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing verification' }) };
    }

    // Verify webhook signature using timing-safe comparison
    const expectedSig = crypto
      .createHmac('sha256', webhookSecret)
      .update(event.body)
      .digest('hex');

    const sigBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expectedSig, 'hex');

    if (sigBuffer.length !== expectedBuffer.length || 
        !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
      console.error('[razorpay-webhook] Invalid signature');
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid signature' }) };
    }

    const payload = JSON.parse(event.body);
    const eventType = payload.event;

    console.log('[razorpay-webhook] Received event:', eventType);

    // Handle payment events
    if (eventType === 'payment.captured') {
      const payment = payload.payload?.payment?.entity;
      if (!payment) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid payload' }) };
      }

      console.log('[razorpay-webhook] Payment captured:', payment.id, 'Amount:', payment.amount);

      // Find order by payment_id
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('id, buyer_id, total_amount, status')
        .eq('payment_id', payment.id)
        .single();

      if (orderError) {
        console.error('[razorpay-webhook] Order not found for payment:', payment.id);
      } else if (order) {
        // Update order status to paid
        await supabase.from('orders').update({
          payment_status: 'paid',
          status: 'processing',
          updated_at: new Date().toISOString()
        }).eq('id', order.id);

        console.log('[razorpay-webhook] Order updated to paid:', order.id);

        // Get order items to decrement stock
        const { data: orderItems } = await supabase
          .from('order_items')
          .select('product_id, quantity, seller_id')
          .eq('order_id', order.id);

        // Decrement stock for each product
        for (const item of orderItems || []) {
          await supabase.rpc('decrement_stock', {
            p_product_id: item.product_id,
            p_qty: item.quantity
          });
        }

        // Send order confirmation email (placeholder)
        console.log('[razorpay-webhook] Would send email to buyer:', order.buyer_id);
      }
    }

    if (eventType === 'payment.failed') {
      const payment = payload.payload?.payment?.entity;
      console.log('[razorpay-webhook] Payment failed:', payment?.id);

      // Find and update order
      const { data: order } = await supabase
        .from('orders')
        .select('id')
        .eq('payment_id', payment?.id)
        .single();

      if (order) {
        await supabase.from('orders').update({
          payment_status: 'failed',
          status: 'cancelled',
          updated_at: new Date().toISOString()
        }).eq('id', order.id);
      }
    }

    if (eventType === 'order.paid') {
      const order = payload.payload?.order?.entity;
      console.log('[razorpay-webhook] Order paid:', order?.id);
    }

    return { statusCode: 200, headers, body: JSON.stringify({ received: true }) };
  } catch (err) {
    console.error('[razorpay-webhook] Error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Webhook processing failed' }) };
  }
};
