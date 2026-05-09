const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema({
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Seller',
        required: true
    },
    amount: {
        type: Number,
        required: [true, 'Please provide withdrawal amount'],
        min: [1000, 'Minimum withdrawal amount is PKR 1,000']
    },
    bankDetails: {
        bankName: {
            type: String,
            required: true
        },
        accountTitle: {
            type: String,
            required: true
        },
        accountNumber: {
            type: String,
            required: true
        },
        iban: String
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'completed'],
        default: 'pending'
    },
    requestedAt: {
        type: Date,
        default: Date.now
    },
    processedAt: Date,
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // Admin
    },
    rejectionReason: String,
    receiptUrl: String,
    adminNotes: String
}, {
    timestamps: true
});

// Index for querying pending withdrawals
withdrawalSchema.index({ status: 1, requestedAt: -1 });
withdrawalSchema.index({ sellerId: 1, status: 1 });

module.exports = mongoose.model('Withdrawal', withdrawalSchema);
