const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const { sendMail, clientUrl } = require('../utils/mailer');

const MIN_PASSWORD = 8;
const RESET_MINUTES = 60;

const makeToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

const safeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
});

const sha256 = (text) => crypto.createHash('sha256').update(text).digest('hex');

// Everyone signs up the same way. One account can both donate and receive food.
// (The role column now only matters for ADMIN.)
const signup = async (req, res) => {
  try {
    const { name, password, city, phone } = req.body || {};
    const email = String((req.body || {}).email || '').trim().toLowerCase();

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }
    if (String(name).trim().length > 100 || email.length > 200) {
      return res.status(400).json({ error: 'Name or email is too long' });
    }
    if (String(password).length < MIN_PASSWORD) {
      return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD} characters` });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);

    const user = await prisma.user.create({
      data: {
        name: String(name).trim(),
        email,
        passwordHash,
        city: city ? String(city).trim().slice(0, 100) : null,
        phone: phone ? String(phone).trim().slice(0, 30) : null,
      },
    });

    res.status(201).json({ token: makeToken(user), user: safeUser(user) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
};

const login = async (req, res) => {
  try {
    const password = (req.body || {}).password;
    const email = String((req.body || {}).email || '').trim().toLowerCase();

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const passwordMatches = await bcrypt.compare(String(password), user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    res.json({ token: makeToken(user), user: safeUser(user) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
};

// POST /api/auth/forgot-password   body: { email }
// The answer is always the same, so nobody can use this to find out who has an account.
const forgotPassword = async (req, res) => {
  try {
    const email = String((req.body || {}).email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ error: 'Please enter your email' });

    const reply = () =>
      res.json({ message: 'If an account with that email exists, we have sent a link to reset the password.' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return reply();

    // Only the hash of the secret code is stored. The real code exists only in the email.
    const token = crypto.randomBytes(32).toString('hex');
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: sha256(token),
        expiresAt: new Date(Date.now() + RESET_MINUTES * 60 * 1000),
      },
    });

    const link = `${clientUrl()}/reset-password?token=${token}`;
    try {
      await sendMail({
        to: user.email,
        subject: 'Reset your Rizq Share password',
        text:
          `Hi ${user.name},\n\nUse this link to choose a new password (it works for ${RESET_MINUTES} minutes):\n${link}\n\n` +
          'If you did not ask for this, you can ignore this email. Your password has not changed.',
        html:
          `<p>Hi ${user.name.replace(/[<>&]/g, '')},</p>` +
          `<p>Use the button below to choose a new password. The link works for ${RESET_MINUTES} minutes.</p>` +
          `<p><a href="${link}" style="background:#0e3b2f;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block">Reset password</a></p>` +
          `<p>If you did not ask for this, you can ignore this email. Your password has not changed.</p>`,
      });
    } catch (mailError) {
      // The person still gets the same answer; the problem is logged for you
      console.error('Could not send the reset email:', mailError.message);
    }

    reply();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
};

// POST /api/auth/reset-password   body: { token, password }
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body || {};

    if (!token || !password) {
      return res.status(400).json({ error: 'The reset link and a new password are required' });
    }
    if (String(password).length < MIN_PASSWORD) {
      return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD} characters` });
    }

    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: sha256(String(token)) },
    });
    if (!record || record.expiresAt < new Date()) {
      return res
        .status(400)
        .json({ error: 'This reset link is invalid or has expired. Please request a new one.' });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);
    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
      prisma.passwordResetToken.deleteMany({ where: { userId: record.userId } }),
    ]);

    res.json({ message: 'Your password has been changed. You can log in now.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
};

module.exports = { signup, login, forgotPassword, resetPassword };
