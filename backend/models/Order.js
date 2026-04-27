// models/Order.js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  listing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
    required: true
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderType: {
    type: String,
    enum: ['buy', 'rent'],
    required: true
  },
  amount:       { type: Number, required: true },
  rentDays:     { type: Number, default: 1 },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  },
  statusUpdatedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  cancelledAt: { type: Date },
  paymentMethod: {
    type: String,
    enum: ['cash', 'upi', 'online'],
    default: 'cash'
  },
  meetupNote:   { type: String, default: '' },
  buyerSnapshot: {
    name:  { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' }
  },
  rentalStartDate: { type: Date },
  rentalEndDate:   { type: Date },

  // Ratings after completion
  buyerRating:  { type: Number, min: 1, max: 5 },
  sellerRating: { type: Number, min: 1, max: 5 },
  review:       { type: String, default: '' },

  createdAt:    { type: Date, default: Date.now }
});

// Query performance indexes
orderSchema.index({ buyer: 1, createdAt: -1 });
orderSchema.index({ seller: 1, createdAt: -1 });
orderSchema.index({ listing: 1, createdAt: -1 });
orderSchema.index({ seller: 1, status: 1, createdAt: -1 });
orderSchema.index({ buyer: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
