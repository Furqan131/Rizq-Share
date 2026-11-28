const express = require('express');
const { getMe, updateMe } = require('../controllers/profile.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, getMe);
router.patch('/', requireAuth, updateMe);

module.exports = router;
