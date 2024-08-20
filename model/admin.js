const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    email: { type: String, required: true },
    password: { type: String, required: true },
    otp: { type: String, required: false },
    otpExpiry: { type: Date, required: false }
});

module.exports = mongoose.model('Admin', adminSchema);
