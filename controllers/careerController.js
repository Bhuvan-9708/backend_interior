const Career = require('../model/career');
const transporter = require('../config/mailer');
const { uploadToCloudinary } = require("../middleware/cloudinaryConfig.js");

exports.submitCareerForm = async (req, res) => {
    try {
        const { email_address, first_name, last_name, phone_number, location, job_title } = req.body;
        const file = req.file;

        if (!first_name || !last_name || !email_address || !phone_number || !location || !job_title) {
            return res.status(400).json({ success: false, message: 'All form fields are required' });
        }

        let uploadedFileUrl = null;
        if (file) {
            const uploadResult = await uploadToCloudinary(file.buffer, 'career_resumes');
            uploadedFileUrl = uploadResult.secure_url;  
        }

        const career = new Career({
            email_address,
            first_name,
            last_name,
            phone_number,
            location,
            job_title,
            resume_file: uploadedFileUrl 
        });

        await career.save();

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: 'bhuvneshkardam@gmail.com',
            subject: 'New Career Form Submission',
            text: `
            First Name: ${first_name}
            Last Name: ${last_name}
            Email: ${email_address}
            Phone: ${phone_number}
            Location: ${location}
            Job Title: ${job_title}
            `,
            attachments: uploadedFileUrl ? [{ filename: file.originalname, path: uploadedFileUrl }] : [] // Attach the uploaded file URL
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ success: true, message: 'Career form submitted successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Failed to submit career form' });
    }
};

// Get all career entries
exports.getAllCareer = async (req, res) => {
    try {
        const careers = await Career.find();
        res.status(200).json({ success: true, message: 'Jobs retrieved successfully', data: careers });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ success: false, message: 'Failed to retrieve jobs', error: err.message });
    }
};

// Delete a Career form
exports.deleteApplicationsById = async (req, res) => {
    try {
        const result = await Career.findByIdAndDelete(req.params.id);
        if (!result) return res.status(404).json({ success: false, message: 'Career form not found' });
        res.status(200).json({ success: true, message: 'Career form deleted' });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
