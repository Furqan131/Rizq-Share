const prisma = require('../config/db');

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/contact  (public)
const submitMessage = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body || {};

    const n = String(name || '').trim();
    const e = String(email || '').trim();
    const s = String(subject || '').trim();
    const m = String(message || '').trim();

    if (!n || !e || !m) {
      return res.status(400).json({ error: 'Name, email and message are required' });
    }
    if (!EMAIL.test(e)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }
    if (n.length > 100 || s.length > 150 || m.length > 2000) {
      return res.status(400).json({ error: 'One of your answers is too long' });
    }

    await prisma.contactMessage.create({
      data: { name: n, email: e, subject: s || null, message: m },
    });

    res.status(201).json({ message: 'Message received' });
    } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong', detail: error.message });
  }
};

module.exports = { submitMessage };