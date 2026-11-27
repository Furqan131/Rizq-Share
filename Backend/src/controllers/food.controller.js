const prisma = require('../config/db');

const serverError = (res, error) => {
  console.error(error);
  res.status(500).json({ error: 'Something went wrong' });
};

// Any logged-in user can post food
const createPost = async (req, res) => {
  try {
    const { title, description, quantity, city, area, address, expiresAt } = req.body || {};

    if (!title || !quantity || !city || !area || !address || !expiresAt) {
      return res.status(400).json({ error: 'Please fill in all required fields' });
    }

    const expiryDate = new Date(expiresAt);
    if (isNaN(expiryDate.getTime()) || expiryDate <= new Date()) {
      return res.status(400).json({ error: 'Expiry time must be a valid time in the future' });
    }

    const post = await prisma.foodPost.create({
      data: {
        title: String(title).trim(),
        description: description ? String(description).trim() : null,
        quantity: String(quantity).trim(),
        city: String(city).trim(),
        area: String(area).trim(),
        address: String(address).trim(),
        expiresAt: expiryDate,
        donorId: req.user.id,
      },
    });

    res.status(201).json(post);
  } catch (error) {
    serverError(res, error);
  }
};

// Public list of available food. The pickup address and phone numbers are NOT
// included here: they are only shown to the person who claims the food.
const getPosts = async (req, res) => {
  try {
    const { city, area } = req.query;
    const take = Math.min(parseInt(req.query.limit, 10) || 100, 100);

    const posts = await prisma.foodPost.findMany({
      where: {
        status: 'AVAILABLE',
        expiresAt: { gt: new Date() },
        ...(city && { city: { equals: city, mode: 'insensitive' } }),
        ...(area && { area: { contains: area, mode: 'insensitive' } }),
      },
      orderBy: { expiresAt: 'asc' },
      take,
      include: { donor: { select: { name: true } } },
    });

    res.json(posts.map(({ address, ...rest }) => rest));
  } catch (error) {
    serverError(res, error);
  }
};

// Public numbers for the home page
const getPublicStats = async (req, res) => {
  try {
    const [available, collected, members] = await Promise.all([
      prisma.foodPost.count({ where: { status: 'AVAILABLE', expiresAt: { gt: new Date() } } }),
      prisma.foodPost.count({ where: { status: 'COLLECTED' } }),
      prisma.user.count(),
    ]);
    res.json({ available, collected, members });
  } catch (error) {
    serverError(res, error);
  }
};

// Claim a post (you can't claim your own)
const claimPost = async (req, res) => {
  try {
    const { id } = req.params;

    // One atomic update: only succeeds if the post is still available,
    // not expired, and not the user's own post. This prevents double claims.
    const result = await prisma.foodPost.updateMany({
      where: {
        id,
        status: 'AVAILABLE',
        expiresAt: { gt: new Date() },
        donorId: { not: req.user.id },
      },
      data: { status: 'CLAIMED', claimedById: req.user.id },
    });

    if (result.count === 0) {
      return res.status(409).json({ error: 'This post is no longer available' });
    }

    const post = await prisma.foodPost.findUnique({
      where: { id },
      include: { donor: { select: { name: true, phone: true } } },
    });

    res.json(post);
  } catch (error) {
    serverError(res, error);
  }
};

// Donor confirms the food was collected
const markCollected = async (req, res) => {
  try {
    const result = await prisma.foodPost.updateMany({
      where: { id: req.params.id, donorId: req.user.id, status: 'CLAIMED' },
      data: { status: 'COLLECTED' },
    });

    if (result.count === 0) {
      return res.status(404).json({ error: 'Claimed post not found' });
    }

    res.json({ message: 'Marked as collected' });
  } catch (error) {
    serverError(res, error);
  }
};

// Posts created by the logged-in user
const getMyPosts = async (req, res) => {
  try {
    const posts = await prisma.foodPost.findMany({
      where: { donorId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: { claimedBy: { select: { name: true, phone: true } } },
    });
    res.json(posts);
  } catch (error) {
    serverError(res, error);
  }
};

// Posts claimed by the logged-in user
const getMyClaims = async (req, res) => {
  try {
    const posts = await prisma.foodPost.findMany({
      where: { claimedById: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: { donor: { select: { name: true, phone: true } } },
    });
    res.json(posts);
  } catch (error) {
    serverError(res, error);
  }
};

module.exports = {
  createPost,
  getPosts,
  getPublicStats,
  claimPost,
  markCollected,
  getMyPosts,
  getMyClaims,
};