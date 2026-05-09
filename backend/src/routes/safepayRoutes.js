const express = require('express');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');
const { protect } = require('../middleware/auth');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const { initiatePaymentHold } = require('../utils/paymentCron');

const SAFEPAY_ENV = process.env.SAFEPAY_ENV || 'sandbox';
const SAFEPAY_BASE_URL = SAFEPAY_ENV === 'sandbox'
    ? 'https://sandbox.api.getsafepay.com'
    : 'https://api.getsafepay.com';
const SAFEPAY_API_KEY = process.env.SAFEPAY_API_KEY;
const SAFEPAY_SECRET_KEY = process.env.SAFEPAY_SECRET_KEY;

// ─── Helper: Create Safepay tracker (payment session) ───────────────────────
const createTracker = async (amount) => {
    const response = await axios.post(
        `${SAFEPAY_BASE_URL}/order/v1/init`,
        {
            merchant_api_key: SAFEPAY_API_KEY,
            intent: 'CYBERSOURCE',
            mode: 'payment',
            currency: 'PKR',
            amount: Math.round(amount * 100), // Amount in paisa
        },
        {
            headers: {
                'Content-Type': 'application/json',
            }
        }
    );
    return response.data;
};

// ─── POST /api/v1/safepay/create-session ────────────────────────────────────
// Creates a Safepay payment tracker token for the frontend
// @access Private (User)
router.post('/create-session', protect, async (req, res) => {
    try {
        const { orderId } = req.body;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Verify order belongs to this user
        if (order.customerId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        // Create Safepay tracker
        const trackerData = await createTracker(order.totalAmount);
        const tracker = trackerData?.data?.token;

        if (!tracker) {
            return res.status(500).json({ success: false, message: 'Failed to create payment session' });
        }

        // Store tracker on payment record
        await Payment.findOneAndUpdate(
            { orderId: order._id },
            { transactionId: tracker, paymentMethod: 'safepay' },
        );

        const checkoutUrl = SAFEPAY_ENV === 'sandbox'
            ? `https://sandbox.api.getsafepay.com/checkout/pay?tbt=${tracker}&env=sandbox`
            : `https://checkout.getsafepay.com/checkout/pay?tbt=${tracker}`;

        res.json({
            success: true,
            tracker,
            checkoutUrl,
        });

    } catch (error) {
        console.error('Safepay create-session error:', error?.response?.data || error.message);
        res.status(500).json({ success: false, message: 'Payment session creation failed' });
    }
});

// ─── POST /api/v1/safepay/webhook ───────────────────────────────────────────
// Safepay sends payment confirmation here
// @access Public (called by Safepay servers)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
        const payload = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
        const safepaySignature = req.headers['x-sfpy-signature'];

        // Verify webhook signature (optional but recommended in production)
        if (SAFEPAY_SECRET_KEY && safepaySignature) {
            const expectedSig = crypto
                .createHmac('sha256', SAFEPAY_SECRET_KEY)
                .update(payload)
                .digest('hex');
            if (expectedSig !== safepaySignature) {
                return res.status(400).json({ success: false, message: 'Invalid signature' });
            }
        }

        const event = JSON.parse(payload);
        console.log('Safepay Webhook Event:', event?.type);

        // Payment successful
        if (event?.type === 'payment:created' || event?.data?.state === 'paid') {
            const tracker = event?.data?.tracker?.token;
            if (!tracker) return res.status(200).json({ received: true });

            // Find payment by tracker (transactionId)
            const payment = await Payment.findOne({ transactionId: tracker });
            if (!payment) {
                console.warn('No payment found for tracker:', tracker);
                return res.status(200).json({ received: true });
            }

            // Update payment to held status (Admin hold system)
            if (payment.paymentStatus === 'pending') {
                payment.paymentStatus = 'pending'; // Will be set to held on delivery
                await payment.save();

                // Update order payment status
                await Order.findByIdAndUpdate(payment.orderId, {
                    paymentStatus: 'paid',
                    $push: {
                        statusHistory: {
                            status: 'payment_confirmed',
                            note: 'Payment confirmed via Safepay'
                        }
                    }
                });

                console.log(`Payment confirmed for order: ${payment.orderId}`);
            }
        }

        res.status(200).json({ received: true });
    } catch (error) {
        console.error('Safepay webhook error:', error.message);
        res.status(500).json({ success: false, message: 'Webhook processing failed' });
    }
});

// ─── GET /api/v1/safepay/verify/:tracker ────────────────────────────────────
// Frontend calls this after redirect to confirm payment
// @access Private (User)
router.get('/verify/:tracker', protect, async (req, res) => {
    try {
        const { tracker } = req.params;

        // Check Safepay for payment status
        const response = await axios.get(
            `${SAFEPAY_BASE_URL}/order/v1/tracker/${tracker}`,
            {
                headers: {
                    'Authorization': `Bearer ${SAFEPAY_API_KEY}`
                }
            }
        );

        const status = response.data?.data?.state;
        const isPaid = status === 'paid';

        if (isPaid) {
            // Find and update payment
            const payment = await Payment.findOne({ transactionId: tracker });
            if (payment && payment.paymentStatus === 'pending') {
                await Order.findByIdAndUpdate(payment.orderId, {
                    paymentStatus: 'paid'
                });
            }
        }

        res.json({
            success: true,
            paid: isPaid,
            status
        });

    } catch (error) {
        console.error('Safepay verify error:', error?.response?.data || error.message);
        res.status(500).json({ success: false, message: 'Verification failed' });
    }
});

module.exports = router;
