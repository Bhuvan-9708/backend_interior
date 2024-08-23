const mongoose = require('mongoose');

const HeroSectionSchema = new mongoose.Schema({
    page: {
        type: String,
        required: true,
        unique: true,
    },
    title: {
        type: String,
        required: true,
    },
    text: {
        type: String,
        required: true,
    },
});

module.exports = mongoose.model('HeroSection', HeroSectionSchema);