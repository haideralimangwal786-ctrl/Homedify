const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Review = require('../models/Review');
const Order = require('../models/Order');
const Notification = require('../models/Notification');

// @desc    Submit a review for a product
// @route   POST /api/v1/reviews
// @access  Private
router.post('/', protect, async (req, res, next) => {
    try {
        const { productId, orderId, rating, reviewText } = req.body;

        // 1. Input Validation
        if (!productId || !rating || !reviewText) {
            return res.status(400).json({ success: false, message: 'Please provide productId, rating, and reviewText' });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
        }

        // 2. Duplicate Check
        const existingReview = await Review.findOne({ productId, customerId: req.user.id });
        if (existingReview) {
            return res.status(400).json({ success: false, message: 'You have already reviewed this product' });
        }

        let verifiedOrderId = orderId;

        // 3. Order Verification
        if (verifiedOrderId) {
            const order = await Order.findById(verifiedOrderId);
            if (!order) {
                return res.status(404).json({ success: false, message: 'Order not found' });
            }

            if (String(order.customerId) !== String(req.user.id)) {
                return res.status(403).json({ success: false, message: 'Not authorized to review based on this order' });
            }

            if (!['delivered', 'completed'].includes(order.status)) {
                return res.status(400).json({ success: false, message: 'You can only review products you have purchased and received' });
            }
        } else {
            const latestOrder = await Order.findOne({
                customerId: req.user.id,
                status: { $in: ['delivered', 'completed'] },
                'orderItems.productId': productId
            }).sort({ createdAt: -1 });

            if (!latestOrder) {
                return res.status(400).json({ success: false, message: 'You can only review products you have purchased and received' });
            }
            verifiedOrderId = latestOrder._id;
        }

        // 4. Create Review
        const review = await Review.create({
            productId,
            orderId: verifiedOrderId,
            customerId: req.user.id,
            rating,
            reviewText,
            status: 'visible'
        });

        res.status(201).json({ success: true, data: review });
    } catch (err) {
        console.error('Review Submission Error:', err);
        next(err);
    }
});

// @desc    Get logged-in user's own reviews
// @route   GET /api/v1/reviews/my
// @access  Private
router.get('/my', protect, async (req, res) => {
    try {
        const reviews = await Review.find({ customerId: req.user.id })
            .populate('productId', 'name images averageRating')
            .sort({ createdAt: -1 });

        res.json({ success: true, count: reviews.length, data: reviews });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @desc    Check if user has purchased the product
// @route   GET /api/v1/reviews/check-purchase/:productId
// @access  Private
router.get('/check-purchase/:productId', protect, async (req, res) => {
    try {
        const order = await Order.findOne({
            customerId: req.user.id,
            status: { $in: ['delivered', 'completed'] },
            'orderItems.productId': req.params.productId
        });

        res.json({ success: true, hasPurchased: !!order });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.get('/product/:productId', async (req, res) => {
    try {
        const reviews = await Review.find({
            productId: req.params.productId,
            status: { $in: ['visible', 'approved'] }
        })
            .populate('customerId', 'name picture')
            .sort('-createdAt');

        res.json({ success: true, count: reviews.length, data: reviews });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
