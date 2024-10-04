const Contact = require('../model/contact');
const transporter = require('../config/mailer');
const { uploadToCloudinary } = require("../middleware/cloudinaryConfig.js");

// Submit Contact Form
exports.submitContactForm = async (req, res) => {
  try {
    const { first_name, last_name, email, phone, location, category } = req.body;
    const file = req.file;

    if (!first_name || !last_name || !email || !phone || !location || !category) {
      return res.status(400).json({
        success: false,
        message: 'All form fields are required',
      });
    }

    let uploadedFileUrl = null;
    if (file) {
      console.log("File details: ", file);
      const uploadResult = await uploadToCloudinary(file.buffer, 'contact_form');
      uploadedFileUrl = uploadResult.secure_url;
    } else {
      console.log('No file uploaded');
    }

    const contact = new Contact({
      firstName: first_name,
      lastName: last_name,
      email: email,
      phone: phone,
      location: location,
      category: category,
      attachment: uploadedFileUrl,
    });

    await contact.save();

    // Send email notification
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
                ${uploadedFileUrl
                ? `<p><strong>Attachment:</strong> <a href="${uploadedFileUrl}">View/Download</a></p>`
                 : ''
                  }
                <p style="text-align: center; border-top: 1px solid #eeeeee; font-size: 12px; color: #777;">&copy; 2024 ASCHPRO. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: 'Form submitted successfully',
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit form',
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

// Delete a contact form
exports.deleteContactForm = async (req, res) => {
  try {
    const result = await Contact.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ success: false, message: 'Contact form not found' });
    res.status(200).json({ success: true, message: 'Contact form deleted' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
