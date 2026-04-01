// ================================================================
// CREATE RAZORPAY ORDER SERVER-SIDE
// Razorpay requires orders to be created server-side with your
// secret key so the amount cannot be tampered by the client
// ================================================================
const https = require('https');
const crypto = require('crypto');
const { rateLimit } = require('./_rateLimit');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': 'https://byndio.in',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  // Rate limit: max 30 order creations per IP per minute
  const ip = event.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';
  if (!rateLimit(`razorpay-order:${ip}`, 30, 60_000)) {
    return { statusCode: 429, headers, body: JSON.stringify({ error: 'Too many requests. Please try again.' }) };
  }

  try {
    const { amount, currency = 'INR', receipt } = JSON.parse(event.body || '{}');

    if (!amount || amount < 100) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid amount' }) };
    }

    const keyId     = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Payment gateway not configured' }) };
    }

    const orderData = JSON.stringify({ amount, currency, receipt: receipt || `rcpt_${crypto.randomUUID()}` });
    const auth      = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

    const rzpOrder = await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'api.razorpay.com',
        path: '/v1/orders',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${auth}`,
          'Content-Length': Buffer.byteLength(orderData),
        },
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve(JSON.parse(body)));
      });
      req.on('error', reject);
      req.write(orderData);
      req.end();
    });

    if (rzpOrder.error) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: rzpOrder.error.description }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ orderId: rzpOrder.id, amount: rzpOrder.amount }) };
  } catch (err) {
    console.error('[razorpay-order]', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to create order' }) };
  }
};
