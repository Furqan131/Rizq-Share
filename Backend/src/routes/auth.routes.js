const express = require('express');
const { signup, login, forgotPassword, resetPassword } = require('../controllers/auth.controller');
const { loginLimiter, signupLimiter, resetLimiter, resetSubmitLimiter } = require('../middleware/rateLimit');

const router = express.Router();

router.post('/signup', signupLimiter, signup);
router.post('/login', loginLimiter, login);
router.post('/forgot-password', resetLimiter, forgotPassword);
router.post('/reset-password', resetSubmitLimiter, resetPassword);

module.exports = router;
