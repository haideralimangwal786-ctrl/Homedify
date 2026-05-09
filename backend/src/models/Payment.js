const mongoose = require('mongoose');
const paymentSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Seller',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    platformCommission: {
        type: Number,
        required: true
    },
    sellerAmount: {
        type: Number,
        required: true
    },
    commissionRate: {
        type: Number,
        default: 10
    },
    paymentMethod: {
        type: String,
        enum: ['jazzcash', 'easypaisa', 'bank', 'cod', 'safepay'],
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'pending_verification', 'held', 'released', 'refunded', 'disputed'],
        default: 'pending'
    },
    transactionId: String,
    senderNumber: String,
    paymentProof: String,
    // Payment holding system - 3 day release
    heldAt: Date,
    releaseEligibleAt: Date, // 3 days after delivery
    releasedAt: Date,
    releasedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // Admin who released payment
    },
    releaseRequestDate: Date,
    refundReason: String,
    refundedDate: Date,
    payoutProof: String,
    refundProof: String,
    adminAccount: String,
    // Dispute management
    disputeReason: String,
    disputeResolvedAt: Date
}, {
    timestamps: true
});

module.exports = mongoose.model('Payment', paymentSchema);
