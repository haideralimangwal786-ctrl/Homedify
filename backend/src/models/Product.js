const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Seller',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Please provide a product name'],
        trim: true,
        maxlength: [200, 'Product name cannot exceed 200 characters']
    },
    description: {
        type: String,
        required: [true, 'Please provide a product description'],
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    price: {
        type: Number,
        required: [true, 'Please provide a price'],
        min: [1, 'Price must be at least 1 PKR'],
        max: [1000000, 'Price cannot exceed 1,000,000 PKR']
    },
    quantity: {
        type: Number,
        required: [true, 'Please provide quantity'],
        min: [0, 'Quantity cannot be negative'],
        default: 99999
    },
    images: [{
        type: String,
        required: true
    }],
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    subcategoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    },
    marketplace: {
        type: String,
        enum: ['craft', 'food'],
        required: true
    },
    tags: [{
        type: String,
        trim: true
    }],
    // SKU for inventory management
    sku: {
        type: String,
        trim: true
    },
    // Delivery information
    deliveryType: {
        type: String,
        enum: ['home_delivery', 'pickup', 'both'],
        default: 'both'
    },
    deliveryTime: {
        type: Number, // in days
        default: 3
    },
    deliveryCharges: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['pending_approval', 'active', 'rejected', 'out_of_stock', 'disabled'],
        default: 'pending_approval'
    },
    rejectionReason: {
        type: String,
        default: ''
    },
    adminNotes: {
        type: String,
        default: ''
    },
    averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    totalReviews: {
        type: Number,
        default: 0
    },
    totalSales: {
        type: Number,
        default: 0
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Text index for search
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
// Compound indexes for filtering
productSchema.index({ status: 1, marketplace: 1 });
productSchema.index({ sellerId: 1, status: 1 });
productSchema.index({ categoryId: 1, status: 1 });

// Update seller's totalProducts count
productSchema.statics.updateSellerProductCount = async function(sellerId) {
    try {
        const count = await this.countDocuments({ sellerId });
        await mongoose.model('Seller').findByIdAndUpdate(sellerId, {
            totalProducts: count
        });
    } catch (err) {
        console.error('Error updating seller product count:', err);
    }
};

// Call updateSellerProductCount after save
productSchema.post('save', function() {
    this.constructor.updateSellerProductCount(this.sellerId);
});

// Call updateSellerProductCount after remove/delete
productSchema.post('findOneAndDelete', async function(doc) {
    if (doc) {
        await doc.constructor.updateSellerProductCount(doc.sellerId);
    }
});

productSchema.post('deleteOne', { document: true, query: false }, function() {
    this.constructor.updateSellerProductCount(this.sellerId);
});

module.exports = mongoose.model('Product', productSchema);
