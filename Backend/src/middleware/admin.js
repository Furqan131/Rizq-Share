const prisma = require('../config/db');

// Use AFTER requireAuth. Checks the role in the database (not just the token),
// so removing someone's admin role takes effect immediately.
const requireAdmin = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { role: true },
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admins only' });
    }
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
};

module.exports = { requireAdmin };