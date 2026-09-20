const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipientId: { type: String, required: true }, // 'admin' or a specific userId
    title: String,
    message: String,
    type: String, // 'complaint_status', 'new_complaint', 'assignment'
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);
