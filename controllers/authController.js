const Admin = require('../model/admin');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const transporter = require('../config/mailer');
const otpGenerator = require('otp-generator');

exports.register = async (req, res) => {
    const { email, password } = req.body;

    try {
        if (await Admin.findOne({ email })) {
            return res.status(400).json({ success: false, message: 'Admin already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 12);
        const otp = Math.floor(100000 + Math.random() * 900000);

        const newAdmin = new Admin({
            email,
            password: hashedPassword,
            otp,
            otpExpiry: Date.now() + 10 * 60 * 1000 // OTP valid for 10 minutes
        });


        // Save the admin document
        await newAdmin.save();

        // Send OTP via email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER, 
            subject: 'New User Registration OTP',
            text: `A new user with email ${email} is attempting to register. The OTP is ${otp}. It will expire in 10 minutes.`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                return res.status(500).json({ success: false, message: 'Error sending OTP email' });
            } else {
                console.log('Email sent:', info.response);
                res.status(201).json({ success: true, message: 'Registration successful, please verify with OTP sent to your email' });
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

exports.verifyOtp = async (req, res) => {
    const { email, otp } = req.body;

    try {
        if (!email || !otp) {
            return res.status(400).json({ success: false, message: 'Email and OTP are required' });
        }

        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        if (admin.otp !== otp) {
            return res.status(400).json({ success: false, message: 'Invalid OTP' });
        }

        if (Date.now() > admin.otpExpiry) {
            return res.status(400).json({ success: false, message: 'OTP has expired' });
        }

        // OTP is valid, clear the OTP and expiry from the database
        admin.otp = null;
        admin.otpExpiry = null;
        admin.isRegistered = true;
        await admin.save();

        res.json({ success: true, message: 'OTP verified successfully, registration complete' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};


exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        if (!(await bcrypt.compare(password, admin.password))) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        // Generate JWT
        const token = jwt.sign({ id: admin._id, email: admin.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({ success: true, message: 'Login successful', data: { token } });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

exports.getAllUser = async (req, res) => {
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
