const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

const publicUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  city: u.city,
  phone: u.phone,
  createdAt: u.createdAt,
});

// GET /api/me
const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: 'Account not found' });
    res.json(publicUser(user));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
};

// PATCH /api/me  (name, city, phone)
const updateMe = async (req, res) => {
  try {
    const { name, city, phone } = req.body || {};

    const current = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!current) return res.status(404).json({ error: 'Account not found' });

    const data = {};

    if (name !== undefined) {
      const n = String(name).trim();
      if (!n || n.length > 100) {
        return res.status(400).json({ error: 'Name is required (up to 100 characters)' });
      }
      data.name = n;
    }
    if (city !== undefined) data.city = String(city).trim().slice(0, 100) || null;
    if (phone !== undefined) data.phone = String(phone).trim().slice(0, 30) || null;

    const user = await prisma.user.update({ where: { id: current.id }, data });

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({ token, user: publicUser(user) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
};

module.exports = { getMe, updateMe };
