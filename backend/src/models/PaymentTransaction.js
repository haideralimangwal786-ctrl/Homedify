const mongoose = require('mongoose');

const paymentTransactionSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    txnRefNo: {
        type: String,
        required: true,
        unique: true
    },
    gateway: {
        type: String,
        enum: ['jazzcash', 'easypaisa', 'bank'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'cancelled'],
        default: 'pending'
    },
    // Gateway request parameters
    params: {
        type: mongoose.Schema.Types.Mixed
    },
    // Gateway response
    gatewayResponse: {
        type: mongoose.Schema.Types.Mixed
    },
    responseCode: String,
    responseMessage: String,
    // Timestamps
    initiatedAt: {
        type: Date,
        default: Date.now
    },
    completedAt: Date,
    failedAt: Date
}, {
    timestamps: true
});

// Index for transaction lookup
paymentTransactionSchema.index({ txnRefNo: 1 });
paymentTransactionSchema.index({ orderId: 1 });
paymentTransactionSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('PaymentTransaction', paymentTransactionSchema);
