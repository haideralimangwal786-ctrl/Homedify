const mongoose = require('mongoose');
const reviewSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    title: {
        type: String,
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    reviewText: {
        type: String,
        required: [true, 'Please provide review text'],
        minlength: [10, 'Review must be at least 10 characters'],
        maxlength: [1000, 'Review cannot exceed 1000 characters']
    },
    images: [String],
    // Review moderation
    flagged: {
        type: Boolean,
        default: false
    },
    flaggedReason: String,
    hidden: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['visible', 'hidden', 'deleted'],
        default: 'visible'
    },
    sellerResponse: String,
    sellerResponseDate: Date,
    helpfulCount: {
        type: Number,
        default: 0
    },
    isVerifiedPurchase: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Review', reviewSchema);
