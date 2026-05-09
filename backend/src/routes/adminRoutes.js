const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Seller = require('../models/Seller');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Review = require('../models/Review');
const Content = require('../models/Content');
const Notification = require('../models/Notification');
const Withdrawal = require('../models/Withdrawal');
const Cart = require('../models/Cart');
const sendEmail = require('../utils/sendEmail');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer storage for financial proofs
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = 'uploads/finance';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, `proof-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage });

// @desc    Get detailed finance summary
// @route   GET /api/v1/admin/finance/summary
// @access  Private (Admin)
router.get('/finance/summary', protect, authorize('admin'), async (req, res) => {
  try {
    const allSellers = await Seller.find();
    const allPayments = await Payment.find();
    
    const totalEscrow = allSellers.reduce((acc, s) => acc + (s.pendingBalance || 0), 0);
    const totalPaid_base = allSellers.reduce((acc, s) => acc + (s.totalWithdrawn || 0), 0);
    const availableToWithdraw = allSellers.reduce((acc, s) => acc + (s.availableBalance || 0), 0);
    
    // Platform revenue is the 5% (or 10%) commission from released payments
    const releasedPayments = allPayments.filter(p => p.paymentStatus === 'released');
    const totalPlatformRevenue = releasedPayments.reduce((acc, p) => acc + (p.platformCommission || (p.amount - p.sellerAmount) || 0), 0);
    const totalSales = allPayments.reduce((acc, p) => acc + p.amount, 0);

    // Total Paid to Sellers = Total Withdrawn via Withdrawal System + Total Manual Escrow Payouts
    const manualEscrowPayouts = releasedPayments.reduce((acc, p) => acc + (p.sellerAmount || 0), 0);
    const totalPaid = totalPaid_base + manualEscrowPayouts;

    res.json({
      success: true,
      data: {
        totalPlatformRevenue,
        totalEscrow,
        totalPaid,
        totalRefunds: allPayments.filter(p => p.paymentStatus === 'refunded').reduce((acc, p) => acc + p.amount, 0),
        availableToWithdraw,
        totalSales
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Get dashboard stats
// @route   GET /api/v1/admin/stats
// @access  Private (Admin)
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'customer' });
    const totalSellers = await Seller.countDocuments();
    const approvedSellers = await Seller.countDocuments({ verificationStatus: 'approved' });
    const pendingSellers = await Seller.countDocuments({ verificationStatus: { $in: ['pending_verification', 'ai_verified'] } });
    const totalOrders = await Order.countDocuments();
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ status: 'active' });
    const pendingProducts = await Product.countDocuments({ status: 'pending_approval' });
    const pendingReviews = await Review.countDocuments({ status: 'pending' });

    const releasedPayments = await Payment.find({ paymentStatus: 'released' });
    const totalRevenue = releasedPayments.reduce((acc, p) => acc + p.amount, 0);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalSellers,
        approvedSellers,
        pendingSellers,
        totalOrders,
        totalProducts,
        activeProducts,
        pendingProducts,
        pendingReviews,
        totalRevenue
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Get all customers with order stats and total spent
// @route   GET /api/v1/admin/users
// @access  Private (Admin)
router.get('/users', protect, authorize('admin'), async (req, res) => {
  try {
    const { isBlocked } = req.query;
    const filter = { role: 'customer' }; // Strictly show customers only
    if (isBlocked !== undefined) filter.isBlocked = isBlocked === 'true';

    const users = await User.find(filter).select('-password').sort({ createdAt: -1 }).lean();
    
    // Fetch stats for each customer
    const usersWithStats = await Promise.all(users.map(async (u) => {
      const orders = await Order.find({ customerId: u._id });
      const totalSpent = orders.reduce((sum, o) => sum + (o.total || 0), 0);
      return { ...u, totalOrders: orders.length, totalSpent };
    }));

    res.json({ success: true, count: usersWithStats.length, data: usersWithStats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Update user status (block/unblock)
// @route   PUT /api/v1/admin/users/:id/status
// @access  Private (Admin)
router.put('/users/:id/status', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.isBlocked = !user.isBlocked;
    await user.save();

    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Block/Unblock user (Legacy)
// @route   PUT /api/v1/admin/users/:id/block
// @access  Private (Admin)
router.put('/users/:id/block', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.isBlocked = !user.isBlocked;
    await user.save();

    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Get pending sellers
// @route   GET /api/v1/admin/sellers/pending
// @access  Private (Admin)
router.get('/sellers/pending', protect, authorize('admin'), async (req, res) => {
  try {
    const sellers = await Seller.find({
      verificationStatus: { $in: ['pending_verification', 'ai_verified'] }
    }).populate('userId', 'name email contactNumber');
    res.json({ success: true, count: sellers.length, data: sellers });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Get all sellers (approved/suspended/etc)
// @route   GET /api/v1/admin/sellers
// @access  Private (Admin)
router.get('/sellers', protect, authorize('admin'), async (req, res) => {
  try {
    const sellers = await Seller.find()
      .populate('userId', 'name email contactNumber')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: sellers.length, data: sellers });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Suspend/Unsuspend seller
// @route   PUT /api/v1/admin/sellers/:id/suspend
// @access  Private (Admin)
router.put('/sellers/:id/suspend', protect, authorize('admin'), async (req, res) => {
  try {
    const seller = await Seller.findById(req.params.id);
    if (!seller) return res.status(404).json({ success: false, message: 'Seller not found' });

    if (seller.verificationStatus === 'suspended') {
      seller.verificationStatus = 'approved';
    } else {
      seller.verificationStatus = 'suspended';
    }
    
    await seller.save();
    res.json({ success: true, data: seller });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Delete seller profile (Full Cascade)
// @route   DELETE /api/v1/admin/sellers/:id
// @access  Private (Admin)
router.delete('/sellers/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const seller = await Seller.findById(req.params.id);
    if (!seller) return res.status(404).json({ success: false, message: 'Seller not found' });

    const sellerId = seller._id;
    const userId = seller.userId; // ObjectId of the linked User document

    // 1. Get all product IDs belonging to this seller
    const sellerProducts = await Product.find({ sellerId }, '_id');
    const productIds = sellerProducts.map(p => p._id);

    // 2. Get all order IDs belonging to this seller (for logging)
    const sellerOrders = await Order.find({ sellerId }, '_id');
    const orderIds = sellerOrders.map(o => o._id);

    // 3. Delete all Reviews on this seller's products
    if (productIds.length > 0) {
      await Review.deleteMany({ productId: { $in: productIds } });
    }

    // 4. Delete all Payments linked to this seller
    await Payment.deleteMany({ sellerId });

    // 5. Delete all Orders linked to this seller
    await Order.deleteMany({ sellerId });

    // 6. Delete all Withdrawal requests by this seller
    await Withdrawal.deleteMany({ sellerId });

    // 7. Remove cart items containing this seller's products
    if (productIds.length > 0) {
      await Cart.updateMany(
        { 'items.productId': { $in: productIds } },
        { $pull: { items: { productId: { $in: productIds } } } }
      );
    }

    // 8. Delete all Notifications for this seller's user
    if (userId) {
      await Notification.deleteMany({ userId });
    }

    // 9. Delete all Products belonging to this seller
    await Product.deleteMany({ sellerId });

    // 10. Delete the Seller document directly (using deleteOne on the model to avoid hook conflicts)
    await Seller.deleteOne({ _id: sellerId });

    // 11. Delete the associated User account from the users collection
    // NOTE: We use User.deleteOne({ _id: userId }) directly to bypass the
    // User's pre('deleteOne') hook which would try to re-delete the already-removed Seller.
    if (userId) {
      const userDeleteResult = await User.deleteOne({ _id: userId });
      if (userDeleteResult.deletedCount === 0) {
        console.warn(`[ADMIN] Warning: User document for userId ${userId} was not found in users collection during seller delete.`);
      } else {
        console.log(`[ADMIN] Successfully deleted user document for userId ${userId} from users collection.`);
      }
    }

    console.log(`[ADMIN] Full cascade delete completed for seller ${sellerId}. Removed: ${productIds.length} products, ${orderIds.length} orders.`);

    res.json({
      success: true,
      message: 'Seller account and all associated records permanently deleted',
      deleted: {
        products: productIds.length,
        orders: orderIds.length
      }
    });
  } catch (err) {
    console.error('[ADMIN] Seller delete cascade error:', err);
    res.status(500).json({ success: false, message: 'Server error during deletion' });
  }
});

// @desc    Get seller verification details
// @route   GET /api/v1/admin/sellers/:id/verification
// @access  Private (Admin)
router.get('/sellers/:id/verification', protect, authorize('admin'), async (req, res) => {
  try {
    const seller = await Seller.findById(req.params.id).populate('userId', 'name email contactNumber address');
    if (!seller) return res.status(404).json({ success: false, message: 'Seller not found' });

    res.json({ success: true, data: seller });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Approve seller
// @route   PUT /api/v1/admin/sellers/:id/approve
// @access  Private (Admin)
router.put('/sellers/:id/approve', protect, authorize('admin'), async (req, res) => {
  try {
    const { adminNotes } = req.body;
    const seller = await Seller.findById(req.params.id);
    if (!seller) return res.status(404).json({ success: false, message: 'Seller not found' });

    seller.verificationStatus = 'approved';
    seller.isVerified = true;
    seller.adminNotes = adminNotes || '';
    seller.verificationHistory.push({
      status: 'approved',
      note: adminNotes || 'Approved by admin'
    });
    await seller.save();

    // Populate user to get email
    await seller.populate('userId', 'name email');

    // Send Approval Email
    try {
      if (seller.userId && seller.userId.email) {
        await sendEmail({
          email: seller.userId.email,
          subject: 'Congrats! Your Homedify Seller Dashboard is now active',
          html: `
            <p>Hi <strong>${seller.userId.name || 'Seller'}</strong>,</p>
            <p>Your seller application for <strong>${seller.storeName}</strong> has been <strong>approved</strong>.</p>
            <p>You can now start adding your products.</p>
            <p>Best regards,<br>The Homedify Team</p>
          `
        });
      }
    } catch (emailErr) {
      console.error('Email sending failed:', emailErr);
      // We don't fail the whole request if email fails, but maybe log it
    }

    res.json({ success: true, data: seller });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Reject seller
// @route   PUT /api/v1/admin/sellers/:id/reject
// @access  Private (Admin)
router.put('/sellers/:id/reject', protect, authorize('admin'), async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    const seller = await Seller.findById(req.params.id);
    if (!seller) return res.status(404).json({ success: false, message: 'Seller not found' });

    // Populate user to get email
    await seller.populate('userId', 'name email');

    // Send Rejection Email
    try {
      if (seller.userId && seller.userId.email) {
        await sendEmail({
          email: seller.userId.email,
          subject: 'Update on your Homedify Seller Application',
          html: `
            <p>Hi <strong>${seller.userId.name || 'Seller'}</strong>,</p>
            <p>We regret to inform you that your application for <strong>${seller.storeName}</strong> has been <strong>rejected</strong>.</p>
            <p><strong>Reason:</strong> ${rejectionReason || 'Documents did not meet our verification standards.'}</p>
            <p>Best regards,<br>The Homedify Team</p>
          `
        });
      }
    } catch (emailErr) {
      console.error('Email sending failed:', emailErr);
    }

    // Capture userId before deleting seller
    const userId = seller.userId ? seller.userId._id : null;

    // Delete the seller record
    await seller.deleteOne();

    // Also delete the associated User record so they can register again from scratch
    await User.findByIdAndDelete(userId);

    res.json({ success: true, message: 'Seller application rejected and account permanently removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Get pending products
// @route   GET /api/v1/admin/products/pending
// @access  Private (Admin)
router.get('/products/pending', protect, authorize('admin'), async (req, res) => {
  try {
    const products = await Product.find({ status: 'pending_approval' })
      .populate('sellerId', 'storeName')
      .populate('categoryId', 'name');
    res.json({ success: true, count: products.length, data: products });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Approve product
// @route   PUT /api/v1/admin/products/:id/approve
// @access  Private (Admin)
router.put('/products/:id/approve', protect, authorize('admin'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    product.status = 'active';
    product.adminNotes = req.body.adminNotes || 'Approved by admin';
    await product.save();
    
    // Notify Seller
    try {
      const seller = await Seller.findById(product.sellerId);
      if (seller) {
        await Notification.create({
          userId: seller.userId,
          message: `🎉 Great news! Your product "${product.name}" has been approved and is now live!`,
          type: 'product',
          link: '/seller/products'
        });
      }
    } catch (notifErr) {
      console.error('Notification failed during product approval:', notifErr);
    }

    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Reject product
// @route   PUT /api/v1/admin/products/:id/reject
// @access  Private (Admin)
router.put('/products/:id/reject', protect, authorize('admin'), async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    product.status = 'rejected';
    product.rejectionReason = rejectionReason || 'Rejected by admin';
    product.adminNotes = rejectionReason || 'Rejected by admin';
    await product.save();

    // Notify Seller
    try {
      const seller = await Seller.findById(product.sellerId);
      if (seller) {
        await Notification.create({
          userId: seller.userId,
          message: `❌ Product Update: Your product "${product.name}" was not approved. Reason: ${product.rejectionReason}`,
          type: 'product',
          link: '/seller/products'
        });
      }
    } catch (notifErr) {
      console.error('Notification failed during product rejection:', notifErr);
    }

    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Get CMS content
// @route   GET /api/v1/admin/content/:type
// @access  Public
router.get('/content/:type', async (req, res) => {
  try {
    const content = await Content.findOne({ type: req.params.type });
    if (!content) {
      return res.json({ success: true, data: { content: '' } });
    }
    res.json({ success: true, data: content });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Update CMS content
// @route   PUT /api/v1/admin/content/:type
// @access  Private (Admin)
router.put('/content/:type', protect, authorize('admin'), async (req, res) => {
  try {
    const { content } = req.body;
    let existingContent = await Content.findOne({ type: req.params.type });

    if (existingContent) {
      existingContent.content = content;
      existingContent.updatedBy = req.user.id;
      await existingContent.save();
    } else {
      existingContent = await Content.create({
        type: req.params.type,
        content,
        updatedBy: req.user.id
      });
    }

    res.json({ success: true, data: existingContent });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Get pending reviews (for moderation)
// @route   GET /api/v1/admin/reviews?status=pending
// @access  Private (Admin)
router.get('/reviews', protect, authorize('admin'), async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status === 'pending') {
      filter.status = 'visible';  // new reviews default to visible, flagged=false, hidden=false
      filter.flagged = false;
      filter.hidden = false;
    } else if (status === 'flagged') {
      filter.flagged = true;
    } else if (status) {
      filter.status = status;
    }

    const reviews = await Review.find(filter)
      .populate('customerId', 'name email')
      .populate({
        path: 'productId',
        select: 'name images sellerId',
        populate: {
          path: 'sellerId',
          select: 'storeName'
        }
      })
      .sort({ createdAt: -1 });
    res.json({ success: true, count: reviews.length, data: reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Approve review and recalculate product avg rating
// @route   PUT /api/v1/admin/reviews/:id/approve
// @access  Private (Admin)
router.put('/reviews/:id/approve', protect, authorize('admin'), async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

    review.status = 'visible';
    review.hidden = false;
    review.flagged = false;
    await review.save();

    // Recalculate product average rating
    const ratingAgg = await Review.aggregate([
      { $match: { productId: review.productId, status: 'visible', hidden: false } },
      { $group: { _id: '$productId', avg: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);

    if (ratingAgg.length > 0) {
      await Product.findByIdAndUpdate(review.productId, {
        averageRating: Math.round(ratingAgg[0].avg * 10) / 10,
        totalReviews: ratingAgg[0].count
      });
    }

    // Notify the customer
    await Notification.create({
      userId: review.customerId,
      message: 'Your review has been approved and is now visible!',
      type: 'review',
      link: '/customer/reviews'
    });

    res.json({ success: true, data: review });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Hide/Unhide review
// @route   PUT /api/v1/admin/reviews/:id/hide
// @access  Private (Admin)
router.put('/reviews/:id/hide', protect, authorize('admin'), async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

    review.hidden = !review.hidden;
    review.status = review.hidden ? 'hidden' : 'visible';
    await review.save();

    res.json({ success: true, data: review });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Delete review
// @route   DELETE /api/v1/admin/reviews/:id
// @access  Private (Admin)
router.delete('/reviews/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

    review.status = 'deleted';
    await review.save();

    // Recalculate avg rating after deletion
    const ratingAgg = await Review.aggregate([
      { $match: { productId: review.productId, status: 'visible', hidden: false } },
      { $group: { _id: '$productId', avg: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);
    if (ratingAgg.length > 0) {
      await Product.findByIdAndUpdate(review.productId, {
        averageRating: Math.round(ratingAgg[0].avg * 10) / 10,
        totalReviews: ratingAgg[0].count
      });
    } else {
      await Product.findByIdAndUpdate(review.productId, { averageRating: 0, totalReviews: 0 });
    }

    res.json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

const { getInquiries, updateInquiryStatus, replyToInquiry } = require('../controllers/inquiryController');

// @desc    Get all inquiries
// @route   GET /api/v1/admin/inquiries
// @access  Private (Admin)
router.get('/inquiries', protect, authorize('admin'), getInquiries);

// @desc    Update inquiry status
// @route   PUT /api/v1/admin/inquiries/:id
// @access  Private (Admin)
router.put('/inquiries/:id', protect, authorize('admin'), updateInquiryStatus);

// @desc    Reply to inquiry
// @route   POST /api/v1/admin/inquiries/:id/reply
// @access  Private (Admin)
router.post('/inquiries/:id/reply', protect, authorize('admin'), replyToInquiry);

// @desc    Delete a user
// @route   DELETE /api/v1/admin/users/:id
// @access  Private (Admin)
router.delete('/users/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Cannot delete admin users' });
    }
    await user.deleteOne();
    res.json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Unblock user
// @route   PUT /api/v1/admin/users/:id/unblock
// @access  Private (Admin)
router.put('/users/:id/unblock', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isBlocked = false;
    await user.save();
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Get admin site settings
// @route   GET /api/v1/admin/settings
// @access  Private (Admin)
router.get('/settings', protect, authorize('admin'), async (req, res) => {
  try {
    const settings = await Content.findOne({ type: 'site_settings' });
    res.json({ success: true, data: settings?.content || { siteTitle: 'Homedify', contactEmail: '' } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Update admin site settings
// @route   PUT /api/v1/admin/settings
// @access  Private (Admin)
router.put('/settings', protect, authorize('admin'), async (req, res) => {
  try {
    let settings = await Content.findOne({ type: 'site_settings' });
    if (settings) {
      settings.content = req.body;
      settings.updatedBy = req.user.id;
      await settings.save();
    } else {
      settings = await Content.create({
        type: 'site_settings',
        content: req.body,
        updatedBy: req.user.id
      });
    }
    res.json({ success: true, data: settings.content });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Admin: Get all payments (proxy to payments route logic)
// @route   GET /api/v1/admin/payments
// @access  Private (Admin)
router.get('/payments', protect, authorize('admin'), async (req, res) => {
  try {
    const { status, sellerId } = req.query;
    const filter = {};
    if (status) filter.paymentStatus = status;
    if (sellerId) filter.sellerId = sellerId;
    const Payment = require('../models/Payment');
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

// @desc    Admin: Get all orders for monitoring
// @route   GET /api/v1/admin/orders
// @access  Private (Admin)
router.get('/orders', protect, authorize('admin'), async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('customerId', 'name email contactNumber')
      .populate('paymentId', 'paymentMethod senderNumber')
      .populate({
        path: 'sellerId',
        select: 'storeName availableBalance bankDetails userId',
        populate: {
          path: 'userId',
          select: 'name email contactNumber'
        }
      })
      .sort({ createdAt: -1, _id: -1 })
      .limit(500);
    res.json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Admin: Verify payment screenshot
// @route   PUT /api/v1/admin/orders/:id/verify-payment
// @access  Private (Admin)
router.put('/orders/:id/verify-payment', protect, authorize('admin'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.paymentStatus = 'held_in_escrow';
    order.status = 'confirmed'; // Move to confirmed so seller can prepare
    order.statusHistory.push({ status: 'confirmed', note: 'Payment verified and held in escrow by Admin. Order is now confirmed.' });
    await order.save();

    const productName = order.orderItems?.[0]?.productName || 'your order';

    // Notify seller to start shipping
    const sellerPName = order.orderItems?.[0]?.productName || 'your order';
    await Notification.create({
      userId: order.sellerId,
      message: `Payment verified for "${sellerPName}". Funds are held in escrow. Please start preparing/shipping the order.`,
      type: 'order',
      link: '/seller/orders'
    });

    // Notify customer that payment is verified
    await Notification.create({
      userId: order.customerId,
      message: `Your payment for "${productName}" has been verified! The seller is now preparing your order.`,
      type: 'payment',
      link: '/customer/orders'
    });

    res.json({ success: true, message: 'Payment verified and order confirmed', data: order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Admin: Reject payment screenshot
// @route   PUT /api/v1/admin/orders/:id/reject-payment
// @access  Private (Admin)
router.put('/orders/:id/reject-payment', protect, authorize('admin'), async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    const order = await Order.findById(req.params.id).populate('customerId');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.status = 'payment_failed';
    order.paymentStatus = 'pending'; // Reset so user can try again
    order.rejectionReason = rejectionReason;
    order.statusHistory.push({ status: order.status, note: `Payment rejected: ${rejectionReason}` });
    await order.save();

    // Update the associated Payment record if it exists
    await Payment.findOneAndUpdate(
      { orderId: order._id },
      { 
        paymentStatus: 'pending',
        rejectionReason: rejectionReason 
      }
    );

    const productName = order.orderItems?.[0]?.productName || 'Product';

    // Notify customer
    await Notification.create({
      userId: order.customerId._id,
      message: `Your payment for "${productName}" was rejected. Reason: ${rejectionReason}. Please re-upload your payment proof.`,
      type: 'payment',
      link: '/customer/orders'
    });

    // Send High-Fidelity HTML Email Notification
    try {
      const emailHtml = `
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background: #ffffff; border-radius: 24px; border: 1px solid #f0f0f0;">
          <div style="text-align: center; margin-bottom: 30px;">
             <h1 style="color: #FF6B6B; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -1px;">Homedify</h1>
             <p style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin-top: 5px;">Payment Verification Service</p>
          </div>
          
          <div style="background: #FFF5F5; padding: 30px; border-radius: 20px; border: 1px solid #FFE3E3; margin-bottom: 30px;">
            <h2 style="color: #D32F2F; margin-top: 0; font-size: 20px;">Action Required: Payment Rejected</h2>
            <p style="color: #444; line-height: 1.6; font-size: 15px;">
              Hello <strong>${order.customerId.name}</strong>,<br><br>
              We couldn't verify your payment proof for the product: <strong>"${productName}"</strong>.
            </p>
            
            <div style="background: #ffffff; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #FF6B6B;">
              <p style="margin: 0; color: #888; font-size: 11px; text-transform: uppercase; font-weight: 900; margin-bottom: 5px;">Reason for Rejection</p>
              <p style="margin: 0; color: #333; font-weight: 600; font-size: 16px;">${rejectionReason}</p>
            </div>

            <p style="color: #666; font-size: 14px; margin-bottom: 25px;">
              Please ensure your payment screenshot clearly shows the <strong>Transaction ID</strong> and <strong>Recipient Name</strong>.
            </p>
            
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/customer/orders" 
               style="display: inline-block; background: #FF6B6B; color: #ffffff; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 900; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);">
               Re-upload Payment Proof
            </a>
          </div>

          <div style="text-align: center; color: #bbb; font-size: 11px;">
            <p>© 2026 Homedify Inc. | Premium Artisan Marketplace</p>
          </div>
        </div>
      `;

      await sendEmail({
        email: order.customerId.email,
        subject: '⚠️ Action Required: Your Payment Proof was Rejected',
        message: `Hello ${order.customerId.name}, your payment for "${productName}" was rejected. Reason: ${rejectionReason}. Please re-upload your proof.`,
        html: emailHtml
      });
    } catch (err) {
      console.error('Rejection email failed to send:', err);
    }

    res.json({ success: true, message: 'Payment rejected successfully and customer notified via HTML email', data: order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});



// @desc    Get orders awaiting seller payout release
// @route   GET /api/v1/admin/finance/release-queue
// @access  Private (Admin)
router.get('/finance/release-queue', protect, authorize('admin'), async (req, res) => {
  try {
    const orders = await Order.find({
      status: { $in: ['shipped', 'delivered'] },
      paymentStatus: 'held_in_escrow'
    })
    .populate('customerId', 'name email contactNumber')
    .populate('sellerId', 'storeName bankDetails userId')
    .populate('paymentId', 'paymentMethod senderNumber')
    .sort({ updatedAt: 1 });
    
    res.json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Get orders awaiting customer refund
// @route   GET /api/v1/admin/finance/refund-queue
// @access  Private (Admin)
router.get('/finance/refund-queue', protect, authorize('admin'), async (req, res) => {
  try {
    const orders = await Order.find({
      $or: [
        { status: { $in: ['cancelled_by_customer', 'cancelled_by_seller', 'disputed'] }, paymentStatus: { $in: ['paid', 'held_in_escrow'] } },
        { status: 'confirmed', paymentStatus: 'held_in_escrow' }
      ]
    })
    .populate('customerId', 'name email contactNumber bankDetails')
    .populate('sellerId', 'storeName')
    .populate('paymentId', 'paymentMethod senderNumber');
    
    res.json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Admin: Release payment to seller (Manual Escrow Payout)
// @route   PUT /api/v1/admin/orders/:id/release-payment
// @access  Private (Admin)
router.put('/orders/:id/release-payment', protect, authorize('admin'), upload.single('payoutProof'), async (req, res) => {
  try {
    const { adminNotes } = req.body;
    console.log('Release Payout Request:', { orderId: req.params.id, adminNotes });
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (order.paymentStatus === 'paid_to_seller') {
      return res.status(400).json({ success: false, message: 'Payment already released' });
    }

    const proofPath = req.file ? `uploads/finance/${req.file.filename}` : '';
    if (!proofPath) return res.status(400).json({ success: false, message: 'Payout proof screenshot is required' });

    const commissionRate = 0.1; // 10% Platform Fee
    const adminCommission = order.total * commissionRate;
    const sellerNet = order.total - adminCommission;

    const seller = await Seller.findById(order.sellerId).populate('userId');
    if (seller) {
      seller.totalEarnings += sellerNet;
      // Also add to totalWithdrawn so it reflects in the "Total Paid" card correctly if needed, 
      // though our new formula handles it via Payments.
      await seller.save();

      const payoutPName = order.orderItems?.[0]?.productName || 'your product';
      await Notification.create({
        userId: seller.userId._id,
        message: `Payment for "${payoutPName}" has been manually released! Rs. ${sellerNet.toLocaleString()} transferred to your account.`,
        type: 'payment',
        link: '/seller/earnings',
        image: proofPath
      });

      // Send Payout Email to Seller
      if (seller.userId?.email) {
        try {
          const attachmentPath = path.join(__dirname, '../../', proofPath);
          const productName = order.orderItems?.[0]?.productName || 'your product';
          await sendEmail({
            email: seller.userId.email,
            subject: `Payment Released - ${productName}`,
            html: `<p>Hello <strong>${seller.storeName}</strong>,</p>
            <p>Payment for <strong>"${productName}"</strong> has been manually released by Homedify Admin.</p>
            <p>Amount Transferred: <strong>Rs. ${sellerNet.toLocaleString()}</strong></p>
            <p>Reference: ${adminNotes || 'Manual Transfer'}</p>
            <p>Please find the payout proof screenshot attached.</p>
            <p>Thank you for being part of Homedify!</p>`,
            attachments: fs.existsSync(attachmentPath) ? [
              {
                filename: `payout_proof.png`,
                path: attachmentPath
              }
            ] : []
          });
        } catch (emailErr) {
          console.error('Seller payout email failed:', emailErr.message);
        }
      }
    }

    order.paymentStatus = 'paid_to_seller';
    order.status = 'completed';
    order.adminCommission = adminCommission;
    order.sellerPayable = sellerNet;
    order.payoutProof = proofPath;
    order.completedAt = Date.now();
    order.statusHistory.push({ status: 'completed', note: 'Escrow payment released manually. Payout proof uploaded.' });
    await order.save();

    await Payment.findOneAndUpdate(
      { orderId: order._id },
      { 
        paymentStatus: 'released',
        releasedAt: Date.now(),
        releasedBy: req.user.id,
        payoutProof: proofPath,
        platformCommission: adminCommission,
        sellerAmount: sellerNet
      }
    );

    res.json({ success: true, message: 'Payment marked as Paid to Seller', data: order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Admin: Process refund to user
// @route   PUT /api/v1/admin/orders/:id/process-refund
// @access  Private (Admin)
router.put('/orders/:id/process-refund', protect, authorize('admin'), upload.single('refundProof'), async (req, res) => {
  try {
    const { refundNotes, adminAccount } = req.body;
    const order = await Order.findById(req.params.id).populate('customerId');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const proofPath = req.file ? `uploads/finance/${req.file.filename}` : '';
    if (!proofPath) return res.status(400).json({ success: false, message: 'Refund proof screenshot is required' });
    console.log('Process Refund Request:', { orderId: req.params.id, refundNotes, adminAccount });

    order.paymentStatus = 'refunded';
    order.status = 'refunded';
    order.refundProof = proofPath;
    order.statusHistory.push({ 
      status: 'refunded', 
      note: `Refund processed manually from account ${adminAccount || 'N/A'}: ${refundNotes || 'Manual refund'}` 
    });
    await order.save();

    await Payment.findOneAndUpdate(
      { orderId: order._id },
      { 
        paymentStatus: 'refunded',
        refundedDate: Date.now(),
        refundReason: refundNotes || 'Customer refund',
        refundProof: proofPath,
        adminAccount: adminAccount
      }
    );

    // Send Notification
    if (order.customerId) {
      await Notification.create({
        userId: order.customerId._id,
        message: `Your refund has been processed successfully! Proof attached.`,
        type: 'payment',
        link: '/customer/orders',
        image: proofPath
      });
    }

    // Send Email with Attachment
    const attachmentPath = path.join(__dirname, '../../', proofPath);
    console.log('Attachment path for refund:', attachmentPath);
    
    if (order.customerId?.email) {
      try {
        const refundAmount = order.total ? order.total.toLocaleString() : '0';
        const productName = order.orderItems?.[0]?.productName || 'your product';
        await sendEmail({
          email: order.customerId.email,
          subject: `Refund Processed - ${productName}`,
          html: `<p>Hello <strong>${order.customerId.name || 'Customer'}</strong>,</p>
          <p>Your refund of <strong>Rs. ${refundAmount}</strong> for <strong>"${productName}"</strong> has been processed successfully from admin account ${adminAccount || 'N/A'}.</p>
          <p>Please find the transfer proof screenshot attached to this email.</p>
          <p>Thank you for choosing Homedify!</p>`,
          attachments: fs.existsSync(attachmentPath) ? [
            {
              filename: `refund_proof.png`,
              path: attachmentPath
            }
          ] : []
        });
      } catch (emailErr) {
        console.error('Email sending failed for customer refund:', emailErr.message);
      }
    }

    res.json({ success: true, message: 'Refund processed successfully', data: order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
