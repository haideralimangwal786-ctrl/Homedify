const express = require('express');
const { register, login, logout, getMe, checkEmail, checkStoreName } = require('../controllers/authController');
const {
    forgotPassword,
    verifyResetOtp,
    resetPassword,
    verifyEmail,
    resendVerificationEmail,
    sellerRegisterStep1,
    sellerRegisterStep2,
    refreshToken,
    verifyCnic,
    verifySelfie,
    comprehensiveVerify
} = require('../controllers/authExtensions');
const { protect } = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const router = express.Router();

// Basic auth
router.post('/register', register);
router.post('/login', login);
router.get('/logout', logout);
router.get('/me', protect, getMe);
router.post('/check-email', checkEmail);
router.post('/check-store', checkStoreName);

// Password recovery
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp', verifyResetOtp);
router.post('/reset-password', resetPassword);

// Email verification
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', resendVerificationEmail);

// Seller registration (multi-step)
router.post('/seller/register/step1', sellerRegisterStep1);
router.post('/seller/register/step2', sellerRegisterStep2);

// Sequential Verification (Legacy/Step-by-step)
router.post('/seller/verify-cnic', protect, upload.single('cnic_image'), verifyCnic);
router.post('/seller/verify-selfie', protect, upload.single('selfie'), verifySelfie);

// Unified Verification (Homedify Trust Engine)
router.post('/seller/verify', protect, upload.fields([
    { name: 'cnic_image', maxCount: 1 },
    { name: 'selfie', maxCount: 1 }
]), comprehensiveVerify);

// Token refresh
router.post('/refresh-token', refreshToken);

// Google Login
const { googleLogin } = require('../controllers/authController');
router.post('/google-login', googleLogin);

module.exports = router;
