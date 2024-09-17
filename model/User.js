const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true }, 
    language: { type: String, required: true }, 
    pincode: { type: String, required: true }, 
    email: { type: String, required: true, unique: true }, 
    phone: { type: String, required: true }, 
    propertyLocation: { type: String, required: true },
    otp: { type: String }, 
    otpExpires: { type: Date },
    isVerified: { type: Boolean, default: false }, 
    whatsappOptIn: { type: Boolean, default: false },
    blogSubscribe: { type: Boolean, default: false }, 
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
