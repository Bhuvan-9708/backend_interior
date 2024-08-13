const Contact = require('../model/contact');
const transporter = require('../config/mailer');

// Submit Contact Form
exports.submitContactForm = async (req, res) => {
  try {
    const { first_name, last_name, email, phone, location, category } = req.body;
    const file = req.file;

    if (!first_name || !last_name || !email || !phone || !location || !category) {
      return res.status(400).json({
        success: false,
        message: 'All form fields are required'
      });
    }

    const contact = new Contact({
      firstName: first_name,
      lastName: last_name,
      email: email,
      phone: phone,
      location: location,
      category: category,
      attachment: file ? file.path : null
    });

    await contact.save();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'bhuvneshkardam@gmail.com',
      subject: 'New Contact Form Submission',
      text: `
        First Name: ${first_name}
        Last Name: ${last_name}
        Email: ${email}
        Phone: ${phone}
        Location: ${location}
        Category: ${category}
      `,
      attachments: file ? [{
        filename: file.originalname,
        path: file.path
      }] : []
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: 'Form submitted successfully'
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit form'
    });
  }
};

// Get All Contact Forms
exports.getAllMail = async (req, res) => {
  try {
    const mail = await Contact.find();
    res.status(200).json({ success: true, message: 'Contacts From retrieved successfully', data: mail });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve Contacts From', error: err.message });
  }
};
