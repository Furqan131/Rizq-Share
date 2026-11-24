const express = require('express');
const { createPost, getPosts } = require('../controllers/food.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', getPosts);
router.post('/', requireAuth, requireRole('DONOR', 'ADMIN'), createPost);

module.exports = router;