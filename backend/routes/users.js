// routes/users.js
const express = require('express');
const router  = express.Router();
const User    = require('../models/User');
const Listing = require('../models/Listing');
const { protect } = require('../middleware/authMiddleware');

// ─── GET PUBLIC PROFILE ──────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const listings = await Listing.find({ seller: req.params.id, status: 'available' })
      .sort('-createdAt').limit(6);

    res.json({ success: true, user, listings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── UPDATE MY PROFILE ───────────────────────────────────────
router.put('/me/update', protect, async (req, res) => {
  try {
    const { name, college, studentYear, department, phone, bio, avatar } = req.body;

    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { name, college, studentYear, department, phone, bio, avatar },
      { new: true, runValidators: true }
    );

    res.json({ success: true, user: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── CHANGE PASSWORD ─────────────────────────────────────────
router.put('/me/password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!(await user.matchPassword(currentPassword))) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── TRACK CATEGORY VIEW (for AI recommendations) ────────────
router.post('/me/track-category', protect, async (req, res) => {
  try {
    const { category } = req.body;
    const user = await User.findById(req.user._id);

    // Keep last 20 viewed categories
    user.viewedCategories.push(category);
    if (user.viewedCategories.length > 20) {
      user.viewedCategories = user.viewedCategories.slice(-20);
    }
    await user.save({ validateBeforeSave: false });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
