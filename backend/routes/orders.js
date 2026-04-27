// routes/orders.js
const express = require('express');
const router  = express.Router();
const Order   = require('../models/Order');
const Listing = require('../models/Listing');
const User    = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

// ─── CREATE ORDER ────────────────────────────────────────────
router.post('/', protect, async (req, res) => {
  try {
    const { listingId, orderType, rentDays, paymentMethod, meetupNote } = req.body;

    if (!listingId || !orderType) {
      return res.status(400).json({ error: 'Listing ID and order type are required.' });
    }

    const listing = await Listing.findById(listingId);
    if (!listing)                  return res.status(404).json({ error: 'Listing not found.' });
    if (listing.status !== 'available') return res.status(400).json({ error: 'This item is no longer available.' });
    if (listing.seller.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: 'You cannot order your own listing.' });
    }

    let amount = 0;
    const normalizedRentDays = Math.max(1, Number(rentDays) || 1);
    const rentalStartDate = orderType === 'rent' ? new Date() : undefined;
    const rentalEndDate = orderType === 'rent'
      ? new Date(Date.now() + normalizedRentDays * 24 * 60 * 60 * 1000)
      : undefined;

    if (orderType === 'buy') {
      amount = listing.sellPrice;
    } else {
      amount = listing.rentPrice * normalizedRentDays;
    }

    const order = await Order.create({
      listing:       listingId,
      buyer:         req.user._id,
      seller:        listing.seller,
      orderType,
      amount,
      rentDays:      orderType === 'rent' ? normalizedRentDays : 1,
      paymentMethod: paymentMethod || 'cash',
      meetupNote:    meetupNote    || '',
      buyerSnapshot: {
        name: req.user.name || '',
        email: req.user.email || '',
        phone: req.user.phone || ''
      },
      rentalStartDate,
      rentalEndDate
    });

    // Update listing status
    listing.status = orderType === 'buy' ? 'sold' : 'rented';
    await listing.save({ validateBeforeSave: false });

    const populated = await Order.findById(order._id)
      .populate('listing', 'title images category')
      .populate('buyer',   'name email college')
      .populate('seller',  'name email phone');

    res.status(201).json({ success: true, order: populated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── MY ORDERS (as buyer) ────────────────────────────────────
router.get('/my-orders', protect, async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user._id })
      .populate('listing', 'title images category')
      .populate('seller',  'name email phone avatar')
      .sort('-createdAt');
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── MY SALES (as seller) ────────────────────────────────────
router.get('/my-sales', protect, async (req, res) => {
  try {
    const orders = await Order.find({ seller: req.user._id })
      .populate('listing', 'title images category')
      .populate('buyer',   'name email phone avatar')
      .sort('-createdAt');
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── ORDERS FOR A LISTING (seller only) ──────────────────────
router.get('/listing/:listingId', protect, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.listingId).select('seller');
    if (!listing) return res.status(404).json({ error: 'Listing not found.' });

    if (listing.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only listing owner can view these orders.' });
    }

    const orders = await Order.find({ listing: req.params.listingId })
      .populate('buyer', 'name email phone college studentYear')
      .sort('-createdAt');

    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── UPDATE ORDER STATUS ─────────────────────────────────────
router.patch('/:id/status', protect, async (req, res) => {
  try {
    let { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    const actorId = req.user._id.toString();
    const isBuyer = order.buyer.toString() === actorId;
    const isSeller = order.seller.toString() === actorId;

    if (!isBuyer && !isSeller) {
      return res.status(403).json({ error: 'Not authorised.' });
    }

    // Backward compatibility: treat "confirmed" as "completed"
    if (status === 'confirmed') status = 'completed';

    const allowedStatuses = ['pending', 'completed', 'cancelled'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status update.' });
    }

    // Completed/cancelled are terminal statuses
    if (['completed', 'cancelled'].includes(order.status)) {
      return res.status(400).json({ error: `Order already ${order.status}.` });
    }

    // Permission + transition rules:
    // - Seller: pending -> completed | cancelled
    // - Buyer:  pending -> cancelled only
    if (isBuyer) {
      if (!(order.status === 'pending' && status === 'cancelled')) {
        return res.status(403).json({ error: 'Buyer can only cancel pending orders.' });
      }
    }

    if (isSeller) {
      if (!(order.status === 'pending' && ['completed', 'cancelled'].includes(status))) {
        return res.status(400).json({ error: 'Seller can only approve or decline pending orders.' });
      }
    }

    order.status = status;
    order.statusUpdatedAt = new Date();
    if (status === 'completed') {
      order.completedAt = new Date();
      order.cancelledAt = undefined;
    }
    if (status === 'cancelled') {
      order.cancelledAt = new Date();
      order.completedAt = undefined;
    }
    await order.save();

    if (status === 'cancelled') {
      // Release listing back to marketplace
      await Listing.findByIdAndUpdate(order.listing, { status: 'available' });
    }

    if (status === 'completed') {
      // Ensure listing stays unavailable after seller approval
      await Listing.findByIdAndUpdate(order.listing, {
        status: order.orderType === 'buy' ? 'sold' : 'rented'
      });
    }

    res.json({ success: true, message: `Order ${status}.`, order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── RATE ORDER ──────────────────────────────────────────────
router.post('/:id/rate', protect, async (req, res) => {
  try {
    const { rating, review } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    if (order.status !== 'completed') {
      return res.status(400).json({ error: 'Can only rate completed orders.' });
    }

    const isBuyer  = order.buyer.toString()  === req.user._id.toString();
    const isSeller = order.seller.toString() === req.user._id.toString();

    if (isBuyer) {
      order.sellerRating = rating;
      order.review       = review || '';
      // Update seller avg rating
      const sellerOrders = await Order.find({ seller: order.seller, sellerRating: { $exists: true } });
      const avg = (sellerOrders.reduce((s, o) => s + o.sellerRating, 0) + rating) / (sellerOrders.length + 1);
      await User.findByIdAndUpdate(order.seller, { avgRating: Math.round(avg * 10) / 10, totalRatings: sellerOrders.length + 1 });
    } else if (isSeller) {
      order.buyerRating = rating;
    } else {
      return res.status(403).json({ error: 'Not authorised.' });
    }

    await order.save();
    res.json({ success: true, message: 'Rating submitted!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
