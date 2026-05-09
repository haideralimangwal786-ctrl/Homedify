const express = require('express');
const router = express.Router();
const path = require('path');
const { protect, authorize } = require('../middleware/auth');
const Seller = require('../models/Seller');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Review = require('../models/Review');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const sendEmail = require('../utils/sendEmail');
const User = require('../models/User');
const Notification = require('../models/Notification');

// Multer storage with proper file extension preservation
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.resolve('uploads');
        fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
        cb(null, file.fieldname + '-' + Date.now() + ext);
    }
});
const upload = multer({ storage: storage });

// @desc    Get current seller profile (from JWT)
// @route   GET /api/v1/sellers/me
// @access  Private (Seller)
router.get('/me', protect, authorize('seller', 'admin'), async (req, res) => {
    try {
        const seller = await Seller.findOne({ userId: req.user.id }).populate('userId', 'name email contactNumber');
        if (!seller) {
            return res.status(404).json({ success: false, message: 'Seller profile not found' });
        }
        res.json({ success: true, data: seller });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @desc    Update seller store info
// @route   PUT /api/v1/sellers/me
// @access  Private (Seller)
router.put('/me', protect, authorize('seller'), async (req, res) => {
    try {
        let seller = await Seller.findOne({ userId: req.user.id });
        if (!seller) {
            return res.status(404).json({ success: false, message: 'Seller profile not found' });
        }

        const fieldsToUpdate = {
            storeName: req.body.storeName,
            storeDescription: req.body.storeDescription,
            storeAddress: req.body.storeAddress,
            paymentMethod: req.body.paymentMethod,
            paymentAccountNumber: req.body.paymentAccountNumber
        };

        seller = await Seller.findByIdAndUpdate(seller._id, fieldsToUpdate, {
            new: true,
            runValidators: true
        });

        res.json({ success: true, data: seller });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error updating seller profile' });
    }
});

// @desc    Get seller dashboard stats
// @route   GET /api/v1/sellers/dashboard
// @access  Private (Seller)
router.get('/dashboard', protect, authorize('seller', 'admin'), async (req, res) => {
    try {
        const seller = await Seller.findOne({ userId: req.user.id });
        if (!seller) {
            return res.status(404).json({ success: false, message: 'Seller profile not found' });
        }

        // Parallel queries for performance
        const [totalProducts, pendingOrders, pendingReviews, recentOrders] = await Promise.all([
            Product.countDocuments({ sellerId: seller._id }),
            Order.countDocuments({ sellerId: seller._id, status: { $in: ['confirmed', 'processing'] } }),
            Review.countDocuments({ sellerId: seller._id, status: 'pending' }),
            Order.find({ sellerId: seller._id })
                .populate('customerId', 'name')
                .sort({ createdAt: -1 })
                .limit(5)
        ]);

        res.json({
            success: true,
            data: {
                totalProducts,
                pendingOrders,
                totalEarnings: seller.totalEarnings || 0,
                availableBalance: seller.availableBalance || 0,
                pendingBalance: seller.pendingBalance || 0,
                pendingReviews,
                verificationStatus: seller.verificationStatus,
                storeName: seller.storeName,
                recentOrders
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @desc    Get seller earnings & payment history
// @route   GET /api/v1/sellers/earnings
// @access  Private (Seller)
router.get('/earnings', protect, authorize('seller', 'admin'), async (req, res) => {
    try {
        const seller = await Seller.findOne({ userId: req.user.id });
        if (!seller) {
            return res.status(404).json({ success: false, message: 'Seller profile not found' });
        }

        // Pending payments (held or awaiting release)
        const pendingPayments = await Payment.find({
            sellerId: seller._id,
            paymentStatus: { $in: ['held', 'release_requested', 'pending'] }
        }).populate('orderId', 'orderId total createdAt');

        const pendingAmount = pendingPayments.reduce((sum, p) => sum + (p.sellerAmount || 0), 0);

        // Released payment history
        const releasedPayments = await Payment.find({
            sellerId: seller._id,
            paymentStatus: 'released'
        })
            .populate('orderId', 'orderId total createdAt')
            .sort({ updatedAt: -1 })
            .limit(30);

        res.json({
            success: true,
            data: {
                totalEarnings: seller.totalEarnings || 0,
                availableBalance: seller.availableBalance || 0,
                pendingAmount,
                pendingPayments,
                transactionHistory: releasedPayments
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @desc    Scan CNIC image for OCR text extraction
// @route   POST /api/v1/sellers/scan-cnic
// @access  Public (Used during registration)
router.post('/scan-cnic', upload.fields([
    { name: 'cnic_image', maxCount: 1 }
]), async (req, res) => {
    try {
        // Diagnostic check: If the field is missing, we log what was actually received
        if (!req.files || !req.files.cnic_image) {
            console.error('[ScanCNIC] Missing cnic_image. Received Fields:', Object.keys(req.files || {}), 'Headers:', req.headers['content-type']);
            return res.status(400).json({ 
                success: false, 
                message: `Please upload cnic_image. Received: ${req.headers['content-type']}`,
                debugInfo: {
                    hasFiles: !!req.files,
                    receivedFields: Object.keys(req.files || {}),
                    contentType: req.headers['content-type']
                }
            });
        }

        const cnicFile = req.files.cnic_image[0];
        const form = new FormData();
        form.append('cnic_image', fs.createReadStream(cnicFile.path), {
            filename: cnicFile.originalname || 'cnic.jpg',
            contentType: cnicFile.mimetype || 'image/jpeg'
        });

        console.log(`[ScanCNIC] Proxying to AI Service: ${process.env.AI_SERVICE_URL}/api/scan_cnic`);
        console.log(`[ScanCNIC] File: ${cnicFile.path} | Original: ${cnicFile.originalname} | Type: ${cnicFile.mimetype}`);
        
        const aiResponse = await axios.post(`${process.env.AI_SERVICE_URL}/api/scan_cnic`, form, {
            headers: { ...form.getHeaders() },
            timeout: 120000 // Increased to 2 minutes for slow systems
        });

        console.log(`[ScanCNIC] AI Response:`, JSON.stringify(aiResponse.data));
        
        // If the AI service returned success: false internally, we treat it as a 400 error for the frontend
        if (aiResponse.data && aiResponse.data.success === false) {
            return res.status(400).json({ 
                success: false, 
                message: aiResponse.data.message || 'AI service failed to identify CNIC patterns',
                ocrResults: aiResponse.data.ocrResults 
            });
        }

        res.json({ success: true, data: aiResponse.data });
    } catch (err) {
        console.error('[ScanCNIC] Proxy Error:', err.message);
        let errorMsg = 'CNIC scan service is temporarily unavailable';
        let statusCode = 500;
        
        if (err.response) {
            console.error('[ScanCNIC] AI Response Error:', err.response.data);
            errorMsg = err.response.data.message || 'AI service failed to process CNIC';
            statusCode = err.response.status;
        } else if (err.code === 'ECONNREFUSED') {
            errorMsg = 'AI microservice is not running on port 5001';
        } else if (err.code === 'ETIMEDOUT') {
            errorMsg = 'AI service response timed out';
        }
        
        res.status(statusCode).json({ success: false, message: errorMsg, error: err.message });
    }
});

// @desc    Check if a CNIC is already registered
// @route   GET /api/v1/sellers/check-cnic/:cnic
// @access  Public
router.get('/check-cnic/:cnic', async (req, res) => {
    try {
        const { cnic } = req.params;
        // Clean CNIC for matching (remove dashes)
        const cleanCnic = cnic.replace(/[-\s]/g, '');
        
        const existingSeller = await Seller.findOne({ 
            $or: [
                { cnicNumber: cleanCnic },
                { 'ocrData.cnicNumber': cnic }
            ]
        });

        if (existingSeller) {
            return res.json({ 
                success: true, 
                exists: true, 
                message: 'Your data is Already Exist' 
            });
        }

        res.json({ success: true, exists: false });
    } catch (err) {
        console.error('[CheckCNIC] Error:', err.message);
        res.status(500).json({ success: false, message: 'Server error check CNIC availability' });
    }
});

// @desc    Quick face match check before registration (no auth needed)
// @route   POST /api/v1/sellers/pre-check-face
// @access  Public
router.post('/pre-check-face', upload.fields([
    { name: 'selfie_image', maxCount: 1 }
]), async (req, res) => {
    try {
        const { cnic_face_base64 } = req.body;
        if (!cnic_face_base64) {
            return res.status(400).json({ success: false, message: 'Missing cnic_face_base64' });
        }
        if (!req.files || !req.files.selfie_image) {
            return res.status(400).json({ success: false, message: 'Missing selfie_image' });
        }

        const selfieFile = req.files.selfie_image[0];
        const form = new FormData();
        form.append('cnic_face_base64', cnic_face_base64);
        form.append('selfie_image', fs.createReadStream(selfieFile.path), {
            filename: selfieFile.originalname || 'selfie.jpg',
            contentType: selfieFile.mimetype || 'image/jpeg'
        });

        console.log('[FaceCheck] Proxying quick face match to AI Service...');
        const aiResponse = await axios.post(`${process.env.AI_SERVICE_URL}/api/face_match`, form, {
            headers: { ...form.getHeaders() },
            timeout: 60000
        });

        console.log('[FaceCheck] Result:', JSON.stringify(aiResponse.data));
        res.json({ success: true, data: aiResponse.data });
    } catch (err) {
        console.error('[FaceCheck] Error:', err.message);
        let errorMsg = 'Face match service unavailable';
        if (err.code === 'ECONNREFUSED') errorMsg = 'AI microservice is not running on port 5001';
        res.status(500).json({ success: false, message: errorMsg });
    }
});
// @desc    Verify seller identity using AI microservice
// @route   POST /api/v1/sellers/verify
// @access  Private (Seller/Customer)
router.post('/verify', protect, authorize('seller', 'customer'), upload.fields([
    { name: 'cnic_image', maxCount: 1 },
    { name: 'selfie_image', maxCount: 1 }
]), async (req, res) => {
    try {
        if (!req.files || !req.files.cnic_image || !req.files.selfie_image) {
            return res.status(400).json({ success: false, message: 'Please upload both cnic_image and selfie_image' });
        }

        let seller = await Seller.findOne({ userId: req.user.id });
        if (!seller) {
            // For new sellers going through registration
            return res.status(404).json({ success: false, message: 'Seller profile not found' });
        }

        const form = new FormData();
        form.append('cnic_image', fs.createReadStream(req.files.cnic_image[0].path), {
            filename: req.files.cnic_image[0].originalname || 'cnic.jpg',
            contentType: req.files.cnic_image[0].mimetype || 'image/jpeg'
        });
        form.append('selfie_image', fs.createReadStream(req.files.selfie_image[0].path), {
            filename: req.files.selfie_image[0].originalname || 'selfie.jpg',
            contentType: req.files.selfie_image[0].mimetype || 'image/jpeg'
        });

        console.log(`[SellerVerify] Proxying request to AI Service: ${process.env.AI_SERVICE_URL}`);
        const aiResponse = await axios.post(`${process.env.AI_SERVICE_URL}/api/verify_seller`, form, {
            headers: {
                ...form.getHeaders()
            },
            timeout: 180000 // Increased to 3 minutes for face matching on slow systems
        });
        console.log(`[SellerVerify] AI Service responded with status: ${aiResponse.data.status}`);

        // Store paths in DB or handle verification response
        seller.cnicImages = seller.cnicImages || {};
        seller.cnicImages.front = req.files.cnic_image[0].path;
        seller.selfieImage = req.files.selfie_image[0].path;

        // Map AI response to the Seller model fields
        const aiData = aiResponse.data;
        const step1 = aiData.step1_data || {};
        const step2 = aiData.step2_data || {};

        if (aiData.FINAL_DECISION) {
            // VERIFIED SELLER -> ai_verified
            // REJECTED -> rejected
            seller.verificationStatus = aiData.FINAL_DECISION === 'VERIFIED SELLER' ? 'ai_verified' : 'rejected';
            
            if (seller.verificationStatus === 'ai_verified') {
                try {
                    const user = await User.findById(req.user.id);
                    if (user && user.email) {
                        await sendEmail({
                            email: user.email,
                            subject: 'Registration Successful - Homedify Approval Pending',
                            message: 'Congratulations! Your identity verification is complete. Admin approval is pending.',
                              html: `
                                <p>Congratulations <strong>${user.name}</strong>! Your identity verification is successfully complete.</p>
                                <p>Now our Admin will perform a final review of your store details. This typically takes <strong>2 to 3 hours</strong>.</p>
                              `
                        });
                        console.log(`[SellerVerify] Success email sent to ${user.email}`);
                    }
                } catch (emailErr) {
                    console.error('[SellerVerify] Failed to send email:', emailErr.message);
                }
            }
        }

        // 1. Store OCR Data
        if (step1.success) {
            seller.ocrData = {
                name: step1.name,
                cnicNumber: step1.cnic,
                gender: step1.gender
            };

            // Sync with main cnicNumber field if valid (13 digits)
            if (step1.cnic && step1.cnic !== 'Not Found') {
                const cleanCnic = step1.cnic.replace(/[-\s]/g, '');
                if (/^[0-9]{13}$/.test(cleanCnic)) {
                    seller.cnicNumber = cleanCnic;
                }
            }
        }

        // 2. Store Face Match Score (Scale 0-100)
        if (step2 && step2.confidence !== undefined) {
            seller.faceMatchScore = Math.round(step2.confidence);
        }

        // 3. Store full AI report object for deep auditing
        seller.aiReport = {
            step1_data: step1,
            step2_data: step2,
            overallStatus: aiData.FINAL_DECISION,
            recommendation: aiData.reason,
            timestamp: new Date()
        };

        // 4. Update verification history log
        seller.verificationHistory.push({
            status: seller.verificationStatus,
            note: aiData.reason || 'Automated AI check complete',
            date: new Date()
        });

        await seller.save();
        
        // Notify Admins for Final Verification Review
        try {
            const admins = await User.find({ role: 'admin' });
            for (const admin of admins) {
                await Notification.create({
                    userId: admin._id,
                    message: `🛡️ New Seller Verification Request! ${seller.storeName} has completed AI scanning and needs review.`,
                    type: 'verification',
                    link: '/admin/verification'
                });
            }
        } catch (notifErr) {
            console.error('Notification creation failed during seller verification:', notifErr);
        }

        res.json({
            success: true,
            data: aiData,
            message: 'Verification processed successfully by AI microservice'
        });
    } catch (err) {
        console.error('[SellerVerify] Proxy Error:', err.message);
        let errorMsg = 'Identity verification service error';
        let statusCode = 500;

        if (err.response) {
            console.error('[SellerVerify] AI Microservice Response:', err.response.data);
            errorMsg = err.response.data.reason || 'AI verification model returned an error';
            statusCode = err.response.status;
        } else if (err.code === 'ECONNREFUSED') {
            errorMsg = 'AI microservice is not running. Path: ' + process.env.AI_SERVICE_URL;
        } else if (err.code === 'ETIMEDOUT') {
            errorMsg = 'AI verification timed out (took longer than 2 minutes)';
        }

        res.status(statusCode).json({ success: false, message: errorMsg, error: err.message });
    }
});

module.exports = router;

