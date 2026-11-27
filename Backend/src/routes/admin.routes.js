const express = require('express');
const {
  getStats,
  getAllPosts,
  approvePost,
  rejectPost,
  deletePost,
  getUsers,
  setUserRole,
  getMessages,
  markMessageRead,
  deleteMessage,
} = require('../controllers/admin.controller');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');

const router = express.Router();

// Every route below needs a logged-in admin
router.use(requireAuth, requireAdmin);

router.get('/stats', getStats);
router.get('/posts', getAllPosts);
router.patch('/posts/:id/approve', approvePost);
router.patch('/posts/:id/reject', rejectPost);
router.delete('/posts/:id', deletePost);
router.get('/users', getUsers);
router.patch('/users/:id/role', setUserRole);
router.get('/messages', getMessages);
router.patch('/messages/:id/read', markMessageRead);
router.delete('/messages/:id', deleteMessage);

module.exports = router;