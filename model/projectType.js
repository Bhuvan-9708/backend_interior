const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const projectTypeSchema = new Schema({
    project_type: { type: String, required: true, unique: true },
    type_description: { type: String, required: true }
}, {
    timestamps: true
});

module.exports = mongoose.model('ProjectType', projectTypeSchema);
