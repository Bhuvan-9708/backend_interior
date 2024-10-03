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

exports.getBlogBySlug = async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug });
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
    res.status(200).json({ success: true, data: blog });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Create a new blog
exports.createBlog = async (req, res) => {
  try {
    const { title, content, status, author, categories, short_desc } = req.body;
    const slug = title.toLowerCase().replace(/ /g, '-');
    if (!req.file || !title || !content || !short_desc) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const blog = new Blog({
      title,
      content,
      slug,
      status: status || 'draft',
      author: author || 'Anonymous',
      blog_image: req.file.path,
      short_desc,
      categories: categories ? categories.split(',') : [],
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
    const { title, content, slug, status, author, categories,short_desc } = req.body;
    const file = req.file;

    const blog = await Blog.findById(id);
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });

    if (title) blog.title = title;
    if (content) blog.content = content;
    if (slug) blog.slug = slug;
    if (short_desc) blog.short_desc = short_desc;
    if (status) blog.status = status;
    if (author) blog.author = author;
    if (categories) blog.categories = categories.split(',');

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
