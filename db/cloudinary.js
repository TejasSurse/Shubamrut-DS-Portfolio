// in this 
// 1 get path form server files (uploaded form user)
// 2 upload to cloudinary
// 3 get path from cloudinary
// 4 save path to database
// remove form server

require('dotenv').config();
const { v2: cloudinary } = require('cloudinary');
const fs = require('fs');

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath, options = {}) => {
    try {
        if (!localFilePath) return null;
        // Upload to Cloudinary with provided options
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto',
            ...options // Spread additional options like quality, fetch_format, etc.
        });
        // console.log("File is uploaded to Cloudinary", response.url);
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath); // Remove the local temp file if upload fails
        return null;
    }
};

module.exports = { uploadOnCloudinary };