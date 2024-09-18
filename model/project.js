const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Schema for each project
const projectSchema = new Schema({
    projectName: { type: String, required: true },
    projectShortDescription: { type: String, required: true },
    projectImage: { type: String, required: true }, // URL or path to the project image

    // Section 1: Initial Concepts
    sections: {
        mainHeading: { type: String }, // For "Initial Concepts"
        sub_sections_one: {
            title: { type: String },
            description: { type: String }
        },
        sub_sections_two: {
            title: { type: String },
            description: { type: String }
        },
        sub_sections_three: {
            title: { type: String },
            description: { type: String }
        }
    },

    // Section 2: Gallery
    gallery: {
        heading: { type: String },
        subheading: { type: String },
        images: [{ type: String }] // Array of image URLs or paths
    },

    // Section 3: Project
    projectDetails: {
        heading: { type: String },
        subheading: { type: String },
        videoURL: { type: String } // URL to a project video
    },

    // Section 4: Additional Media
    additionalMedia: {
        title: { type: String },
        headingDescription: { type: String },
        description: { type: String },
        videoLink: { type: String } // URL to another video
    },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Project', projectSchema);
