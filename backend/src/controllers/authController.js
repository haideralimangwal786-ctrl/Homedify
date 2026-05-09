const User = require('../models/User');
const Seller = require('../models/Seller');
const ErrorResponse = require('../utils/errorResponse');
const sendEmail = require('../utils/sendEmail');
const dns = require('dns').promises;

// List of common disposable email domains
const DISPOSABLE_DOMAINS = [
    'temp-mail.org', 'tempmail.com', '10minutemail.com', 'throwawaymail.com', 
    'mailinator.com', 'yopmail.com', 'guerrillamail.com', 'sharklasers.com',
    'dispostable.com', 'getnada.com', 'boun.cr', 'trashmail.com'
];

/**
 * Helper to check if a domain has valid MX records
 */
const hasValidMX = async (domain) => {
    try {
        const addresses = await dns.resolveMx(domain);
        return addresses && addresses.length > 0;
    } catch (err) {
        return false;
    }
};

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = async (req, res, next) => {
    console.log("REGISTER PAYLOAD:", req.body);
    const { name, email, password, contactNumber, address } = req.body;

    // Strict email format check
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    // Advanced Checks
    const domain = email.split('@')[1].toLowerCase();
    
    // 1. Block Disposable
    if (DISPOSABLE_DOMAINS.includes(domain)) {
        return res.status(400).json({ success: false, message: 'Disposable emails are not allowed' });
    }

    // 2. DNS MX Check (Ensures domain exists and can receive mail)
    const validDomain = await hasValidMX(domain);
    if (!validDomain) {
        return res.status(400).json({ success: false, message: 'Email domain does not exist or cannot receive mail' });
    }

    try {
        // Create user
        const userData = {
            name,
            email,
            password,
            contactNumber,
            address
        };

        // If role is provided and valid, set it (defaults to customer in model)
        if (req.body.role === 'seller' || req.body.role === 'admin') {
            userData.role = req.body.role;
        }

        const user = await User.create(userData);

        // If registering as a seller, create the profile
        if (req.body.role === 'seller') {
            console.log(`[Auth] Creating Seller Profile for ${user.email}`);
            await Seller.create({
                userId: user._id,
                storeName: req.body.storeName || `${name}'s Store`,
                storeDescription: req.body.storeDescription || '',
                storeAddress: req.body.storeAddress || (typeof address === 'string' ? address : ''),
                cnicNumber: '0000000000000',
                cnicImages: { front: 'pending', back: 'pending' },
                selfieImage: 'pending',
                businessInfo: {
                    businessType: req.body.businessType || 'other',
                    tagline: req.body.tagline || '',
                    yearsInBusiness: req.body.yearsInBusiness || 0
                },
                socialMedia: {
                    facebook: req.body.facebook || '',
                    instagram: req.body.instagram || '',
                    whatsapp: req.body.whatsapp || ''
                },
                bankDetails: {
                    bankName: req.body.paymentMethod || '',
                    accountNumber: req.body.paymentAccountNumber || ''
                }
            });
        }

        const verificationToken = user.generateEmailVerificationToken();
        await user.save({ validateBeforeSave: false });

        try {
            await sendVerificationEmail(user, verificationToken, req);
            res.status(201).json({
                success: true,
                message: 'Registration successful. Please check your email to verify your account.',
                needsVerification: true,
                email: user.email
            });
        } catch (err) {
            console.error('Email verification send failed:', err);
            // Even if email fails, user is created. They can try resending later.
            res.status(201).json({
                success: true,
                message: 'Account created, but verification email could not be sent. Please try resending from login.',
                needsVerification: true,
                email: user.email
            });
        }
    } catch (err) {
        console.log("REGISTER ERROR:", err);
        if (err.code === 11000) {
            return res.status(400).json({ success: false, message: 'Email or Store Name already exists' });
        }
        next(err);
    }
};

// @desc    Check if email exists
// @route   POST /api/v1/auth/check-email
// @access  Public
exports.checkEmail = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: 'Please provide an email' });
        }
        
        // Simple regex for basic validation
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: 'Invalid email format', invalidFormat: true });
        }

        const domain = email.split('@')[1].toLowerCase();

        // 1. Block Disposable
        if (DISPOSABLE_DOMAINS.includes(domain)) {
            return res.status(400).json({ success: false, message: 'Disposable emails are blocked', isDisposable: true });
        }

        // 2. DNS MX Check
        const validDomain = await hasValidMX(domain);
        if (!validDomain) {
            return res.status(400).json({ success: false, message: 'Email domain not found', invalidDomain: true });
        }
        
        const user = await User.findOne({ email });
        if (user) {
            return res.json({ success: true, exists: true, message: 'Email already exists' });
        }
        
        res.json({ success: true, exists: false, message: 'Email available' });
    } catch (err) {
        next(err);
    }
};

