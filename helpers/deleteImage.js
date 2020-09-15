const cloudinary = require('cloudinary');

module.exports = async (publicId) => {
    return await cloudinary.v2.uploader.destroy(publicId, function(result) { 
        console.log(result);
    });
} 