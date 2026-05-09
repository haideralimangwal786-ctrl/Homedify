const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Notification = require('../models/Notification');

// @desc    Get logged-in user's notifications
// @route   GET /api/v1/notifications
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .limit(50);

        const unreadCount = await Notification.countDocuments({ userId: req.user.id, is_read: false });

        res.json({
            success: true,
            count: notifications.length,
            unreadCount,
            data: notifications
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @desc    Mark ALL notifications as read
// @route   PUT /api/v1/notifications/read-all
// @access  Private
router.put('/read-all', protect, async (req, res) => {
    try {
        await Notification.updateMany(
            { userId: req.user.id, is_read: false },
            { is_read: true }
        );
        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @desc    Mark single notification as read
// @route   PUT /api/v1/notifications/:id/read
// @access  Private
router.put('/:id/read', protect, async (req, res) => {
    try {
        const notif = await Notification.findById(req.params.id);
        if (!notif) return res.status(404).json({ success: false, message: 'Notification not found' });

        if (String(notif.userId) !== String(req.user.id)) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }

        notif.is_read = true;
        await notif.save();

        res.json({ success: true, data: notif });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @desc    Delete a notification
// @route   DELETE /api/v1/notifications/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const notif = await Notification.findById(req.params.id);
        if (!notif) return res.status(404).json({ success: false, message: 'Notification not found' });

        if (String(notif.userId) !== String(req.user.id)) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }

        await notif.deleteOne();
        res.json({ success: true, data: {} });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
