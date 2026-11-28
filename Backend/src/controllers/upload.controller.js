const { photosEnabled, uploadBuffer } = require('../utils/cloudinary');

// POST /api/uploads  (multipart form, field name "photo")
const uploadPhoto = async (req, res) => {
  try {
    if (!photosEnabled()) {
      return res.status(503).json({ error: 'Photo uploads are not set up on this server yet' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Please choose a photo' });
    }

    const result = await uploadBuffer(req.file.buffer);
    res.status(201).json({ url: result.secure_url, publicId: result.public_id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'The photo could not be uploaded. Please try again.' });
  }
};

module.exports = { uploadPhoto };
