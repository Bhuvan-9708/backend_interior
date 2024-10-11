require('dotenv').config();
const multer = require('multer');
const cloudinary = require('../config/cloudinaryConfig');
const { v4: uuidv4 } = require('uuid');

const storage = multer.memoryStorage();
const upload = multer({ storage });

const uploadToCloudinary = (fileBuffer, folder, resourceType = 'auto') => {

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_large(
      `data:${resourceType};base64,${fileBuffer.toString('base64')}`, 
      {
        folder: folder,
        public_id: uuidv4(),
        resource_type: resourceType,
        chunk_size: 6 * 1024 * 1024
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
  });
};

module.exports = { upload, uploadToCloudinary };