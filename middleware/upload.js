const multer = require('multer');
const path = require('path');

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Ensure this path exists and is writable
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Ensure unique filenames
  }
});

// Set up multer with storage and limits
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024
  }
});

module.exports = upload;
