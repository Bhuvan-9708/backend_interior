const Contact = require('../model/contact');
const transporter = require('../config/mailer');

exports.submitContactForm = async (req, res) => {
  try {
    // Extract form fields
    const { first_name, last_name, email, phone, location, category } = req.body;

    // Extract file if it exists
    const file = req.file;
    // Validate that all required fields are provided
    if (!first_name || !last_name || !email || !phone || !location || !category) {
      return res.status(400).json({ message: 'All form fields are required' });
    }

    // Save contact form data to the database
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

    // Prepare email options
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

    res.status(200).json({ message: 'Form submitted successfully' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Failed to submit form' });
  }
};

exports.getAllMail = async (req, res) => {
  try {
    const mail = await Contact.find();
    res.json(mail);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
