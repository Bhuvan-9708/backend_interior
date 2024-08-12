const Admin = require('../model/admin');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin)
            return res.status(400).json({ success: false, message: 'Admin already exists' });

        const hashedPassword = await bcrypt.hash(password, 12);
        // Create a new admin
        const admin = new Admin({ email, password: hashedPassword });
        await admin.save();

        // Respond with success
        res.status(201).json({ success: true, message: 'Admin registered successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        if (!email || !password)
            return res.status(400).json({ success: false, message: 'Email and password are required' });

        const admin = await Admin.findOne({ email });
        if (!admin)
            return res.status(404).json({ success: false, message: 'Admin not found' });

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch)
            return res.status(400).json({ success: false, message: 'Invalid credentials' });

        // Generate JWT token
        const token = jwt.sign(
            { id: admin._id, email: admin.email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ success: true, message: 'Login successful', data: { token } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};
