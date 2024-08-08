const Career = require('../model/career');
const transporter = require('../config/mailer');

exports.submitCareerForm = async (req, res) => {
    try {
        // Extract form fields
        const { email_address, first_name, last_name, phone_number, location, job_title } = req.body;

        // Extract file if it exists
        const file = req.file;
        console.log("file", req.file);

        // Validate that all required fields are provided
        if (!first_name || !last_name || !email_address || !phone_number || !location || !job_title) {
            return res.status(400).json({ message: 'All form fields are required' });
        }

        // Save career form data to the database
        const career = new Career({
            email_address,
            first_name,
            last_name,
            phone_number,
            location,
            job_title,
            resume_file: file ? file.path : null // Save the file path in the database
        });

        await career.save();

        // Prepare email options
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
            attachments: file ? [{
                filename: file.originalname,
                path: file.path
            }] : []
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: 'Career Form submitted successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Failed to submit Career form' });
    }
};

exports.getAllCareer = async (req, res) => {
    try {
        const career = await Career.find();
        res.json(career);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};
