const mongoose = require('mongoose');

const globalSettingsSchema = new mongoose.Schema({
    commissionRate: {
        type: Number,
        default: 10, // 10%
        required: true
    },
    deliveryCharge: {
        type: Number,
        default: 200, // Default 200 PKR
        required: true
    },
    taxRate: {
        type: Number,
        default: 0, // Default 0%
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

module.exports = mongoose.model('GlobalSettings', globalSettingsSchema);
