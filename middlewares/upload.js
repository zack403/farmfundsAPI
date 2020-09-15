const multer = require("multer");

const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb({message: "Please upload only images."}, false);
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './images/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}${file.originalname}`);
  },
});

const uploadFile = multer({storage: multer.diskStorage({}),  fileFilter: imageFilter });
module.exports = uploadFile;
