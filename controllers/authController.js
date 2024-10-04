const User = require('../model/User')
const Admin = require('../model/admin.js');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOtpEmail = (email, otp) => {
    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your OTP Code',
        text: `Your OTP code is ${otp}. It will expire in 10 minutes.`,
    };

    return transporter.sendMail(mailOptions);
};

exports.registerUser = async (req, res) => {
    const { name, language, pincode, phone, email, propertyLocation, whatsappOptIn, blogSubscribe } = req.body;

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const otp = generateOtp();
        const otpExpires = Date.now() + 10 * 60 * 1000;

        const user = await User.create({
            name,
            language,
            pincode,
            phone,
            email,
            propertyLocation,
            otp,
            otpExpires,
            isVerified: false,
            whatsappOptIn,
            blogSubscribe,
        });

        await sendOtpEmail(user.email, otp);

        res.status(201).json({ message: 'User registered. Please verify OTP sent to your email.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Verify OTP
exports.verifyOtp = async (req, res) => {
    const { email, otp } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or OTP' });
        }

        if (user.otp !== otp || user.otpExpires < Date.now()) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        const token = generateToken(user._id);

        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            token,
            message: 'User verified successfully',
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Login user (optional if no password)
exports.authUser = async (req, res) => {
    const { email, otp } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: 'Invalid email or OTP' });
        }

        if (user && user.otp === otp) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or OTP' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Logout User
exports.logoutUser = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(400).json({ message: 'No token provided' });
        }

        await TokenBlacklist.create({ token });

        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Register a new admin
exports.registerAdmin = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const adminExists = await Admin.findOne({ email });
        if (adminExists) {
            return res.status(400).json({ message: 'Admin already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const otp = generateOtp();
        const otpExpiry = Date.now() + 10 * 60 * 1000; 

        const admin = await Admin.create({
            name,
            email,
            password: hashedPassword,
            otp,
            otpExpiry,
            isVerified: false, 
        });

        await sendOtpEmail(admin.email, otp); 

        res.status(201).json({
            message: 'Admin registered. Please verify OTP sent to your email.',
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.verifyAdminOtp = async (req, res) => {
    const { email, otp } = req.body;

    try {
        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(400).json({ message: 'Invalid email or OTP' });
        }

        if (admin.otp !== otp || admin.otpExpiry < Date.now()) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        admin.isVerified = true;
        admin.otp = undefined; 
        admin.otpExpiry = undefined;
        await admin.save();

        const token = generateToken(admin._id);

        res.status(200).json({
            _id: admin._id,
            name: admin.name,
            email: admin.email,
            token,
            message: 'Admin verified successfully',
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Login an admin
exports.authAdmin = async (req, res) => {
    console.log(req.body);
    const { email, password } = req.body;

    try {
        const admin = await Admin.findOne({ email });

        if (admin && (await bcrypt.compare(password, admin.password))) {
            res.json({
                success: true,
                message: 'Authentication successful',
                data: {
                    _id: admin._id,
                    name: admin.name,
                    email: admin.email,
                    token: generateToken(admin._id),
                },
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getAllAdmin = async (req, res) => {
    try {
        const Admins = await Admin.find();
        res.status(200).json({
            success: true,
            message: 'Admins retrieved successfully',
            data: Admins
        });
    } catch (err) {
        res.status(400).json({ success: false, message: 'Failed to retrieve Admins', error: err.message });
    }
};
