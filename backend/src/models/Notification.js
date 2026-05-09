const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    message: {
        type: String,
        required: [true, 'Please provide a notification message'],
        maxlength: [500, 'Message cannot exceed 500 characters']
    },
    type: {
        type: String,
        enum: ['order', 'payment', 'verification', 'review', 'system'],
        default: 'system'
    },
    is_read: {
        type: Boolean,
        default: false
    },
    link: {
        type: String,
        default: ''
    },
    image: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);
