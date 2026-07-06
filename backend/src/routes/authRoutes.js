const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const auth = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { register, login, changePassword, me } = require('../controllers/authController');

router.post('/register', authLimiter, asyncHandler(register));
router.post('/login', authLimiter, asyncHandler(login));
router.put('/change-password', auth, asyncHandler(changePassword));
router.get('/me', auth, asyncHandler(me));

module.exports = router;
