const express = require('express');
const { updateUserProfile, updateAdminProfile } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.resolve('uploads');
        fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
        cb(null, 'profile-' + Date.now() + ext);
    }
});
const upload = multer({ storage: storage });

const router = express.Router();

// @desc    Get logged-in user's profile
// @route   GET /api/v1/users/profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, data: user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @desc    Update user profile
// @route   PUT /api/v1/users/profile
// @access  Private
router.put('/profile', protect, upload.single('profileImage'), updateUserProfile);

// Admin Profile Update
router.put('/admin/update-profile', protect, authorize('admin'), upload.single('profileImage'), updateAdminProfile);

module.exports = router;
