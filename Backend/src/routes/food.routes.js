const express = require('express');
const {
  createPost,
  getPosts,
  claimPost,
  markCollected,
  getMyPosts,
  getMyClaims,
} = require('../controllers/food.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', getPosts);
router.post('/', requireAuth, requireRole('DONOR', 'ADMIN'), createPost);

// These must come before any route with /:id
router.get('/my/posts', requireAuth, requireRole('DONOR', 'ADMIN'), getMyPosts);
router.get('/my/claims', requireAuth, requireRole('RECEIVER', 'ADMIN'), getMyClaims);

router.patch('/:id/claim', requireAuth, requireRole('RECEIVER', 'ADMIN'), claimPost);
router.patch('/:id/collect', requireAuth, requireRole('DONOR', 'ADMIN'), markCollected);

module.exports = router;