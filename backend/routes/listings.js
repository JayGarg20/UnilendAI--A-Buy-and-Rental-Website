// routes/listings.js
const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const Listing = require('../models/Listing');
const User    = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

// ─── Multer config (local image upload) ─────────────────────
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    cb(null, allowed.test(file.mimetype));
  }
});

// ─── GET ALL LISTINGS ────────────────────────────────────────
// GET /api/listings?search=&category=&listingType=&condition=&minPrice=&maxPrice=&page=1
router.get('/', async (req, res) => {
  try {
    const {
      search, category, listingType, condition,
      minPrice, maxPrice, college,
      page = 1, limit = 12, sort = '-createdAt'
    } = req.query;

    const filter = { status: 'available' };

    if (search)      filter.$text = { $search: search };
    if (category)    filter.category = category;
    if (condition)   filter.condition = condition;
    if (college)     filter.college = { $regex: college, $options: 'i' };
    if (listingType) {
      filter.$or = [
        { listingType: listingType },
        { listingType: 'both' }
      ];
    }
    if (minPrice || maxPrice) {
      const priceField = listingType === 'rent' ? 'rentPrice' : 'sellPrice';
      filter[priceField] = {};
      if (minPrice) filter[priceField].$gte = Number(minPrice);
      if (maxPrice) filter[priceField].$lte = Number(maxPrice);
    }

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Listing.countDocuments(filter);

    const listings = await Listing.find(filter)
      .populate('seller', 'name college studentYear avgRating avatar')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      listings,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET SINGLE LISTING ──────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate('seller', 'name college studentYear avgRating totalRatings avatar phone bio');
    if (!listing) return res.status(404).json({ error: 'Listing not found.' });

    // Increment view count
    listing.viewCount += 1;
    await listing.save({ validateBeforeSave: false });

    res.json({ success: true, listing });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── CREATE LISTING ──────────────────────────────────────────
router.post('/', protect, upload.array('images', 8), async (req, res) => {
  try {
    const {
      title, description, category, listingType,
      sellPrice, rentPrice, condition
    } = req.body;

    if (!title || !description || !category || !listingType || !condition) {
      return res.status(400).json({ error: 'Please fill in all required fields.' });
    }

    const imageFilenames = req.files ? req.files.map(f => f.filename) : [];

    // AI rule-based price suggestion
    const suggestedPrice = calcSuggestedPrice(category, condition, listingType, sellPrice, rentPrice);

    const listing = await Listing.create({
      title, description, category, listingType,
      sellPrice:      Number(sellPrice)  || 0,
      rentPrice:      Number(rentPrice)  || 0,
      suggestedPrice,
      condition,
      images:  imageFilenames,
      seller:  req.user._id,
      college: req.user.college
    });

    const populated = await Listing.findById(listing._id)
      .populate('seller', 'name college studentYear avatar');

    res.status(201).json({ success: true, listing: populated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── UPDATE LISTING ──────────────────────────────────────────
router.put('/:id', protect, upload.array('images', 8), async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found.' });
    if (listing.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorised to edit this listing.' });
    }

    const updates = { ...req.body };
    if (req.files && req.files.length > 0) {
      updates.images = req.files.map(f => f.filename);
    }
    if (updates.sellPrice || updates.rentPrice) {
      updates.suggestedPrice = calcSuggestedPrice(
        updates.category    || listing.category,
        updates.condition   || listing.condition,
        updates.listingType || listing.listingType,
        updates.sellPrice   || listing.sellPrice,
        updates.rentPrice   || listing.rentPrice
      );
    }

    const updated = await Listing.findByIdAndUpdate(
      req.params.id,
      { ...updates, updatedAt: Date.now() },
      { new: true, runValidators: true }
    ).populate('seller', 'name college studentYear avatar');

    res.json({ success: true, listing: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE LISTING ──────────────────────────────────────────
router.delete('/:id', protect, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found.' });
    if (listing.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorised.' });
    }

    listing.status = 'inactive';
    await listing.save({ validateBeforeSave: false });

    res.json({ success: true, message: 'Listing deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── TOGGLE WISHLIST ─────────────────────────────────────────
router.post('/:id/wishlist', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const listingId = req.params.id;
    const listing = await Listing.findById(listingId);
    if (!listing) return res.status(404).json({ error: 'Listing not found.' });
    const alreadyWishlisted = user.wishlist.map(String).includes(listingId);

    if (alreadyWishlisted) {
      user.wishlist = user.wishlist.filter(id => id.toString() !== listingId);
      if (listing.wishlistCount > 0) {
        await Listing.findByIdAndUpdate(listingId, { $inc: { wishlistCount: -1 } });
      }
    } else {
      user.wishlist.push(listingId);
      await Listing.findByIdAndUpdate(listingId, { $inc: { wishlistCount: 1 } });
    }
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, wishlisted: !alreadyWishlisted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── MY LISTINGS ─────────────────────────────────────────────
router.get('/user/my-listings', protect, async (req, res) => {
  try {
    const listings = await Listing.find({ seller: req.user._id }).sort('-createdAt');
    res.json({ success: true, listings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Rule-based AI price suggestion ─────────────────────────
function calcSuggestedPrice(category, condition, listingType, sellPrice, rentPrice) {
  // Condition multipliers (depreciation)
  const conditionMultiplier = {
    'New':       1.0,
    'Like New':  0.85,
    'Good':      0.70,
    'Fair':      0.55,
    'Poor':      0.40
  };

  // Category base rent fraction (what % of sell price per day makes sense)
  const rentFraction = {
    'Electronics':     0.03,
    'Books & Notes':   0.02,
    'Furniture':       0.04,
    'Lab Equipment':   0.03,
    'Sports & Fitness':0.03,
    'Clothing':        0.05,
    'Stationery':      0.02,
    'Other':           0.025
  };

  const mult   = conditionMultiplier[condition]  || 0.7;
  const frac   = rentFraction[category]           || 0.025;
  const sp     = Number(sellPrice)  || 0;
  const rp     = Number(rentPrice)  || 0;

  if (listingType === 'sell' || listingType === 'both') {
    return Math.round(sp * mult);
  }
  if (listingType === 'rent') {
    // Suggest daily rent from sell price if available, else from rent price
    if (sp > 0) return Math.round(sp * frac * mult);
    return Math.round(rp * mult);
  }
  return 0;
}

module.exports = router;
