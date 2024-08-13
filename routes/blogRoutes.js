const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const blogController = require('../controllers/blogController');

// Define routes
router.get('/get-all-blog', blogController.getAllBlogs); //working
router.get('/get-blog/:id', blogController.getBlogById); //working
router.post('/create-blog', upload.single('blog_image'), blogController.createBlog); //working
router.put('/update-blog/:id', upload.single('blog_image'), blogController.updateBlog); //working
router.delete('/delete-blog/:id', blogController.deleteBlog); //working

module.exports = router;
