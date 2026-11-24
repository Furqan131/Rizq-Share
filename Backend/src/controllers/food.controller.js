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

module.exports = { createPost, getPosts };