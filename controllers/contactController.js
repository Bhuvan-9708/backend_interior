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
      html: `
                <html>
                    <body>
                        <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
                            <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 20px; border-radius: 5px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
                                <h1 style="text-align: center; border-bottom: 1px solid #eeeeee;">New Application Received</h1>
                                <p><strong>First Name:</strong> ${first_name}</p>
                                <p><strong>Last Name:</strong> ${last_name}</p>
                                <p><strong>Email:</strong> ${email}</p>
                                <p><strong>Phone:</strong> ${phone}</p>
                                <p><strong>Location:</strong> ${location}</p>
                                <p><strong>Job Title:</strong> ${category}</p>
                                ${file ? `<p><strong>CV File:</strong> <a href="${file.path}">Download CV</a></p>` : ''}
                                <p style="text-align: center; border-top: 1px solid #eeeeee; font-size: 12px; color: #777;">&copy; 2024 ASCHPRO. All rights reserved.</p>
                            </div>
                        </div>
                    </body>
                </html>
            `
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
