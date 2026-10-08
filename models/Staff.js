const mongoose = require('mongoose');

const StaffSchema = new mongoose.Schema({
    name: { type: String, required: true },
    userId: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    role: {
        type: String,
        required: true,
        enum: ['admin', 'Electricity', 'Plumbing', 'Carpenter', 'Dispensary', 'Miscellaneous']
    },
    createdAt: { type: Date, default: Date.now }
});

// Index for performant querying by role
StaffSchema.index({ role: 1 });

module.exports = mongoose.model('Staff', StaffSchema, 'staff');
