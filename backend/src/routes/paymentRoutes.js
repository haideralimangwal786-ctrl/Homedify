const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Payment = require('../models/Payment');
const Withdrawal = require('../models/Withdrawal');
const Order = require('../models/Order');
const Seller = require('../models/Seller');

// @desc    Admin: Get all payments
// @route   GET /api/v1/payments
// @access  Private (Admin)
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { status, sellerId } = req.query;
    const filter = {};
    if (status) filter.paymentStatus = status;
    if (sellerId) filter.sellerId = sellerId;

    const payments = await Payment.find(filter)
      .populate('orderId')
      .populate('customerId', 'name email')
      .populate('sellerId', 'storeName')
      .sort({ createdAt: -1 })
      .limit(200);
    res.json({ success: true, count: payments.length, data: payments });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Seller: Get own income payments
// @route   GET /api/v1/payments/seller
// @access  Private (Seller/Admin)
router.get('/seller', protect, authorize('seller', 'admin'), async (req, res) => {
  try {
    const seller = await Seller.findOne({ userId: req.user.id });
    if (!seller) {
      return res.status(400).json({ success: false, message: 'Seller profile not found' });
    }
    const payments = await Payment.find({ sellerId: seller._id })
      .populate('orderId')
      .sort({ createdAt: -1 });

    // Calculate balances
    const availableBalance = seller.availableBalance || 0;
    const pendingBalance = seller.pendingBalance || 0;

    res.json({
      success: true,
      count: payments.length,
      data: payments,
      balances: {
        available: availableBalance,
        pending: pendingBalance,
        total: seller.totalEarnings || 0
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Admin: Release payment to seller
// @route   PUT /api/v1/payments/:id/release
// @access  Private (Admin)
router.put('/:id/release', protect, authorize('admin'), async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    const order = await Order.findById(payment.orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Related order not found' });
    }

    // Check if payment is eligible for release
    if (payment.paymentStatus !== 'held') {
      return res.status(400).json({
        success: false,
        message: 'Payment must be in held status to release'
      });
    }

    // Release payment
    payment.paymentStatus = 'released';
    payment.releasedAt = Date.now();
    payment.releasedBy = req.user.id;
    await payment.save();

    // Update seller balances
    const seller = await Seller.findById(payment.sellerId);
    if (seller) {
      seller.pendingBalance = Math.max(0, seller.pendingBalance - payment.sellerAmount);
      seller.availableBalance += payment.sellerAmount;
      seller.totalEarnings += payment.sellerAmount;
      await seller.save();
    }

    res.json({ success: true, data: payment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Seller: Request withdrawal
// @route   POST /api/v1/payments/withdraw
// @access  Private (Seller)
router.post('/withdraw', protect, authorize('seller'), async (req, res) => {
  try {
    const { amount, bankDetails } = req.body;

    const seller = await Seller.findOne({ userId: req.user.id });
    if (!seller) {
      return res.status(400).json({ success: false, message: 'Seller profile not found' });
    }

    // Validate amount
    if (!amount || amount < 1000) {
      return res.status(400).json({
        success: false,
        message: 'Minimum withdrawal amount is PKR 1,000'
      });
    }

    if (amount > seller.availableBalance) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient available balance'
      });
    }

    // Validate bank details
    if (!bankDetails || !bankDetails.bankName || !bankDetails.accountTitle || !bankDetails.accountNumber) {
      return res.status(400).json({
        success: false,
        message: 'Please provide complete bank details'
      });
    }

    // Create withdrawal request
    const withdrawal = await Withdrawal.create({
      sellerId: seller._id,
      amount,
      bankDetails,
      status: 'pending'
    });

    // Deduct from available balance (reserve)
    seller.availableBalance -= amount;
    await seller.save();

    res.status(201).json({
      success: true,
      data: withdrawal,
      message: 'Withdrawal request submitted successfully'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Seller: Get withdrawal requests
// @route   GET /api/v1/payments/withdrawals
// @access  Private (Seller)
router.get('/withdrawals', protect, authorize('seller'), async (req, res) => {
  try {
    const seller = await Seller.findOne({ userId: req.user.id });
    if (!seller) {
      return res.status(400).json({ success: false, message: 'Seller profile not found' });
    }

    const withdrawals = await Withdrawal.find({ sellerId: seller._id })
      .sort({ createdAt: -1 });

    res.json({ success: true, count: withdrawals.length, data: withdrawals });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Admin: Get all withdrawal requests
// @route   GET /api/v1/payments/withdrawals/all
// @access  Private (Admin)
router.get('/withdrawals/all', protect, authorize('admin'), async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};

    const withdrawals = await Withdrawal.find(filter)
      .populate('sellerId', 'storeName userId')
      .populate({
        path: 'sellerId',
        populate: {
          path: 'userId',
          select: 'name email contactNumber'
        }
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, count: withdrawals.length, data: withdrawals });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Admin: Approve withdrawal
// @route   PUT /api/v1/payments/withdrawals/:id/approve
// @access  Private (Admin)
router.put('/withdrawals/:id/approve', protect, authorize('admin'), async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal) {
      return res.status(404).json({ success: false, message: 'Withdrawal not found' });
    }

    if (withdrawal.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending withdrawals can be approved'
      });
    }

    withdrawal.status = 'approved';
    withdrawal.processedAt = Date.now();
    withdrawal.processedBy = req.user.id;
    withdrawal.adminNotes = req.body.adminNotes || '';
    await withdrawal.save();

    // Update seller
    const seller = await Seller.findById(withdrawal.sellerId);
    if (seller) {
      seller.totalWithdrawn += withdrawal.amount;
      await seller.save();
    }

    res.json({ success: true, data: withdrawal });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Admin: Reject withdrawal
// @route   PUT /api/v1/payments/withdrawals/:id/reject
// @access  Private (Admin)
router.put('/withdrawals/:id/reject', protect, authorize('admin'), async (req, res) => {
  try {
    const { rejectionReason } = req.body;

    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal) {
      return res.status(404).json({ success: false, message: 'Withdrawal not found' });
    }

    if (withdrawal.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending withdrawals can be rejected'
      });
    }

    withdrawal.status = 'rejected';
    withdrawal.processedAt = Date.now();
    withdrawal.processedBy = req.user.id;
    withdrawal.rejectionReason = rejectionReason || 'Not specified';
    await withdrawal.save();

    // Return amount to seller's available balance
    const seller = await Seller.findById(withdrawal.sellerId);
    if (seller) {
      seller.availableBalance += withdrawal.amount;
      await seller.save();
    }

    res.json({ success: true, data: withdrawal });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
