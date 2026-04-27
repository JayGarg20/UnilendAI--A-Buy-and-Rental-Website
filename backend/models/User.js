// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false   // never returned in queries by default
  },
  college: {
    type: String,
    required: [true, 'College name is required'],
    trim: true
  },
  studentYear: {
    type: String,
    enum: ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Postgrad'],
    required: true
  },
  department: { type: String, trim: true, default: '' },
  phone: { type: String, default: '' },
  avatar: { type: String, default: '' },
  bio: { type: String, maxlength: 300, default: '' },

  // Used by recommendation engine
  viewedCategories: {
    type: [String],
    default: []
  },
  wishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing'
  }],

  // Aggregated stats
  avgRating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now }
});

// Query performance indexes
userSchema.index({ college: 1 });
userSchema.index({ viewedCategories: 1 });

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare entered password with stored hash
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
