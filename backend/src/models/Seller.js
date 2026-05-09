const mongoose = require('mongoose');

const sellerSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    storeName: {
        type: String,
        required: [true, 'Please provide a store name'],
        unique: true,
        trim: true,
        maxlength: [100, 'Store name cannot exceed 100 characters']
    },
    storeDescription: {
        type: String,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    storeAddress: {
        type: String,
        required: [true, 'Please provide a store/home address']
    },
    storeLogo: {
        type: String,
        default: ''
    },
    storeBanner: {
        type: String,
        default: ''
    },
    verificationStatus: {
        type: String,
        enum: ['pending_verification', 'ai_verified', 'ai_rejected', 'approved', 'rejected', 'suspended'],
        default: 'pending_verification'
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    cnicNumber: {
        type: String,
        required: true,
        unique: true,
        match: [/^[0-9]{13}$/, 'Please provide a valid CNIC number']
    },
    cnicImages: {
        front: {
            type: String,
            required: true
        },
        back: {
            type: String,
            required: true
        }
    },
    selfieImage: {
        type: String,
        required: true
    },
    ocrData: {
        name: String,
        cnicNumber: String,
        dob: String,
        gender: String,
        address: String,
        issueDate: String,
        expiryDate: String,
        confidence: Number
    },
    faceMatchScore: {
        type: Number,
        min: 0,
        max: 100
    },
    // Complete AI verification report
    aiReport: {
        verificationId: String,
        timestamp: Date,
        processingTime: Number,
        overallStatus: String,
        overallScore: Number,
        recommendation: String,
        confidenceLevel: String,
        ocrResults: mongoose.Schema.Types.Mixed,
        faceRecognitionResults: mongoose.Schema.Types.Mixed,
        genderVerification: mongoose.Schema.Types.Mixed,
        authenticityCheck: mongoose.Schema.Types.Mixed,
        flagsAndWarnings: [String]
    },
    adminNotes: {
        type: String,
        default: ''
    },
    verificationHistory: [{
        status: String,
        note: String,
        date: {
            type: Date,
            default: Date.now
        }
    }],
    // Business information
    businessInfo: {
        businessType: String,
        yearsInBusiness: Number,
        specialization: String,
        tagline: String
    },
    // Social media links
    socialMedia: {
        facebook: String,
        instagram: String,
        whatsapp: String
    },
    // Shop policies
    policies: {
        returnPolicy: String,
        shippingPolicy: String,
        customOrderPolicy: String
    },
    // Financial tracking - separated for payment holding system
    availableBalance: {
        type: Number,
        default: 0
    },
    pendingBalance: {
        type: Number,
        default: 0
    },
    totalEarnings: {
        type: Number,
        default: 0
    },
    totalWithdrawn: {
        type: Number,
        default: 0
    },
    bankDetails: {
        bankName: String,
        accountTitle: String,
        accountNumber: String,
        iban: String
    },
    totalProducts: {
        type: Number,
        default: 0
    },
    totalSales: {
        type: Number,
        default: 0
    },
    averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    }
}, {
    timestamps: true
});

// Update user role when seller is approved
sellerSchema.post('save', async function () {
    if (this.verificationStatus === 'approved') {
        await mongoose.model('User').findByIdAndUpdate(
            this.userId,
            { role: 'seller' }
        );
    }
});

// Cascade delete products when a seller is deleted
sellerSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
    console.log(`Deleting products for seller ${this._id}`);
    await mongoose.model('Product').deleteMany({ sellerId: this._id });
    next();
});

module.exports = mongoose.model('Seller', sellerSchema);
