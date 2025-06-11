require('dotenv').config();
const { v2: cloudinary } = require('cloudinary');

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload function using buffer
const uploadOnCloudinary = async (fileBuffer, options = {}) => {
  try {
    if (!fileBuffer) return null;
    // Upload directly from buffer as a data URI
    const fileBase64 = `data:image/jpeg;base64,${fileBuffer.toString('base64')}`;
    const response = await cloudinary.uploader.upload(fileBase64, {
      resource_type: 'image',
      ...options,
    });
    return response;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return null;
  }
};

module.exports = { uploadOnCloudinary };