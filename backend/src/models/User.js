const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name'],
        trim: true,
        maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        lowercase: true,
        match: [
            /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
            'Please provide a valid email'
        ]
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: [8, 'Password must be at least 8 characters'],
        select: false
    },
    role: {
        type: String,
        enum: ['customer', 'seller', 'admin'],
        default: 'customer'
    },
    contactNumber: {
        type: String,
        match: [/^[0-9]{11}$/, 'Please provide a valid Pakistani phone number']
    },
    address: {
        street: { type: String },
        city: { type: String },
        province: { type: String },
        postalCode: { type: String }
    },
    // Saved addresses for quick checkout
    addresses: [{
        name: String,
        contactNumber: String,
        street: String,
        city: String,
        province: String,
        postalCode: String,
        isDefault: {
            type: Boolean,
            default: false
        }
    }],
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: String,
    emailVerificationExpire: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    resetPasswordOtp: String,
    googleId: String,
    picture: String,
    lastLogin: Date,
    bio: {
        type: String,
        maxlength: [200, 'Bio cannot exceed 200 characters']
    },
    refundDetails: {
        paymentMethod: {
            type: String,
            enum: ['EasyPaisa', 'JazzCash', 'Bank', 'none'],
            default: 'none'
        },
        accountHolderName: String,
        accountNumber: String
    },
    isActive: {
        type: Boolean,
        default: true
    },
    termsAcceptedAt: {
        type: Date,
        default: Date.now
    },
    privacyPolicyAcceptedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT token
userSchema.methods.generateToken = function () {
    return jwt.sign(
        { id: this._id, role: this.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};

// Generate email verification token
userSchema.methods.generateEmailVerificationToken = function () {
    const token = Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
    this.emailVerificationToken = token;
    this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    return token;
};

// Cascade delete seller profile when a user (document) is directly deleted
// NOTE: This hook is ONLY triggered when user.deleteOne() is called on a User document instance.
// It will NOT be triggered when using User.deleteOne({ _id: ... }) at the query/model level.
userSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
    if (this.role === 'seller') {
        try {
            // Use query-level deleteOne to avoid triggering Seller hooks in a loop
            await mongoose.model('Seller').deleteOne({ userId: this._id });
        } catch (err) {
            console.warn('[User Hook] Could not cascade-delete seller profile:', err.message);
        }
    }
    next();
});

// For findByIdAndDelete / findOneAndDelete calls (query middleware)
userSchema.pre('findOneAndDelete', async function (next) {
    const doc = await this.model.findOne(this.getQuery());
    if (doc && doc.role === 'seller') {
        try {
            // Use query-level deleteOne to avoid triggering Seller hooks in a loop
            await mongoose.model('Seller').deleteOne({ userId: doc._id });
        } catch (err) {
            console.warn('[User Hook] Could not cascade-delete seller profile on findOneAndDelete:', err.message);
        }
    }
    next();
});

module.exports = mongoose.model('User', userSchema);
