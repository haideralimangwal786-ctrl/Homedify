const mongoose = require('mongoose');
const contentSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['homepage', 'about', 'contact', 'footer', 'banner'],
        required: true,
        unique: true
    },
    content: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Content', contentSchema);
