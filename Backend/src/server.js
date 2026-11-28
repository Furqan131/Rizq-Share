require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { apiLimiter } = require('./middleware/rateLimit');
const { photosEnabled } = require('./utils/cloudinary');
const { startCleanupJob } = require('./jobs/cleanup');

// Refuse to start with a missing or weak token secret
const isProduction = process.env.NODE_ENV === 'production';
const secret = process.env.JWT_SECRET || '';
if (!secret) {
  console.error('JWT_SECRET is missing. Add it to backend/.env');
  process.exit(1);
}
if (isProduction && secret.length < 32) {
  console.error('In production, JWT_SECRET must be at least 32 random characters.');
  process.exit(1);
}

const app = express();

// When hosted behind a proxy (Render, Railway...), set TRUST_PROXY=1 so rate limits see real visitor addresses
if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY) || 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// Only your own website may call the API (set CLIENT_URL on the live server)
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((s) => s.trim().replace(/\/$/, ''));
app.use(
  cors({
    origin: (origin, callback) =>
      !origin || allowedOrigins.includes(origin) ? callback(null, true) : callback(new Error('Not allowed by CORS')),
  })
);

app.use(express.json({ limit: '100kb' }));
app.use('/api', apiLimiter);

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/posts', require('./routes/food.routes'));
app.use('/api/uploads', require('./routes/upload.routes'));
app.use('/api/me', require('./routes/profile.routes'));
app.use('/api/contact', require('./routes/contact.routes'));
app.use('/api/admin', require('./routes/admin.routes'));

// Lets the website know which optional features are switched on
app.get('/api/config', (req, res) => res.json({ photos: photosEnabled() }));

app.get('/', (req, res) => {
  res.json({ message: 'Hello from Rizq Share' });
});

app.use('/api', (req, res) => res.status(404).json({ error: 'Route not found' }));

// One place that turns errors into clean JSON answers
app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'This website is not allowed to use the API.' });
  }
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid request data' });
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'The request is too large' });
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'The photo is too large. The limit is 5 MB.' });
  }
  if (err.status && err.status < 500) return res.status(err.status).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  startCleanupJob();
});
