const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    project_title: { type: String, required: true },
    project_description: { type: String, required: true },
    project_image: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Project', projectSchema);
