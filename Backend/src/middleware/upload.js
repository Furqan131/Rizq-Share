const multer = require('multer');

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

// Photos are kept in memory and sent straight to Cloudinary (nothing is saved on disk)
module.exports = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED.includes(file.mimetype)) return cb(null, true);
    const error = new Error('Only JPG, PNG or WebP photos are allowed');
    error.status = 400;
    cb(error);
  },
});
