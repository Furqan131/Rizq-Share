const prisma = require('../config/db');

const handle = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
};

// GET /api/admin/stats
const getStats = handle(async (req, res) => {
  const now = new Date();
  const [users, admins, posts, available, claimed, collected, unreadMessages] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: 'ADMIN' } }),
    prisma.foodPost.count(),
    prisma.foodPost.count({ where: { status: 'AVAILABLE', expiresAt: { gt: now } } }),
    prisma.foodPost.count({ where: { status: 'CLAIMED' } }),
    prisma.foodPost.count({ where: { status: 'COLLECTED' } }),
    prisma.contactMessage.count({ where: { isRead: false } }),
  ]);

  res.json({ users, admins, posts, available, claimed, collected, unreadMessages });
});

// GET /api/admin/posts
const getAllPosts = handle(async (req, res) => {
  const posts = await prisma.foodPost.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: {
      donor: { select: { name: true, email: true } },
      claimedBy: { select: { name: true } },
    },
  });
  res.json(posts);
});

// DELETE /api/admin/posts/:id
const deletePost = handle(async (req, res) => {
  const result = await prisma.foodPost.deleteMany({ where: { id: req.params.id } });
  if (result.count === 0) return res.status(404).json({ error: 'Post not found' });
  res.json({ message: 'Post deleted' });
});

// GET /api/admin/users
const getUsers = handle(async (req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      city: true,
      phone: true,
      createdAt: true,
      _count: { select: { posts: true, claims: true } },
    },
  });
  res.json(users);
});

// PATCH /api/admin/users/:id/role   body: { role: 'ADMIN' | 'MEMBER' }
const setUserRole = handle(async (req, res) => {
  const { role } = req.body || {};
  if (!['ADMIN', 'MEMBER'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: "You can't change your own role" });
  }

  // Members are stored with the default (non-admin) role value
  const dbRole = role === 'ADMIN' ? 'ADMIN' : 'RECEIVER';
  const result = await prisma.user.updateMany({ where: { id: req.params.id }, data: { role: dbRole } });
  if (result.count === 0) return res.status(404).json({ error: 'User not found' });
  res.json({ message: 'Role updated' });
});

// GET /api/admin/messages
const getMessages = handle(async (req, res) => {
  const messages = await prisma.contactMessage.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  res.json(messages);
});

// PATCH /api/admin/messages/:id/read
const markMessageRead = handle(async (req, res) => {
  const result = await prisma.contactMessage.updateMany({
    where: { id: req.params.id },
    data: { isRead: true },
  });
  if (result.count === 0) return res.status(404).json({ error: 'Message not found' });
  res.json({ message: 'Marked as read' });
});

// DELETE /api/admin/messages/:id
const deleteMessage = handle(async (req, res) => {
  const result = await prisma.contactMessage.deleteMany({ where: { id: req.params.id } });
  if (result.count === 0) return res.status(404).json({ error: 'Message not found' });
  res.json({ message: 'Message deleted' });
});

module.exports = {
  getStats,
  getAllPosts,
  deletePost,
  getUsers,
  setUserRole,
  getMessages,
  markMessageRead,
  deleteMessage,
};