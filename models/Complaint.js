const mongoose = require('mongoose');

const ComplaintSchema = new mongoose.Schema({
    userId: { type: String, required: true }, // This is the Student Roll Number
    category: { type: String, required: true },
    subCategory: { type: String },
    description: { type: String, required: true },
    imageUrl: { type: String }, // For the image link
    status: { type: String, default: "Pending" },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Complaint', ComplaintSchema);