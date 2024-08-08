const mongoose = require('mongoose');

const careerSchema = new mongoose.Schema({
    email_address: { type: String, required: true },
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    phone_number: { type: String, required: true },
    location: { type: String, required: true },
    job_title: { type: String, required: true },
    resume_file: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Career', careerSchema);
