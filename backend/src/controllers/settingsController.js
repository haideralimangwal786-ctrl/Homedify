const GlobalSettings = require('../models/GlobalSettings');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Get current settings
exports.getSettings = async (req, res) => {
    try {
        let settings = await GlobalSettings.findOne();
        if (!settings) {
            settings = await GlobalSettings.create({ commissionRate: 10, deliveryCharge: 200, taxRate: 0 });
        }
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update settings
exports.updateSettings = async (req, res) => {
    try {
        const { commissionRate, deliveryCharge, taxRate } = req.body;
        let settings = await GlobalSettings.findOne();
        
        if (!settings) {
            settings = new GlobalSettings({ 
                commissionRate: commissionRate || 10,
                deliveryCharge: deliveryCharge || 200,
                taxRate: taxRate || 0
            });
        } else {
            if (commissionRate !== undefined) settings.commissionRate = commissionRate;
            if (deliveryCharge !== undefined) settings.deliveryCharge = deliveryCharge;
            if (taxRate !== undefined) settings.taxRate = taxRate;
        }
        
        settings.updatedBy = req.user._id;
        await settings.save();

        // Notify all users if commission or tax changed
        if (commissionRate !== undefined || taxRate !== undefined) {
            let policyMsg = 'Notice: Platform financial policies have been updated.';
            if (commissionRate !== undefined) policyMsg += ` Commission rate is now ${commissionRate}%.`;
            if (taxRate !== undefined) policyMsg += ` Tax rate is now ${taxRate}%.`;

            const allUsers = await User.find({}, '_id');
            const notifications = allUsers.map(user => ({
                userId: user._id,
                message: policyMsg,
                type: 'system',
                link: '/dashboard'
            }));
            await Notification.insertMany(notifications);
        }

        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
