const cloudinary = require('cloudinary');

module.exports = async (fileUrl) => {
    return await cloudinary.v2.uploader.upload(fileUrl, { eager: [
        { width: 400, height: 300, crop: "fill",  gravity: "face" }]});
} 