// @desc    Check if store name exists
// @route   POST /api/v1/auth/check-store
// @access  Public
exports.checkStoreName = async (req, res, next) => {
    try {
        const { storeName } = req.body;
        if (!storeName) {
            return res.status(400).json({ success: false, message: 'Please provide a store name' });
        }
        
        // Case-insensitive exact match
        const store = await Seller.findOne({ storeName: { $regex: new RegExp(`^${storeName}$`, 'i') } });
        if (store) {
            return res.json({ success: true, exists: true, message: 'Store Name already exists' });
        }
        
        res.json({ success: true, exists: false, message: 'Store Name available' });
    } catch (err) {
        next(err);
    }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (req, res, next) => {
    const { email, password } = req.body;

    try {
        // Validate email & password
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide an email and password' });
        }

        // Check for user
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Check if user is blocked
        if (user.isBlocked) {
            return res.status(403).json({ success: false, message: 'Your account has been blocked. Please contact support.' });
        }

        // Check if password matches
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        sendTokenResponse(user, 200, res);
    } catch (err) {
        next(err);
    }
};

// @desc    Log user out / clear cookie
// @route   GET /api/v1/auth/logout
// @access  Public
exports.logout = async (req, res, next) => {
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });

    res.status(200).json({
        success: true,
        data: {}
    });
};

// @desc    Get current logged in user
// @route   POST /api/v1/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Google Login
// @route   POST /api/v1/auth/google-login
// @access  Public
exports.googleLogin = async (req, res, next) => {
    try {
        const { email, name, googleId, picture } = req.body;
        const normalizedEmail = email.toLowerCase();

        // Find user by googleId OR email
        let user = await User.findOne({ 
            $or: [
                { googleId: googleId },
                { email: normalizedEmail }
            ]
        });

        if (user) {
            // Update googleId and picture if missing
            if (!user.googleId || !user.picture) {
                user.googleId = googleId;
                user.picture = picture;
                await user.save({ validateBeforeSave: false });
            }
        } else {
            // Generate random password
            const password = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);

            user = await User.create({
                name,
                email: normalizedEmail,
                password,
                googleId,
                picture,
                role: 'customer',
                isEmailVerified: true
            });
        }

        if (user.isBlocked) {
            return res.status(403).json({ success: false, message: 'Your account has been blocked.' });
        }

        sendTokenResponse(user, 200, res);
    } catch (err) {
        console.error('GOOGLE LOGIN ERROR:', err);
        next(err);
    }
};

// Send verification email helper
const sendVerificationEmail = async (user, token, req) => {
    const protocol = req.protocol;
    const host = req.get('host');
    const verifyUrl = `${protocol}://${host}/api/v1/auth/verify-email/${token}`;

    const message = `Welcome to Homedify! \n\n Please verify your account by clicking the link below: \n\n ${verifyUrl}`;

    const html = `
        <div style="font-family: 'Outfit', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 16px;">
            <h2 style="color: #FF6B6B; text-align: center;">Welcome to Homedify!</h2>
            <p style="color: #4B5563; font-size: 16px; line-height: 1.6;">Hi ${user.name},</p>
            <p style="color: #4B5563; font-size: 16px; line-height: 1.6;">Thank you for joining our community of artisans and home decor enthusiasts. Please verify your email address to get started.</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${verifyUrl}" style="background-color: #FF6B6B; color: white; padding: 14px 30px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px; display: inline-block;">Verify Email Address</a>
            </div>
            <p style="color: #9CA3AF; font-size: 12px; text-align: center;">If the button doesn't work, copy and paste this link into your browser:<br>${verifyUrl}</p>
            <hr style="border: none; border-top: 1px solid #f0f0f0; margin: 30px 0;">
            <p style="color: #9CA3AF; font-size: 12px; text-align: center;">&copy; 2026 Homedify. All rights reserved.</p>
        </div>
    `;

    await sendEmail({
        email: user.email,
        subject: 'Homedify - Verify Your Account',
        message: message,
        html: html
    });
};

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
    // Create token
    const token = user.generateToken();

    const options = {
        expires: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days (simplified from env)
        ),
        httpOnly: true
    };

    if (process.env.NODE_ENV === 'production') {
        options.secure = true;
    }

    res
        .status(statusCode)
        .cookie('token', token, options)
        .json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
};
