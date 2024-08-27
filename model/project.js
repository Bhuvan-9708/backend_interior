const mongoose = require('mongoose');

const projectDetailsSchema = new mongoose.Schema({
    about_project: {
        title: { type: String, required: true },
        description: { type: String, required: true },
    },
    about_array: [{
        title: { type: String, required: true },
        description: { type: String, required: true },
    }],
    crafting_luxurious: {
        title: { type: String, required: true },
        subtitle: { type: String },
        description: { type: String, required: true },
        youtube_link: { type: String },
    }
}, { _id: false });

const projectSchema = new mongoose.Schema({
    project_title: { type: String, required: true },
    project_description: { type: String, required: true },
    project_image: { type: String },
    project_slug: { type: String },
    project_details: projectDetailsSchema,
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Project', projectSchema);
