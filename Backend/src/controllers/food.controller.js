const prisma = require('../config/db');

// Donor creates a food post
const createPost = async (req, res) => {
  try {
    const { title, description, quantity, city, area, address, expiresAt } = req.body;

    if (!title || !quantity || !city || !area || !address || !expiresAt) {
      return res.status(400).json({ error: 'Please fill in all required fields' });
    }

    const expiryDate = new Date(expiresAt);
    if (isNaN(expiryDate.getTime()) || expiryDate <= new Date()) {
      return res.status(400).json({ error: 'Expiry time must be a valid time in the future' });
    }

    const post = await prisma.foodPost.create({
      data: {
        title,
        description,
        quantity,
        city,
        area,
        address,
        expiresAt: expiryDate,
        donorId: req.user.id,
      },
    });

    res.status(201).json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
};

// Anyone can browse available posts (optional filters: city, area)
const getPosts = async (req, res) => {
  try {
    const { city, area } = req.query;

    const posts = await prisma.foodPost.findMany({
      where: {
        status: 'AVAILABLE',
        expiresAt: { gt: new Date() },
        ...(city && { city: { equals: city, mode: 'insensitive' } }),
        ...(area && { area: { contains: area, mode: 'insensitive' } }),
      },
      orderBy: { expiresAt: 'asc' },
      include: { donor: { select: { name: true, phone: true } } },
    });

    res.json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
};
// Receiver claims a post
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

    // Return pickup details to the receiver
    const post = await prisma.foodPost.findUnique({
      where: { id },
      include: { donor: { select: { name: true, phone: true } } },
    });

    res.json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
};

// Donor confirms the food was collected
const markCollected = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await prisma.foodPost.updateMany({
      where: { id, donorId: req.user.id, status: 'CLAIMED' },
      data: { status: 'COLLECTED' },
    });

    if (result.count === 0) {
      return res.status(404).json({ error: 'Claimed post not found' });
    }

    res.json({ message: 'Marked as collected' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
};

// Posts created by the logged-in donor
const getMyPosts = async (req, res) => {
  try {
    const posts = await prisma.foodPost.findMany({
      where: { donorId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: { claimedBy: { select: { name: true, phone: true } } },
    });
    res.json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
};

// Posts claimed by the logged-in receiver
const getMyClaims = async (req, res) => {
  try {
    const posts = await prisma.foodPost.findMany({
      where: { claimedById: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: { donor: { select: { name: true, phone: true } } },
    });
    res.json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
};

module.exports = { createPost, getPosts, claimPost, markCollected, getMyPosts, getMyClaims };