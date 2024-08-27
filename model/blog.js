const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  author: { type: String},
  blog_image: { type: String },
  categories: [{ type: String }],
}, {
  timestamps: true
});

module.exports = mongoose.model('Blog', blogSchema);
