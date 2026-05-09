const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        required: true,
        unique: true
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
    orderItems: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        productName: String,
        productImage: String,
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        price: {
            type: Number,
            required: true
        },
        subtotal: Number
    }],
    deliveryAddress: {
        name: String,
        contactNumber: String,
        street: String,
        city: String,
        province: String,
        postalCode: String
    },
    deliveryInstructions: String,
    deliveryType: {
        type: String,
        enum: ['courier', 'self'],
        required: true
    },
    trackingNumber: String,
    status: {
        type: String,
        enum: [
            'pending_payment',
            'paid',
            'confirmed',
            'seller_accepted',
            'preparing',
            'shipped',
            'delivered',
            'completed',
            'cancelled_by_customer',
            'cancelled_by_seller',
            'payment_failed',
            'returned',
            'refunded',
            'disputed'
        ],
        default: 'pending_payment'
    },
    statusHistory: [{
        status: String,
        timestamp: {
            type: Date,
            default: Date.now
        },
        note: String
    }],
    paymentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment'
    },
    subtotal: {
        type: Number,
        required: true
    },
    deliveryCharges: {
        type: Number,
        default: 0
    },
    total: {
        type: Number,
        required: true
    },
    disputeReason: String,
    disputeStatus: {
        type: String,
        enum: ['none', 'raised', 'resolved'],
        default: 'none'
    },
    estimatedDelivery: Date,
    deliveredAt: Date,
    deliveryConfirmedAt: Date,
    deliveryConfirmedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    cancelledAt: Date,
    cancelledBy: {
        type: String,
        enum: ['customer', 'seller', 'admin']
    },
    cancellationReason: String,
    shippedAt: Date,
    shippingReceipt: {
        type: String,
        default: ''
    },
    paymentScreenshot: {
        type: String,
        default: ''
    },
    transactionId: {
        type: String,
        default: ''
    },
    rejectionReason: {
        type: String,
        default: ''
    },
    senderNumber: {
        type: String,
        default: ''
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'pending_verification', 'held_in_escrow', 'released', 'paid_to_seller', 'refunded'],
        default: 'pending'
    },
    adminCommission: {
        type: Number,
        default: 0
    },
    sellerPayable: {
        type: Number,
        default: 0
    },
    payoutProof: {
        type: String,
        default: ''
    },
    refundProof: {
        type: String,
        default: ''
    },
    completedAt: Date
}, {
    timestamps: true
});

// Generate unique order ID before validation to satisfy 'required: true'
orderSchema.pre('validate', async function (next) {
    if (this.isNew) {
        const date = new Date();
        const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
        
        // Use UTC start of day to prevent timezone overlap bugs
        const startOfUtcDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
        
        const count = await this.constructor.countDocuments({
            createdAt: {
                $gte: startOfUtcDay
            }
        });
        
        // Append a random 2-char string to prevent concurrent race conditions
        const randomChars = Math.random().toString(36).substring(2, 4).toUpperCase();
        this.orderId = `HMD-${dateStr}-${String(count + 1).padStart(4, '0')}-${randomChars}`;
    }
    next();
});

module.exports = mongoose.model('Order', orderSchema);
