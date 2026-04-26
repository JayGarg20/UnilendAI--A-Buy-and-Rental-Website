// models/Listing.js
const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Books & Notes',
      'Electronics',
      'Stationery',
      'Lab Equipment',
      'Clothing',
      'Sports & Fitness',
      'Furniture',
      'Other'
    ]
  },
  listingType: {
    type: String,
    enum: ['sell', 'rent', 'both'],
    required: true
  },
  sellPrice: { type: Number, default: 0 },
  rentPrice: { type: Number, default: 0 },          // price per day
  suggestedPrice: { type: Number, default: 0 },     // AI rule-based suggestion
  condition: {
    type: String,
    enum: ['New', 'Like New', 'Good', 'Fair', 'Poor'],
    required: true
  },
  images: {
    type: [String],   // filenames stored in /uploads
    default: []
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  college: { type: String, required: true },
  status: {
    type: String,
    enum: ['available', 'sold', 'rented', 'inactive'],
    default: 'available'
  },
  viewCount:     { type: Number, default: 0 },
  wishlistCount: { type: Number, default: 0 },
  createdAt:     { type: Date, default: Date.now },
  updatedAt:     { type: Date, default: Date.now }
});

// Full-text search index
listingSchema.index({ title: 'text', description: 'text' });

// Query performance indexes
listingSchema.index({ status: 1, createdAt: -1 });
listingSchema.index({ seller: 1, createdAt: -1 });
listingSchema.index({ category: 1, status: 1, createdAt: -1 });
listingSchema.index({ college: 1, status: 1, createdAt: -1 });
listingSchema.index({ status: 1, viewCount: -1, wishlistCount: -1, createdAt: -1 });
listingSchema.index({ listingType: 1, status: 1, createdAt: -1 });
listingSchema.index({ condition: 1, status: 1, createdAt: -1 });

// Update timestamp on modification
listingSchema.pre('save', function () {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model('Listing', listingSchema);
