const Blog = require('../model/blog');
const upload = require('../middleware/upload');

// Get all blogs
exports.getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find();
    res.json(blogs);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get a single blog
exports.getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    res.json(blog);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Create a new blog
exports.createBlog = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    if (!req.body.title || !req.body.content) {
      return res.status(400).json({
        success: false,
        message: 'Blog title and content are required'
      });
    }

    const blog = new Blog({
      title: req.body.title,
      content: req.body.content,
      blog_image: req.file.path // Store file path
    });

    const newBlog = await blog.save();

    res.status(201).json({
      success: true,
      message: 'Blog created successfully',
      data: newBlog
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to create blog',
      error: err.message
    });
  }
};

// Update a blog
exports.updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const file = req.file;

    // Find the existing blog
    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    // Update fields if provided
    if (title) {
      blog.title = title;
    }
    if (content) {
      blog.content = content;
    }

    // Handle image upload
    if (file) {
      // Remove old image if it exists
      if (blog.blog_image) {
        const oldFilePath = path.join(__dirname, '..', 'uploads', path.basename(blog.blog_image));
        fs.unlink(oldFilePath, err => {
          if (err) console.error('Error removing old image:', err);
        });
      }
      // Update the blog's image path
      blog.blog_image = file.path;
    }

    // Save the updated blog
    await blog.save();

    res.status(200).json({
      success: true,
      message: 'Blog updated successfully',
      data: blog
    });
  } catch (err) {
    console.error('Error:', err); // Better error logging
    res.status(500).json({
      success: false,
      message: 'Failed to update blog',
      error: err.message
    });
  }
};

// Delete a blog
exports.deleteBlog = async (req, res) => {
  try {
    const result = await Blog.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ message: 'Blog not found' });
    res.json({ message: 'Blog deleted' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
