require('dotenv').config();
const multer = require('multer');
const cloudinary = require('../config/cloudinaryConfig');
const { v4: uuidv4 } = require('uuid');

// Set up multer storage (using memory storage for quick access to file buffers)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Function to upload a single file to Cloudinary using upload_large
const uploadToCloudinary = (fileBuffer, folder, resourceType = 'image') => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_large(
      `data:${resourceType};base64,${fileBuffer.toString('base64')}`, // Convert buffer to base64
      {
        folder: folder,
        public_id: uuidv4(), // Use a unique ID for each file
        resource_type: resourceType,
        chunk_size: 6 * 1024 * 1024 // Set chunk size to 6MB
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result); // Resolve with Cloudinary's result
      }
    );
  });
};

// Function to handle multiple image uploads
const uploadMultipleImages = async (files, folder) => {
  try {
    // Map through each file and call uploadToCloudinary for each file buffer
    const uploadPromises = files.map(file => 
      uploadToCloudinary(file.buffer, folder, 'image')
    );

    // Wait for all the images to be uploaded concurrently
    const results = await Promise.all(uploadPromises);
    return results; // Return an array of Cloudinary results
  } catch (error) {
    console.error('Error uploading multiple images:', error);
    throw error;
  }
};

module.exports = { upload, uploadMultipleImages };
