const prisma = require('../config/db');
const { deleteImage, isOurImage } = require('../utils/cloudinary');

const serverError = (res, error) => {
  console.error(error);
  res.status(500).json({ error: 'Something went wrong' });
};

const clean = (value, max) => String(value || '').trim().slice(0, max);

// Any logged-in user can post food. It waits for an admin to approve it.
const createPost = async (req, res) => {
  try {
    const { title, description, quantity, city, area, address, expiresAt, imageUrl, imagePublicId } = req.body || {};

    if (!title || !quantity || !city || !area || !address || !expiresAt) {
      return res.status(400).json({ error: 'Please fill in all required fields' });
    }

    const expiryDate = new Date(expiresAt);
    if (isNaN(expiryDate.getTime()) || expiryDate <= new Date()) {
      return res.status(400).json({ error: 'Expiry time must be a valid time in the future' });
    }

    // A photo is optional, but it must be one we uploaded ourselves
    let photo = {};
    if (imageUrl) {
      if (!isOurImage(imageUrl, imagePublicId)) {
        return res.status(400).json({ error: 'The photo is not valid. Please upload it again.' });
      }
      photo = { imageUrl, imagePublicId };
    }

    // Every post waits for an admin to approve it, unless an admin posts it
    const poster = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { role: true },
    });
    const approval = poster && poster.role === 'ADMIN' ? 'APPROVED' : 'PENDING';

    const post = await prisma.foodPost.create({
      data: {
        title: clean(title, 120),
        description: description ? clean(description, 1000) : null,
        quantity: clean(quantity, 80),
        city: clean(city, 100),
        area: clean(area, 100),
        address: clean(address, 250),
        expiresAt: expiryDate,
        donorId: req.user.id,
        approval,
        ...photo,
      },
    });

    res.status(201).json(post);
  } catch (error) {
    serverError(res, error);
  }
};

// Public list of available, admin-approved food. The pickup address and phone numbers
// are NOT included here: they are only shown to the person who claims the food.
const getPosts = async (req, res) => {
  try {
    const { city, area } = req.query;
    const take = Math.min(parseInt(req.query.limit, 10) || 100, 100);

    const posts = await prisma.foodPost.findMany({
      where: {
        status: 'AVAILABLE',
        approval: 'APPROVED',
        expiresAt: { gt: new Date() },
        ...(city && { city: { equals: String(city), mode: 'insensitive' } }),
        ...(area && { area: { contains: String(area), mode: 'insensitive' } }),
      },
      orderBy: { expiresAt: 'asc' },
      take,
      include: { donor: { select: { name: true } } },
    });

    res.json(posts.map(({ address, imagePublicId, ...rest }) => rest));
  } catch (error) {
    serverError(res, error);
  }
};

// Public numbers for the home page
const getPublicStats = async (req, res) => {
  try {
    const [available, collected, members] = await Promise.all([
      prisma.foodPost.count({
        where: { status: 'AVAILABLE', approval: 'APPROVED', expiresAt: { gt: new Date() } },
      }),
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

    // One atomic update: only succeeds if the post is still available, approved,
    // not expired, and not the user's own post. This prevents double claims.
    const result = await prisma.foodPost.updateMany({
      where: {
        id,
        status: 'AVAILABLE',
        approval: 'APPROVED',
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

// The receiver gives the food back, or the donor frees it if the receiver doesn't show up.
// The post goes back to AVAILABLE, so someone else can claim it.
const releaseClaim = async (req, res) => {
  try {
    const me = req.user.id;
    const result = await prisma.foodPost.updateMany({
      where: {
        id: req.params.id,
        status: 'CLAIMED',
        OR: [{ claimedById: me }, { donorId: me }],
      },
      data: { status: 'AVAILABLE', claimedById: null },
    });

    if (result.count === 0) {
      return res.status(404).json({ error: 'Claimed post not found' });
    }

    res.json({ message: 'The food is available again' });
  } catch (error) {
    serverError(res, error);
  }
};

// The donor cancels (deletes) their own post, as long as nobody is collecting it
const cancelPost = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await prisma.foodPost.findFirst({
      where: { id, donorId: req.user.id },
      select: { id: true, status: true, imagePublicId: true },
    });
    if (!post) return res.status(404).json({ error: 'Post not found' });

    if (post.status === 'CLAIMED' || post.status === 'COLLECTED') {
      return res.status(409).json({
        error: post.status === 'CLAIMED'
          ? 'Someone has claimed this food. Release the claim first, or mark it as collected.'
          : 'This food was already collected, so it stays in your history.',
      });
    }

    const result = await prisma.foodPost.deleteMany({
      where: { id, donorId: req.user.id, status: { in: ['AVAILABLE', 'EXPIRED'] } },
    });
    if (result.count === 0) {
      return res.status(409).json({ error: 'This post just changed, so it could not be cancelled. Please refresh.' });
    }

    deleteImage(post.imagePublicId);
    res.json({ message: 'Post cancelled' });
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
  releaseClaim,
  cancelPost,
  getMyPosts,
  getMyClaims,
};
