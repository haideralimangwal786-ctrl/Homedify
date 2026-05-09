const User = require('../models/User');
const Seller = require('../models/Seller');
const crypto = require('crypto');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const sendEmail = require('../utils/sendEmail');

// @desc    Forgot password
// @route   POST /api/v1/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
    try {
        let user = await User.findOne({ email: req.body.email });
        if (!user) {
            user = await Seller.findOne({ email: req.body.email });
        }

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'There is no user with that email'
            });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.resetPasswordOtp = otp;
        user.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour

        await user.save({ validateBeforeSave: false });

        console.log(`[OTP] Password reset OTP for ${user.email}: ${otp}`);

        const message = `You are receiving this email because you (or someone else) has requested the reset of a password. \n\n Your OTP is: ${otp} \n\n This OTP is valid for 1 hour.`;

        const html = `
        <p>Verify your email</p>
        <p>We received a request to reset your password. Use the verification code below.</p>
        <p><strong>${otp}</strong></p>
        <p>This code will expire in <strong>60 minutes</strong>.</p>
        `;

        if (!process.env.EMAIL_USERNAME) {
            console.warn('[DEV MODE] No email credentials found in .env. Skipping email delivery.');
            return res.status(200).json({
                success: true,
                message: 'OTP generated. Please check the backend server console to see it.'
            });
        }

        try {
            await sendEmail({
                email: user.email,
                subject: 'Homedify - Password Reset Verification Code',
                message: message,
                html: html
            });

            res.status(200).json({
                success: true,
                message: 'OTP sent to your email'
            });
        } catch (err) {
            console.error('Nodemailer Error details:', err);
            user.resetPasswordOtp = undefined;
            user.resetPasswordExpire = undefined;
            await user.save({ validateBeforeSave: false });

            return res.status(500).json({
                success: false,
                message: 'Email could not be sent. ' + (err.message || '')
            });
        }
    } catch (err) {
        next(err);
    }
};

// @desc    Verify Reset OTP
// @route   POST /api/v1/auth/verify-reset-otp
// @access  Public
exports.verifyResetOtp = async (req, res, next) => {
    try {
        const { email, otp } = req.body;

        const user = await User.findOne({
            email,
            resetPasswordOtp: otp,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP'
            });
        }

        res.status(200).json({
            success: true,
            message: 'OTP verified successfully'
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Reset password
// @route   POST /api/v1/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res, next) => {
    try {
        const { email, otp, newPassword } = req.body;

        const user = await User.findOne({
            email,
            resetPasswordOtp: otp,
            resetPasswordExpire: { $gt: Date.now() }
        }).select('+password');

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP'
            });
        }

        // Set new password
        user.password = newPassword;
        user.resetPasswordOtp = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password reset successful'
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Verify email
// @route   GET /api/v1/auth/verify-email/:token
// @access  Public
exports.verifyEmail = async (req, res, next) => {
    try {
        const user = await User.findOne({
            emailVerificationToken: req.params.token,
            emailVerificationExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired verification token'
            });
        }

        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpire = undefined;
        await user.save({ validateBeforeSave: false });

        // Redirect to a frontend success page or return JSON if requested
        if (req.query.format === 'json') {
            return res.status(200).json({
                success: true,
                message: 'Email verified successfully'
            });
        }

        // Default: redirect to frontend
        const protocol = req.protocol;
        const host = req.get('host');
        const frontendUrl = host.includes('localhost') ? 'http://localhost:3000' : `${protocol}://${host}`;
        res.redirect(`${frontendUrl}/verify-email-success`);
    } catch (err) {
        next(err);
    }
};

