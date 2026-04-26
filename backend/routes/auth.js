// routes/auth.js
const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

// Helper: generate JWT token
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'unilend_super_secret', {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });

// ─── REGISTER ───────────────────────────────────────────────
// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, college, studentYear, department, phone } = req.body;

    // Basic validation
    if (!name || !email || !password || !college || !studentYear) {
      return res.status(400).json({ error: 'Please fill in all required fields.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    // Check duplicate
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ error: 'Email is already registered.' });
    }

    // Create user
    const user = await User.create({ name, email, password, college, studentYear, department, phone });

    res.status(201).json({
      success: true,
      message: 'Registration successful!',
      token: generateToken(user._id),
      user: {
        _id:         user._id,
        name:        user.name,
        email:       user.email,
        college:     user.college,
        studentYear: user.studentYear,
        department:  user.department,
        avatar:      user.avatar
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── LOGIN ───────────────────────────────────────────────────
// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    res.json({
      success: true,
      message: 'Login successful!',
      token: generateToken(user._id),
      user: {
        _id:         user._id,
        name:        user.name,
        email:       user.email,
        college:     user.college,
        studentYear: user.studentYear,
        department:  user.department,
        avatar:      user.avatar
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET CURRENT USER ────────────────────────────────────────
// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('wishlist', 'title sellPrice rentPrice images category status');
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
