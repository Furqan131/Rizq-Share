const express = require('express');
const { uploadPhoto } = require('../controllers/upload.controller');
const { requireAuth } = require('../middleware/auth');
const { uploadLimiter } = require('../middleware/rateLimit');
const upload = require('../middleware/upload');

const router = express.Router();

router.post('/', requireAuth, uploadLimiter, upload.single('photo'), uploadPhoto);

module.exports = router;