// @desc    Resend verification email
// @route   POST /api/v1/auth/resend-verification
// @access  Public
exports.resendVerificationEmail = async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'No user found with that email'
            });
        }

        if (user.isEmailVerified) {
            return res.status(400).json({
                success: false,
                message: 'Email is already verified'
            });
        }

        const verificationToken = user.generateEmailVerificationToken();
        await user.save({ validateBeforeSave: false });

        const protocol = req.protocol;
        const host = req.get('host');
        const verifyUrl = `${protocol}://${host}/api/v1/auth/verify-email/${verificationToken}`;

        const message = `Please verify your Homedify account by clicking the link below: \n\n ${verifyUrl}`;

        const html = `
            <div style="font-family: 'Outfit', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 16px;">
                <h2 style="color: #FF6B6B; text-align: center;">Verify Your Homedify Account</h2>
                <p style="color: #4B5563; font-size: 16px; line-height: 1.6;">Hi ${user.name},</p>
                <p style="color: #4B5563; font-size: 16px; line-height: 1.6;">You requested a new verification link. Please click the button below to verify your email address.</p>
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
            subject: 'Homedify - Account Verification Link',
            message,
            html
        });

        res.status(200).json({
            success: true,
            message: 'Verification email sent'
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Seller registration - Step 1: Basic Info
// @route   POST /api/v1/auth/seller/register/step1
// @access  Public
exports.sellerRegisterStep1 = async (req, res, next) => {
    try {
        const {
            name,
            email,
            password,
            contactNumber,
            address,
            storeName,
            storeDescription
        } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Check if store name is taken
        const existingStore = await Seller.findOne({ storeName });
        if (existingStore) {
            return res.status(400).json({
                success: false,
                message: 'Store name already taken'
            });
        }

        // Create user
        const user = await User.create({
            name,
            email,
            password,
            contactNumber,
            address,
            role: 'customer' // Will be updated to seller after verification
        });

        // Create seller profile (pending verification)
        const seller = await Seller.create({
            userId: user._id,
            storeName,
            storeDescription,
            verificationStatus: 'pending_verification',
            cnicNumber: '0000000000000', // Placeholder, will be updated in step 2
            cnicImages: {
                front: 'pending',
                back: 'pending'
            },
            selfieImage: 'pending'
        });

        res.status(201).json({
            success: true,
            sellerId: seller._id,
            userId: user._id,
            nextStep: 'verification',
            message: 'Basic info saved. Proceed to verification'
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Seller registration - Step 2: AI Verification
// @route   POST /api/v1/auth/seller/register/step2
// @access  Public
exports.sellerRegisterStep2 = async (req, res, next) => {
    try {
        const { sellerId } = req.body;

        // Find seller
        const seller = await Seller.findById(sellerId);
        if (!seller) {
            return res.status(404).json({
                success: false,
                message: 'Seller not found'
            });
        }

        // Files should be uploaded via multer middleware
        // Assuming req.files contains cnicFront, cnicBack, selfie
        if (!req.files || !req.files.cnicFront || !req.files.selfie) {
            return res.status(400).json({
                success: false,
                message: 'Please upload CNIC front and selfie images'
            });
        }

        // Update seller with image URLs
        seller.cnicImages.front = req.files.cnicFront[0].path;
        seller.cnicImages.back = req.files.cnicBack ? req.files.cnicBack[0].path : '';
        seller.selfieImage = req.files.selfie[0].path;

        // TODO: Call AI verification service
        // const aiResult = await callAIVerification(seller.cnicImages.front, seller.selfieImage);

        // For now, set to pending
        seller.verificationStatus = 'pending_verification';
        await seller.save();

        res.status(200).json({
            success: true,
            message: 'Verification documents submitted. Awaiting admin approval',
            status: 'pending_verification'
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Refresh token
// @route   POST /api/v1/auth/refresh-token
// @access  Public
exports.refreshToken = async (req, res, next) => {
    try {
        // Get refresh token from cookie or body
        const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: 'No refresh token provided'
            });
        }

        // TODO: Implement proper refresh token validation
        // For now, just generate a new token

        res.status(200).json({
            success: true,
            message: 'Token refreshed',
            token: 'new_token_here'
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Step 1 of Sequential Verification: CNIC OCR
// @route   POST /api/v1/auth/seller/verify-cnic
// @access  Private
exports.verifyCnic = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please upload CNIC image' });
        }

        const seller = await Seller.findOne({ userId: req.user.id });
        if (!seller) {
            return res.status(404).json({ success: false, message: 'Seller profile not found' });
        }

        const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
        const ocrForm = new FormData();
        ocrForm.append('cnic_image', fs.createReadStream(req.file.path));

        const ocrRes = await axios.post(`${aiUrl}/ocr`, ocrForm, {
            headers: { ...ocrForm.getHeaders() }
        });

        // Update seller with OCR data
        seller.ocrData = {
            name: ocrRes.data.name,
            cnicNumber: ocrRes.data.cnic,
            gender: ocrRes.data.gender,
            extractedFace: ocrRes.data.person_image
        };
        seller.cnicNumber = ocrRes.data.cnic;
        seller.cnicImages.front = req.file.path;

        await seller.save();

        res.status(200).json({
            success: true,
            data: ocrRes.data
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Step 2 of Sequential Verification: Face Match
// @route   POST /api/v1/auth/seller/verify-selfie
// @access  Private
exports.verifySelfie = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please upload selfie image' });
        }

        const seller = await Seller.findOne({ userId: req.user.id });
        if (!seller) {
            return res.status(404).json({ success: false, message: 'Seller profile not found' });
        }

        const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
        const faceForm = new FormData();

        faceForm.append('cnic_image', fs.createReadStream(seller.cnicImages.front));
        faceForm.append('selfie', fs.createReadStream(req.file.path));

        const faceRes = await axios.post(`${aiUrl}/face-verify`, faceForm, {
            headers: { ...faceForm.getHeaders() }
        });

        seller.selfieImage = req.file.path;
        seller.faceMatchScore = faceRes.data.confidence * 100;

        if (faceRes.data.match && seller.ocrData.gender === 'Female') {
            seller.verificationStatus = 'ai_verified';
        } else if (!faceRes.data.match) {
            seller.verificationStatus = 'ai_rejected';
        }

        await seller.save();

        res.status(200).json({
            success: true,
            match: faceRes.data.match,
            confidence: faceRes.data.confidence,
            message: faceRes.data.match ? 'Face match successful' : 'Face match failed'
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Comprehensive AI Verification (Trust Engine)
// @route   POST /api/v1/auth/seller/verify
// @access  Private
exports.comprehensiveVerify = async (req, res, next) => {
    try {
        if (!req.files || !req.files.cnic_image || !req.files.selfie) {
            return res.status(400).json({
                success: false,
                message: 'Both CNIC image and selfie are required'
            });
        }

        const seller = await Seller.findOne({ userId: req.user.id });
        if (!seller) {
            return res.status(404).json({ success: false, message: 'Seller profile not found' });
        }

        const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
        const verifyForm = new FormData();

        verifyForm.append('cnic_image', fs.createReadStream(req.files.cnic_image[0].path));
        verifyForm.append('selfie', fs.createReadStream(req.files.selfie[0].path));

        const verifyRes = await axios.post(`${aiUrl}/verify`, verifyForm, {
            headers: { ...verifyForm.getHeaders() }
        });

        const aiData = verifyRes.data;

        // Update seller images
        seller.cnicImages.front = req.files.cnic_image[0].path;
        seller.selfieImage = req.files.selfie[0].path;

        // Populate OCR Data from new AI pipeline format
        seller.ocrData = {
            name: aiData.report.ocr.name || 'Unknown',
            cnicNumber: aiData.report.ocr.cnic || 'Unknown',
            gender: aiData.report.ocr.gender || 'Unknown',
            confidence: aiData.report.ocr.is_female ? 100 : 0
        };
        seller.cnicNumber = aiData.report.ocr.cnic || '0000000000000';

        // Populate Face Match Data
        seller.faceMatchScore = (aiData.report.face.confidence || 0) * 100;

        // Build AI Report for frontend display
        seller.aiReport = {
            verificationId: `V-${Date.now()}`,
            timestamp: new Date(),
            overallStatus: aiData.status,
            recommendation: aiData.recommendation,
            confidenceLevel: aiData.report.face.confidence > 0.9 ? 'High' : aiData.report.face.confidence > 0.7 ? 'Medium' : 'Low',
            ocrResults: {
                name: aiData.report.ocr.name || 'Unknown',
                cnic: aiData.report.ocr.cnic || 'Unknown',
                gender: aiData.report.ocr.gender || 'Unknown'
            },
            faceRecognitionResults: {
                match: aiData.report.face.match || false,
                confidence: aiData.report.face.confidence || 0
            },
            genderVerification: aiData.report.decision.is_female ? 'PASSED' : 'FAILED',
            authenticityCheck: aiData.report.decision.identity_confirmed ? 'PASSED' : 'FAILED',
            flagsAndWarnings: []
        };

        // Add flags based on AI decision
        if (!aiData.report.decision.is_female) {
            seller.aiReport.flagsAndWarnings.push('GENDER_MISMATCH: Female only platform');
        }
        if (!aiData.report.decision.identity_confirmed) {
            seller.aiReport.flagsAndWarnings.push('IDENTITY_UNCONFIRMED: Face match below threshold');
        }

        // Set Final Status
        seller.verificationStatus = aiData.status.toLowerCase();

        // If AI_VERIFIED, update user role to seller
        if (aiData.status === 'AI_VERIFIED') {
            const user = await User.findById(req.user.id);
            if (user) {
                user.role = 'seller';
                await user.save();
            }
        }

        await seller.save();

        res.status(200).json({
            success: true,
            status: aiData.status,
            recommendation: aiData.recommendation,
            report: seller.aiReport
        });
    } catch (err) {
        console.error('AI Verification Error:', err.message);
        res.status(500).json({
            success: false,
            message: 'AI verification service error. Please try again.',
            error: err.message
        });
    }
};
