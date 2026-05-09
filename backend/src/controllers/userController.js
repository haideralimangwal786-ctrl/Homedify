const User = require('../models/User');

// @desc    Update user profile
// @route   PUT /api/v1/users/profile
// @access  Private
exports.updateUserProfile = async (req, res, next) => {
    try {
        const { 
            name, 
            contactNumber, 
            address, 
            bio, 
            refundDetails,
            currentPassword,
            newPassword
        } = req.body;

        const user = await User.findById(req.user.id).select('+password');

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // 1. Update Basic Info
        if (name) user.name = name;
        if (bio !== undefined) user.bio = bio;
        
        if (contactNumber) {
            if (!/^[0-9]{11}$/.test(contactNumber)) {
                return res.status(400).json({ success: false, error: 'Please provide a valid 11-digit Pakistani phone number' });
            }
            user.contactNumber = contactNumber;
        }

        // 2. Update Address (merged)
        if (address) {
            user.address = { ...user.address, ...address };
        }

        // 3. Update Refund Details
        if (refundDetails) {
            user.refundDetails = { ...user.refundDetails, ...refundDetails };
        }

        // 4. Handle Profile Picture
        if (req.file) {
            user.picture = req.file.filename;
        }

        // 5. Handle Password Change
        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({ success: false, message: 'Please provide your current password to change it' });
            }
            const isMatch = await user.comparePassword(currentPassword);
            if (!isMatch) {
                return res.status(401).json({ success: false, message: 'Current password is incorrect' });
            }
            user.password = newPassword; 
        }

        await user.save();
        user.password = undefined;

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: user
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// @desc    Admin: Update profile (includes email and password check)
// @route   PUT /api/v1/users/admin/update-profile
// @access  Private (Admin)
exports.updateAdminProfile = async (req, res) => {
    try {
        const { name, email, currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id).select('+password');

        if (!user) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        // 1. Check email uniqueness if changing email
        if (email && email !== user.email) {
            const emailExists = await User.findOne({ email });
            if (emailExists) {
                return res.status(400).json({ success: false, message: 'This email is already registered with another account' });
            }
            user.email = email;
        }

        // 2. Update Name
        if (name) user.name = name;

        // 3. Handle Profile Picture (Multer file)
        if (req.file) {
            user.picture = req.file.filename;
        }

        // 4. Handle Password Change with Double Confirmation
        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({ success: false, message: 'Please provide your current password to change it' });
            }
            const isMatch = await user.comparePassword(currentPassword);
            if (!isMatch) {
                return res.status(401).json({ success: false, message: 'Current password is incorrect' });
            }
            user.password = newPassword; // Pre-save hook will hash this
        }

        await user.save();
        user.password = undefined;

        res.json({ success: true, message: 'Profile updated successfully', data: user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
