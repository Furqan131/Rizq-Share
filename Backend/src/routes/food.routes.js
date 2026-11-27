const express = require('express');
const {
  createPost,
  getPosts,
  getPublicStats,
  claimPost,
  markCollected,
  getMyPosts,
  getMyClaims,
} = require('../controllers/food.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Public
router.get('/', getPosts);
router.get('/stats', getPublicStats);

// Any logged-in user can donate and receive
router.post('/', requireAuth, createPost);
router.get('/my/posts', requireAuth, getMyPosts);
router.get('/my/claims', requireAuth, getMyClaims);
router.patch('/:id/claim', requireAuth, claimPost);
router.patch('/:id/collect', requireAuth, markCollected);

module.exports = router;