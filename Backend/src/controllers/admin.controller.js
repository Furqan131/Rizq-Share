const prisma = require('../config/db');
const { deleteImage } = require('../utils/cloudinary');

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
  const [users, admins, posts, available, claimed, collected, pendingPosts, unreadMessages] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.foodPost.count(),
      prisma.foodPost.count({
        where: { status: 'AVAILABLE', approval: 'APPROVED', expiresAt: { gt: now } },
      }),
      prisma.foodPost.count({ where: { status: 'CLAIMED' } }),
      prisma.foodPost.count({ where: { status: 'COLLECTED' } }),
      prisma.foodPost.count({
        where: { approval: 'PENDING', status: 'AVAILABLE', expiresAt: { gt: now } },
      }),
      prisma.contactMessage.count({ where: { isRead: false } }),
    ]);

  res.json({ users, admins, posts, available, claimed, collected, pendingPosts, unreadMessages });
});

// GET /api/admin/posts   (optional ?approval=PENDING | APPROVED | REJECTED)
const getAllPosts = handle(async (req, res) => {
  const { approval } = req.query;
  let where = ['PENDING', 'APPROVED', 'REJECTED'].includes(approval) ? { approval } : {};
  if (approval === 'PENDING') {
    // Posts whose time already ran out can't go live any more
    where = { approval: 'PENDING', status: 'AVAILABLE', expiresAt: { gt: new Date() } };
  }

  const posts = await prisma.foodPost.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: {
      donor: { select: { name: true, email: true } },
      claimedBy: { select: { name: true } },
    },
  });
  res.json(posts);
});

// PATCH /api/admin/posts/:id/approve
const approvePost = handle(async (req, res) => {
  const result = await prisma.foodPost.updateMany({
    where: { id: req.params.id, approval: { not: 'APPROVED' } },
    data: { approval: 'APPROVED', rejectionReason: null },
  });
  if (result.count === 0) {
    return res.status(404).json({ error: 'Post not found or already approved' });
  }
  res.json({ message: 'Post approved' });
});

// PATCH /api/admin/posts/:id/reject   body: { reason? }
const rejectPost = handle(async (req, res) => {
  const reason = String((req.body || {}).reason || '').trim().slice(0, 200);

  // Only food that nobody has claimed yet can be rejected
  const result = await prisma.foodPost.updateMany({
    where: { id: req.params.id, status: 'AVAILABLE' },
    data: { approval: 'REJECTED', rejectionReason: reason || null },
  });
  if (result.count === 0) {
    return res.status(404).json({ error: 'Post not found, or it was already claimed' });
  }
  res.json({ message: 'Post rejected' });
});

// DELETE /api/admin/posts/:id
const deletePost = handle(async (req, res) => {
  const post = await prisma.foodPost.findUnique({
    where: { id: req.params.id },
    select: { imagePublicId: true },
  });
  const result = await prisma.foodPost.deleteMany({ where: { id: req.params.id } });
  if (result.count === 0) return res.status(404).json({ error: 'Post not found' });
  if (post) deleteImage(post.imagePublicId);
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
  approvePost,
  rejectPost,
  deletePost,
  getUsers,
  setUserRole,
  getMessages,
  markMessageRead,
  deleteMessage,
};
