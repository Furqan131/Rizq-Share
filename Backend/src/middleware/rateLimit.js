const rateLimit = require('express-rate-limit');

const make = (windowMs, limit, message, extra = {}) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: message },
    ...extra,
  });

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

module.exports = {
  // Everything under /api
  apiLimiter: make(15 * MINUTE, 600, 'Too many requests. Please slow down and try again in a few minutes.'),
  // Only failed logins count, so normal use is never blocked
  loginLimiter: make(15 * MINUTE, 10, 'Too many failed attempts. Please wait 15 minutes and try again.', {
    skipSuccessfulRequests: true,
  }),
  signupLimiter: make(HOUR, 10, 'Too many accounts were created from this network. Please try again later.'),
  // Asking for a reset email (each request sends an email)
  resetLimiter: make(HOUR, 5, 'Too many password reset requests. Please try again in an hour.'),
  // Using a reset link (separate counter, so typos don't block a real reset)
  resetSubmitLimiter: make(HOUR, 10, 'Too many attempts. Please try again in an hour.'),
  contactLimiter: make(HOUR, 5, 'You have sent several messages already. Please try again later.'),
  uploadLimiter: make(HOUR, 30, 'Too many photo uploads. Please try again later.'),
};
