require('dotenv').config();
const multer = require('multer');
const cloudinary = require('../config/cloudinaryConfig');
const { v4: uuidv4 } = require('uuid');
const { Readable } = require('stream');

const storage = multer.memoryStorage();
const upload = multer({ storage });

const uploadToCloudinary = (fileBuffer, folder, resourceType = 'image') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        public_id: uuidv4(),
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result); 
      }
    );

    const readableStream = new Readable();
    readableStream.push(fileBuffer);
    readableStream.push(null);
    readableStream.pipe(uploadStream); 
  });
};

// Function to handle multiple image uploads
const uploadMultipleImages = async (files, folder) => {
  try {
    const uploadPromises = files.map(file => uploadToCloudinary(file.buffer, folder, 'image'));

    const results = await Promise.all(uploadPromises);
    return results; 
  } catch (error) {
    console.error('Error uploading multiple images:', error);
    throw error;
  }
};

module.exports = { upload, uploadToCloudinary, uploadMultipleImages };
