const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/signatures");
  },
  filename: (req, file, cb) => {
    const nik = req.params.id;
    const ext = path.extname(file.originalname);
    cb(null, `${nik}${ext}`);
  },
});

const uploadSignature = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("File harus image"));
    }
    cb(null, true);
  },
});

module.exports = uploadSignature;
