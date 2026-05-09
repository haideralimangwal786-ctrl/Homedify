const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Order = require('../models/Order');
const Seller = require('../models/Seller');
const Payment = require('../models/Payment');
const Product = require('../models/Product');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { initiatePaymentHold } = require('../utils/paymentCron');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.resolve('uploads');
        fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
        cb(null, 'receipt-' + Date.now() + ext);
    }
});
const upload = multer({ storage: storage });

// @desc    Create new order
// @route   POST /api/v1/orders
// @access  Private
router.post('/', protect, upload.single('paymentScreenshot'), async (req, res) => {
  try {
    let { items, paymentMethod, deliveryAddress, deliveryType, deliveryCharges = 0, transactionId, senderNumber } = req.body;

    // Parse stringified JSON fields from FormData
    if (typeof items === 'string') items = JSON.parse(items);
    if (typeof deliveryAddress === 'string') deliveryAddress = JSON.parse(deliveryAddress);

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items in order' });
    }

    // Auto-resolve missing sellerIds from Product DB
    for (const item of items) {
      if (!item.sellerId || item.sellerId === 'null' || item.sellerId === '[object Object]') {
        const product = await Product.findById(item.productId).select('sellerId');
        if (product && product.sellerId) {
          item.sellerId = String(product.sellerId);
        } else {
          return res.status(400).json({
            success: false,
            message: `Product "${item.productName || item.productId}" has no seller assigned. Please contact support.`
          });
        }
      }
    }

    // Group items by seller
    const sellerGroups = items.reduce((groups, item) => {
      const sellerId = item.sellerId;
      if (!groups[sellerId]) groups[sellerId] = [];
      groups[sellerId].push(item);
      return groups;
    }, {});

    const createdOrders = [];
    const createdPayments = [];

    const isManualPayment = paymentMethod !== 'cod';
    const initialStatus = isManualPayment ? 'pending_payment' : 'confirmed';
    const initialPaymentStatus = isManualPayment ? 'pending_verification' : 'pending';
    const paymentScreenshot = req.file ? `/uploads/${req.file.filename}` : '';

    for (const sellerId of Object.keys(sellerGroups)) {
      const sellerItems = sellerGroups[sellerId];
      const subtotal = sellerItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const total = subtotal + (Number(deliveryCharges) || 0);

      const order = new Order({
        customerId: req.user.id,
        sellerId: sellerId,
        orderItems: sellerItems.map(i => ({
          productId: i.productId,
          productName: i.productName,
          productImage: i.productImage,
          quantity: i.quantity,
          price: i.price,
          subtotal: i.price * i.quantity
        })),
        deliveryAddress,
        deliveryType: deliveryType || 'courier',
        subtotal,
        deliveryCharges: Number(deliveryCharges) || 0,
        total,
        status: initialStatus,
        paymentStatus: initialPaymentStatus,
        paymentScreenshot: paymentScreenshot,
        transactionId: transactionId || '',
        senderNumber: senderNumber || '',
        statusHistory: [{ status: initialStatus, note: 'Order placed by customer' }]
      });

      await order.save();
      createdOrders.push(order);

      // Create payment record
      const GlobalSettings = require('../models/GlobalSettings');
      let settings = await GlobalSettings.findOne();
      const commissionRate = settings ? settings.commissionRate : 10;
      
      const platformCommission = subtotal * (commissionRate / 100);
      const sellerAmount = total - platformCommission;

      const payment = new Payment({
        orderId: order._id,
        customerId: req.user.id,
        sellerId: sellerId,
        amount: total,
        platformCommission,
        sellerAmount,
        commissionRate, // Store the rate applied at time of order
        paymentMethod: paymentMethod || 'cod',
        paymentStatus: initialPaymentStatus,
        transactionId: transactionId || '',
        senderNumber: senderNumber || ''
      });
      await payment.save();

      order.adminCommission = platformCommission;
      order.sellerPayable = sellerAmount;
      order.paymentId = payment._id;
      await order.save();

      createdPayments.push(payment);
    }
    
    // Send Notifications after all orders are created
    for (const order of createdOrders) {
      try {
        // 1. Notify Seller
        const seller = await Seller.findById(order.sellerId);
        if (seller) {
          const pName = order.orderItems?.[0]?.productName || 'your items';
          await Notification.create({
            userId: seller.userId,
            message: `🛒 New Order for "${pName}"! A customer has placed a new order.`,
            type: 'order',
            link: '/seller/orders'
          });
        }

        // 2. Notify Admins if manual payment needs verification
        if (order.paymentStatus === 'pending_verification') {
          const admins = await User.find({ role: 'admin' });
          for (const admin of admins) {
            await Notification.create({
              userId: admin._id,
              message: `💰 Payment Verification Required! A new payment proof has been submitted for review.`,
              type: 'payment',
              link: '/admin/orders'
            });
          }
        }
      } catch (notifErr) {
        console.error('Notification creation failed during order process:', notifErr);
      }
    }

    res.status(201).json({ success: true, orders: createdOrders, payments: createdPayments });
  } catch (err) {
    console.error('Order creation error:', err);
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message).join(', ');
      return res.status(400).json({ success: false, message: 'Invalid data: ' + messages });
    }
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: `Invalid ID format for field: ${err.path}` });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Get seller orders
// @route   GET /api/v1/orders/seller
// @access  Private (Seller/Admin)
router.get('/seller', protect, authorize('seller', 'admin'), async (req, res) => {
  try {
    const seller = await Seller.findOne({ userId: req.user.id });
    if (!seller) {
      return res.status(400).json({ success: false, message: 'Seller profile not found' });
    }

    const { status } = req.query;
    const filter = { sellerId: seller._id };
    if (status) filter.status = status;

    const orders = await Order.find(filter)
      .populate('customerId', 'name email contactNumber')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Get user orders
// @route   GET /api/v1/orders/user
// @access  Private
router.get('/user', protect, async (req, res) => {
  try {
    const orders = await Order.find({ customerId: req.user.id })
      .populate('sellerId', 'storeName')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Get orders by userId query param (admin/API consumers) or own orders
// @route   GET /api/v1/orders?userId=123
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { userId, status, deliveryType, page = 1, limit = 20 } = req.query;

    // Admins can query any user; customers can only see their own
    let targetUserId;
    if (userId && req.user.role === 'admin') {
      targetUserId = userId;
    } else {
      targetUserId = req.user.id;
    }

    const filter = { customerId: targetUserId };
    if (status) filter.status = status;
    if (deliveryType) filter.deliveryType = deliveryType;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Order.countDocuments(filter);

    const orders = await Order.find(filter)
      .populate('sellerId', 'storeName contactNumber')
      .populate('paymentId', 'paymentMethod paymentStatus')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: orders.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: orders
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Get order status only (lightweight — for Track Order)
// @route   GET /api/v1/orders/:id/status
// @access  Private
router.get('/:id/status', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .select('orderId status statusHistory estimatedDelivery deliveredAt trackingNumber deliveryType customerId');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Only owner or admin can track
    if (String(order.customerId) !== String(req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    res.json({
      success: true,
      data: {
        orderId: order.orderId,
        status: order.status,
        statusHistory: order.statusHistory,
        estimatedDelivery: order.estimatedDelivery,
        deliveredAt: order.deliveredAt,
        trackingNumber: order.trackingNumber,
        deliveryType: order.deliveryType
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Get single order
// @route   GET /api/v1/orders/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customerId', 'name email contactNumber address')
      .populate('sellerId', 'storeName contactNumber')
      .populate('paymentId');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Check authorization
    const seller = await Seller.findOne({ userId: req.user.id });
    const isOwner = String(order.customerId._id) === String(req.user.id);
    const isSeller = seller && String(order.sellerId._id) === String(seller._id);
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isSeller && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Seller: Accept order
// @route   PUT /api/v1/orders/:id/accept
// @access  Private (Seller)
router.put('/:id/accept', protect, authorize('seller'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const seller = await Seller.findOne({ userId: req.user.id });
    if (String(order.sellerId) !== String(seller._id)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    if (order.status !== 'confirmed') {
      return res.status(400).json({ success: false, message: 'Order must be in confirmed status' });
    }

    order.status = 'seller_accepted';
    order.statusHistory.push({ status: 'seller_accepted', note: 'Order accepted by seller' });
    await order.save();

    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Seller: Mark order as preparing
// @route   PUT /api/v1/orders/:id/prepare
// @access  Private (Seller)
router.put('/:id/prepare', protect, authorize('seller'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const seller = await Seller.findOne({ userId: req.user.id });
    if (String(order.sellerId) !== String(seller._id)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    if (!['confirmed', 'seller_accepted'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Order must be confirmed/accepted to prepare' });
    }

    order.status = 'preparing';
    order.statusHistory.push({ status: 'preparing', note: 'Seller is preparing your order' });
    await order.save();

    // Notify customer
    await Notification.create({
      userId: order.customerId,
      message: `📦 Your order is being prepared by the seller.`,
      type: 'order',
      link: `/customer/orders/${order._id}`
    });

    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Seller: Reject order
// @route   PUT /api/v1/orders/:id/reject
// @access  Private (Seller)
router.put('/:id/reject', protect, authorize('seller'), async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const seller = await Seller.findOne({ userId: req.user.id });
    if (String(order.sellerId) !== String(seller._id)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    order.status = 'cancelled_by_seller';
    order.cancelledAt = Date.now();
    order.cancelledBy = 'seller';
    order.cancellationReason = reason || 'Seller rejected order';
    order.statusHistory.push({ status: 'cancelled_by_seller', note: reason || 'Seller rejected order' });
    await order.save();

    // Refund payment if applicable
    const payment = await Payment.findById(order.paymentId);
    if (payment && payment.paymentStatus !== 'pending') {
      payment.paymentStatus = 'refunded';
      payment.refundReason = reason || 'Order rejected by seller';
      payment.refundedDate = Date.now();
      await payment.save();
    }

    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Confirm delivery
// @route   PUT /api/v1/orders/:id/confirm-delivery
// @access  Private
router.put('/:id/confirm-delivery', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (String(order.customerId) !== String(req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    if (order.status !== 'shipped') {
      return res.status(400).json({ success: false, message: 'Order must be shipped before confirming delivery' });
    }

    order.status = 'delivered';
    order.deliveredAt = Date.now();
    order.deliveryConfirmedAt = Date.now();
    order.deliveryConfirmedBy = req.user.id;

    order.statusHistory.push({ status: 'delivered', note: 'Delivery confirmed by customer' });

    // Initiate payment hold (3-day release period) then log admin notification
    await initiatePaymentHold(order._id);

    // Admin notification entry — paper trail in statusHistory
    order.statusHistory.push({
      status: 'delivered',
      note: `Payment release triggered — admin notified. Release scheduled in 3 days.`
    });

    await order.save();

    res.json({
      success: true,
      message: 'Delivery confirmed. Payment hold initiated. Admin notified.',
      data: order
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Update order status
// @route   PUT /api/v1/orders/:id/status
// @access  Private (Seller/Admin)
router.put('/:id/status', protect, authorize('seller', 'admin'), upload.single('shippingReceipt'), async (req, res) => {
  try {
    const { status, note, trackingNumber, estimatedDelivery } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (req.user.role !== 'admin') {
      const seller = await Seller.findOne({ userId: req.user.id });
      if (String(order.sellerId) !== String(seller._id)) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
    }

    if (status) {
      order.status = status;
      order.statusHistory.push({ status, note: note || `Status updated to ${status}` });

      if (status === 'completed') order.completedAt = Date.now();
      if (status === 'shipped') order.shippedAt = Date.now();
      if (status === 'cancelled_by_seller' || status === 'cancelled_by_customer') {
        order.cancelledAt = Date.now();
        order.cancelledBy = status === 'cancelled_by_seller' ? 'seller' : 'customer';
        order.cancellationReason = note || 'Order cancelled';
      }
      if (status === 'delivered') {
        order.deliveredAt = Date.now();
        await initiatePaymentHold(order._id);
      }

      // Send notification to customer
      const pName = order.orderItems?.[0]?.productName || 'your order';
      const notifMessages = {
        processing: `📦 Your order for "${pName}" is being prepared by the seller.`,
        shipped: `🚚 Great news! Your order has been shipped.`,
        delivered: `✅ Your order has been marked as delivered. Please confirm receipt.`,
        cancelled_by_seller: `❌ Unfortunately, your order was cancelled by the seller.`,
        seller_accepted: `✔️ Your order has been accepted by the seller.`
      };
      const notifLinks = {
        processing: `/customer/orders/${order._id}`,
        shipped: `/customer/track/${order._id}`,
        delivered: `/customer/orders/${order._id}`,
        cancelled_by_seller: `/customer/orders`,
        seller_accepted: `/customer/orders/${order._id}`
      };
      if (notifMessages[status]) {
        await Notification.create({
          userId: order.customerId,
          message: notifMessages[status],
          type: 'order',
          link: notifLinks[status] || '/customer/orders'
        });
      }
    }

    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (estimatedDelivery) order.estimatedDelivery = estimatedDelivery;
    
    // Handle shipping receipt file
    if (req.file) {
      order.shippingReceipt = `/uploads/${req.file.filename}`;
    }

    await order.save();
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Simulate Payment (Escrow Hold)
// @route   PUT /api/v1/orders/:id/pay
// @access  Private
router.put('/:id/pay', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (String(order.customerId) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Update Order
    order.status = 'paid';
    order.paymentStatus = 'held_in_escrow';
    order.statusHistory.push({ status: 'paid', note: 'Payment received and held in escrow' });
    await order.save();

    // Update Payment record
    const payment = await Payment.findOne({ orderId: order._id });
    if (payment) {
      payment.paymentStatus = 'held';
      payment.heldAt = Date.now();
      await payment.save();
    }

    res.json({ success: true, message: 'Payment successful, funds held in escrow' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Cancel order (Customer)
// @route   PUT /api/v1/orders/:id/cancel
// @access  Private
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (String(order.customerId) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    // Can only cancel if not shipped
    if (['shipped', 'delivered', 'completed'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel order after shipping' });
    }

    order.status = 'cancelled_by_customer';
    order.cancelledAt = Date.now();
    order.cancelledBy = 'customer';
    order.cancellationReason = reason || 'Cancelled by customer';
    order.statusHistory.push({ status: 'cancelled_by_customer', note: reason || 'Cancelled by customer' });
    await order.save();

    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Get all orders (Admin) — alias for /all/admin for AdminDashboard
// @route   GET /api/v1/orders/all
// @access  Private (Admin)
router.get('/all', protect, authorize('admin'), async (req, res) => {
  try {
    const { status, sellerId, customerId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (sellerId) filter.sellerId = sellerId;
    if (customerId) filter.customerId = customerId;

    const orders = await Order.find(filter)
      .populate('customerId', 'name email')
      .populate('sellerId', 'storeName')
      .sort({ createdAt: -1 })
      .limit(200);

    res.json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Get all orders (Admin)
// @route   GET /api/v1/orders/all/admin
// @access  Private (Admin)
router.get('/all/admin', protect, authorize('admin'), async (req, res) => {
  try {
    const { status, sellerId, customerId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (sellerId) filter.sellerId = sellerId;
    if (customerId) filter.customerId = customerId;

    const orders = await Order.find(filter)
      .populate('customerId', 'name email')
      .populate('sellerId', 'storeName')
      .sort({ createdAt: -1 })
      .limit(200);

    res.json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Customer: Re-upload payment proof after rejection
// @route   PUT /api/v1/orders/:id/re-upload-payment
// @access  Private (Customer)
router.put('/:id/re-upload-payment', protect, upload.single('paymentScreenshot'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Verify ownership
    if (String(order.customerId) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    // Only allow if payment failed
    if (order.status !== 'payment_failed') {
      return res.status(400).json({ success: false, message: 'Only failed payments can be re-uploaded' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a payment screenshot' });
    }

    const paymentScreenshot = `/uploads/${req.file.filename}`;
    
    order.paymentScreenshot = paymentScreenshot;
    order.paymentStatus = 'pending_verification';
    order.status = 'pending_payment';
    order.statusHistory.push({ 
      status: 'pending_payment', 
      note: 'Payment proof re-uploaded by customer. Awaiting Admin verification.' 
    });

    await order.save();

    // Update payment record
    await Payment.findOneAndUpdate(
      { orderId: order._id },
      { 
        paymentStatus: 'pending_verification',
        paymentScreenshot: paymentScreenshot,
        rejectionReason: '' 
      }
    );

    // Notify Admins
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      await Notification.create({
        userId: admin._id,
        message: `💰 Payment Re-uploaded! A customer has submitted a new payment proof for review.`,
        type: 'payment',
        link: '/admin/orders'
      });
    }

    res.json({ success: true, message: 'Payment proof re-uploaded successfully', data: order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Reject shipping receipt (Admin)
// @route   PUT /api/v1/orders/:id/reject-shipping
// @access  Private (Admin)
router.put('/:id/reject-shipping', protect, authorize('admin'), async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ success: false, message: 'Please provide a rejection reason' });

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (order.status !== 'shipped') {
      return res.status(400).json({ success: false, message: 'Only shipped orders can have their receipt rejected' });
    }

    // Backup current receipt for history note
    const oldReceipt = order.shippingReceipt;
    
    // Reset shipping data
    order.status = 'preparing';
    order.shippingReceipt = '';
    order.trackingNumber = '';
    order.rejectionReason = reason;
    order.statusHistory.push({ 
      status: 'preparing', 
      note: `Shipping receipt rejected by Admin. Reason: ${reason}` 
    });

    await order.save();

    // Notify seller
    const pNameReject = order.orderItems?.[0]?.productName || 'your order';
    await Notification.create({
      userId: order.sellerId,
      message: `⚠️ Your shipping receipt for "${pNameReject}" was rejected. Reason: ${reason}. Please upload a valid receipt.`,
      type: 'order',
      link: `/seller/orders`
    });

    res.json({ success: true, message: 'Shipping receipt rejected and seller notified', data: order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
