const express = require('express');
const { submitMessage } = require('../controllers/contact.controller');
const { contactLimiter } = require('../middleware/rateLimit');

const router = express.Router();

router.post('/', contactLimiter, submitMessage);

module.exports = router;
