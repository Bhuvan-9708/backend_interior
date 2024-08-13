const Blog = require('../model/blog');
const path = require('path');
const fs = require('fs');

// Get all blogs
exports.getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find();
    res.status(200).json({
      success: true,
      message: 'Blogs retrieved successfully',
      data: blogs
    });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Failed to retrieve blogs', error: err.message });
  }
};

// Get a single blog
exports.getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
    res.status(200).json({ success: true, data: blog });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Create a new blog
exports.createBlog = async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!req.file || !title || !content) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const blog = new Blog({
      title,
      content,
      blog_image: req.file.path
    });

    const newBlog = await blog.save();
    res.status(201).json({ success: true, message: 'Blog created successfully', data: newBlog });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create blog', error: err.message });
  }
};

// Update a blog
exports.updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const file = req.file;

    const blog = await Blog.findById(id);
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });

    if (title) blog.title = title;
    if (content) blog.content = content;

    if (file) {
      if (blog.blog_image) {
        fs.unlink(path.join(__dirname, '..', 'uploads', path.basename(blog.blog_image)), err => {
          if (err) console.error('Error removing old image:', err);
        });
      }
      blog.blog_image = file.path;
    }

    const updatedBlog = await blog.save();
    res.status(200).json({ success: true, message: 'Blog updated successfully', data: updatedBlog });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update blog', error: err.message });
  }
};

// Delete a blog
exports.deleteBlog = async (req, res) => {
  try {
    const result = await Blog.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ success: false, message: 'Blog not found' });
    res.status(200).json({ success: true, message: 'Blog deleted' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
