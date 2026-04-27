// routes/ai.js
// Rule-based AI: recommendations + price suggestions
// No external ML libraries required — pure logic.
const express = require('express');
const https = require('https');
const router  = express.Router();
const Listing = require('../models/Listing');
const User    = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

const CATEGORIES = ['Books & Notes', 'Electronics', 'Stationery', 'Lab Equipment', 'Clothing', 'Sports & Fitness', 'Furniture', 'Other'];
const CONDITIONS = ['New', 'Like New', 'Good', 'Fair', 'Poor'];

// ═══════════════════════════════════════════════════════════
// RECOMMENDATION ENGINE  (collaborative + category-based)
// ═══════════════════════════════════════════════════════════
// Logic:
//  1. Look at what categories this user has browsed (viewedCategories)
//  2. Find popular listings in those categories
//  3. Also surface trending listings (high viewCount + wishlistCount)
//  4. Exclude only the user's own listings
// ═══════════════════════════════════════════════════════════

// GET /api/ai/recommendations  (requires login)
router.get('/recommendations', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    // Count category frequency from browsing history
    const categoryFreq = {};
    (user.viewedCategories || []).forEach(cat => {
      categoryFreq[cat] = (categoryFreq[cat] || 0) + 1;
    });

    // Top 3 most-viewed categories
    const topCats = Object.entries(categoryFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat]) => cat);

    let personalised = [];

    if (topCats.length > 0) {
      // Category-based recommendations
      personalised = await Listing.find({
        category: { $in: topCats },
        status:   'available',
        seller:   { $ne: req.user._id }
      })
        .populate('seller', 'name college avgRating avatar')
        .sort('-viewCount -wishlistCount')
        .limit(8);
    }

    // Trending listings (college-aware — same college first)
    const trending = await Listing.find({
      status:   'available',
      seller:   { $ne: req.user._id }
    })
      .populate('seller', 'name college avgRating avatar')
      .sort('-viewCount -wishlistCount -createdAt')
      .limit(8);

    // Same-college recommendations
    const sameCollege = await Listing.find({
      college:  req.user.college,
      status:   'available',
      seller:   { $ne: req.user._id }
    })
      .populate('seller', 'name college avgRating avatar')
      .sort('-createdAt')
      .limit(6);

    res.json({
      success: true,
      recommendations: {
        personalised,
        trending,
        sameCollege,
        basedOn: topCats.length > 0 ? topCats : ['trending']
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GUEST / NO-LOGIN TRENDING ───────────────────────────────
router.get('/trending', async (req, res) => {
  try {
    const trending = await Listing.find({ status: 'available' })
      .populate('seller', 'name college avgRating avatar')
      .sort('-viewCount -wishlistCount -createdAt')
      .limit(8);

    res.json({ success: true, trending });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════
// SMART PRICE SUGGESTION  (rule-based)
// ═══════════════════════════════════════════════════════════
// Logic:
//  1. Each category has an estimated "market base price"
//  2. Multiply by condition factor (depreciation)
//  3. For rent: a fixed daily fraction of sell price
// ═══════════════════════════════════════════════════════════

// POST /api/ai/suggest-price
router.post('/suggest-price', protect, async (req, res) => {
  try {
    const { category, condition, listingType } = req.body;

    if (!category || !condition || !listingType) {
      return res.status(400).json({ error: 'category, condition, and listingType are required.' });
    }

    // Estimated average sell prices (₹) by category
    const basePrice = {
      'Electronics':      3000,
      'Books & Notes':     250,
      'Lab Equipment':    1500,
      'Furniture':        2000,
      'Sports & Fitness':  800,
      'Clothing':          400,
      'Stationery':        150,
      'Other':             500
    };

    // Condition depreciation multipliers
    const conditionFactor = {
      'New':      1.00,
      'Like New': 0.85,
      'Good':     0.70,
      'Fair':     0.55,
      'Poor':     0.35
    };

    // Percentage of sell price charged per day for rent
    const rentDayFraction = {
      'Electronics':      0.025,
      'Books & Notes':    0.020,
      'Lab Equipment':    0.030,
      'Furniture':        0.020,
      'Sports & Fitness': 0.030,
      'Clothing':         0.040,
      'Stationery':       0.020,
      'Other':            0.025
    };

    const base   = basePrice[category]       || 500;
    const factor = conditionFactor[condition] || 0.70;
    const frac   = rentDayFraction[category]  || 0.025;

    const suggestedSellPrice = Math.round(base * factor);
    const suggestedRentPrice = Math.round(suggestedSellPrice * frac);

    const priceRange = {
      sell: {
        low:  Math.round(suggestedSellPrice * 0.85),
        mid:  suggestedSellPrice,
        high: Math.round(suggestedSellPrice * 1.15)
      },
      rent: {
        low:  Math.round(suggestedRentPrice * 0.8),
        mid:  suggestedRentPrice,
        high: Math.round(suggestedRentPrice * 1.2)
      }
    };

    res.json({
      success: true,
      suggestion: {
        category,
        condition,
        listingType,
        suggestedSellPrice,
        suggestedRentPrice,
        priceRange,
        tip: getPricingTip(category, condition)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function getPricingTip(category, condition) {
  if (condition === 'Poor')          return 'Items in poor condition sell faster when priced 30-40% below market.';
  if (condition === 'New')           return 'New items can be priced close to or at market price.';
  if (category === 'Electronics')    return 'Electronics depreciate quickly — competitive pricing brings faster deals.';
  if (category === 'Books & Notes')  return 'Semester-start and semester-end are peak times for book sales.';
  return 'Setting a fair price increases your chance of a quick sale.';
}

// ═══════════════════════════════════════════════════════════
// AI ASSISTANT CHAT (rule-based helper)
// ═══════════════════════════════════════════════════════════
// POST /api/ai/assistant
// POST /api/ai/agent
// Body: { message: string }
const assistantHandler = async (req, res) => {
  try {
    const rawMessage = (req.body?.message || '').toString();
    const message = rawMessage.trim();

    if (!message) {
      return res.status(400).json({ error: 'message is required.' });
    }

    const text = message.toLowerCase();
    const category = detectCategory(text);
    const condition = detectCondition(text);
    const listingType = detectListingType(text);
    const maxPrice = detectMaxPrice(text);

    // Optional LLM path (uses OPENAI_API_KEY if configured)
    const llmResult = await askAssistantWithLLM({
      message,
      category,
      condition,
      listingType,
      maxPrice
    });

    if (llmResult) {
      const queryParams = llmResult.queryParams || {};
      const listings = llmResult.includeListings
        ? await fetchAssistantListings(queryParams)
        : [];

      return res.json({
        success: true,
        reply: llmResult.reply,
        suggestions: llmResult.suggestions,
        listings
      });
    }

    // Pricing help
    if (/(price|cost|how much|pricing|suggest)/i.test(text)) {
      if (category && condition) {
        const base = {
          'Electronics': 3000,
          'Books & Notes': 250,
          'Lab Equipment': 1500,
          'Furniture': 2000,
          'Sports & Fitness': 800,
          'Clothing': 400,
          'Stationery': 150,
          'Other': 500
        };
        const factor = {
          'New': 1.0,
          'Like New': 0.85,
          'Good': 0.7,
          'Fair': 0.55,
          'Poor': 0.35
        };

        const sell = Math.round((base[category] || 500) * (factor[condition] || 0.7));
        const rent = Math.max(5, Math.round(sell * 0.025));

        return res.json({
          success: true,
          reply: `For a ${condition} ${category} item, a good starting price is around ₹${sell} (sell) and ₹${rent}/day (rent). ${getPricingTip(category, condition)}`,
          suggestions: [
            { label: `Browse ${category}`, queryParams: { category } },
            { label: 'Create listing', route: '/add-listing' }
          ]
        });
      }

      return res.json({
        success: true,
        reply: 'I can suggest a better price if you include category and condition. Example: "Price for Good Electronics".',
        suggestions: [
          { label: 'Electronics', queryParams: { category: 'Electronics' } },
          { label: 'Books & Notes', queryParams: { category: 'Books & Notes' } }
        ]
      });
    }

    // Search / discovery help
    if (/(find|search|looking|need|want|show|recommend|suggest.*item|help me)/i.test(text)) {
      const filter = { status: 'available' };
      const queryParams = {};

      if (category) {
        filter.category = category;
        queryParams.category = category;
      }

      if (listingType) {
        filter.$or = [{ listingType }, { listingType: 'both' }];
        queryParams.listingType = listingType;
      }

      if (condition) {
        filter.condition = condition;
        queryParams.condition = condition;
      }

      if (maxPrice) {
        const priceField = listingType === 'rent' ? 'rentPrice' : 'sellPrice';
        filter[priceField] = { $lte: maxPrice };
        queryParams.maxPrice = maxPrice;
      }

      const listings = await Listing.find(filter)
        .populate('seller', 'name college avgRating avatar')
        .sort('-viewCount -createdAt')
        .limit(4);

      if (listings.length > 0) {
        return res.json({
          success: true,
          reply: `I found ${listings.length} relevant listing${listings.length > 1 ? 's' : ''}${category ? ` for ${category}` : ''}.`,
          listings,
          suggestions: [
            { label: 'View all results', queryParams },
            { label: 'Trending items', route: '/listings?sort=-viewCount' }
          ]
        });
      }

      return res.json({
        success: true,
        reply: 'No exact matches right now. Try broader filters or remove price/condition limits.',
        suggestions: [
          { label: 'Browse all listings', route: '/listings' },
          { label: 'Trending items', route: '/listings?sort=-viewCount' }
        ]
      });
    }

    // Default assistant response
    res.json({
      success: true,
      reply: 'I can help you find listings, suggest prices, and guide buy/rent choices. Try: "Find Good electronics under 3000" or "Price for Like New books".',
      suggestions: [
        { label: 'Find electronics', queryParams: { category: 'Electronics' } },
        { label: 'Find books', queryParams: { category: 'Books & Notes' } },
        { label: 'Suggest my price', route: '/add-listing' }
      ]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

router.post('/assistant', assistantHandler);
router.post('/agent', assistantHandler);

function detectCategory(text) {
  const normalized = text.toLowerCase();
  return CATEGORIES.find(cat => normalized.includes(cat.toLowerCase())) || null;
}

function detectCondition(text) {
  const normalized = text.toLowerCase();
  return CONDITIONS.find(cond => normalized.includes(cond.toLowerCase())) || null;
}

function detectListingType(text) {
  if (/(rent|rental|borrow)/i.test(text)) return 'rent';
  if (/(buy|purchase|sell|sale)/i.test(text)) return 'sell';
  return null;
}

function detectMaxPrice(text) {
  const underMatch = text.match(/under\s*₹?\s*(\d{2,6})/i) || text.match(/below\s*₹?\s*(\d{2,6})/i);
  if (underMatch) return Number(underMatch[1]);

  const uptoMatch = text.match(/up to\s*₹?\s*(\d{2,6})/i);
  if (uptoMatch) return Number(uptoMatch[1]);

  return null;
}

async function askAssistantWithLLM({ message, category, condition, listingType, maxPrice }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const systemPrompt = `You are UniLend AI assistant for a college marketplace.
Respond ONLY in minified JSON with this exact shape:
{"reply":"string","includeListings":boolean,"queryParams":{"category":"optional string","condition":"optional string","listingType":"optional string","maxPrice":optional number},"suggestions":[{"label":"string","route":"optional string","queryParams":optional object}]}

Rules:
- Keep reply short, practical, friendly.
- Use INR (₹) if mentioning price.
- queryParams keys allowed only: category, condition, listingType, maxPrice.
- listingType only: sell or rent.
- suggestions max 3.
- If user asks to find/search/recommend items, includeListings=true.
- If request is general guidance only, includeListings=false.
- Never include markdown/code fences.`;

  const userPrompt = JSON.stringify({
    message,
    inferred: { category, condition, listingType, maxPrice },
    allowedCategories: CATEGORIES,
    allowedConditions: CONDITIONS
  });

  try {
    const payload = {
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.2,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    };

    const data = await openAIChatRequest(payload, apiKey);
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);
    const cleaned = sanitizeLLMResponse(parsed);
    return cleaned;
  } catch {
    return null;
  }
}

function sanitizeLLMResponse(parsed) {
  const safe = {
    reply: typeof parsed?.reply === 'string' && parsed.reply.trim()
      ? parsed.reply.trim()
      : 'I can help with finding listings, pricing, and buy/rent decisions.',
    includeListings: Boolean(parsed?.includeListings),
    queryParams: {},
    suggestions: []
  };

  const qp = parsed?.queryParams || {};
  if (typeof qp.category === 'string' && CATEGORIES.includes(qp.category)) safe.queryParams.category = qp.category;
  if (typeof qp.condition === 'string' && CONDITIONS.includes(qp.condition)) safe.queryParams.condition = qp.condition;
  if (typeof qp.listingType === 'string' && ['sell', 'rent'].includes(qp.listingType)) safe.queryParams.listingType = qp.listingType;
  if (Number.isFinite(Number(qp.maxPrice)) && Number(qp.maxPrice) > 0) safe.queryParams.maxPrice = Number(qp.maxPrice);

  const suggestions = Array.isArray(parsed?.suggestions) ? parsed.suggestions.slice(0, 3) : [];
  safe.suggestions = suggestions
    .map(s => ({
      label: typeof s?.label === 'string' ? s.label.trim().slice(0, 50) : '',
      route: typeof s?.route === 'string' ? s.route : undefined,
      queryParams: s?.queryParams && typeof s.queryParams === 'object' ? s.queryParams : undefined
    }))
    .filter(s => s.label);

  return safe;
}

async function fetchAssistantListings(queryParams = {}) {
  const filter = { status: 'available' };
  const category = queryParams.category;
  const condition = queryParams.condition;
  const listingType = queryParams.listingType;
  const maxPrice = queryParams.maxPrice;

  if (category) filter.category = category;
  if (condition) filter.condition = condition;
  if (listingType) filter.$or = [{ listingType }, { listingType: 'both' }];
  if (maxPrice) {
    const priceField = listingType === 'rent' ? 'rentPrice' : 'sellPrice';
    filter[priceField] = { $lte: Number(maxPrice) };
  }

  return Listing.find(filter)
    .populate('seller', 'name college avgRating avatar')
    .sort('-viewCount -createdAt')
    .limit(4);
}

function openAIChatRequest(payload, apiKey) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);

    const req = https.request(
      {
        hostname: 'api.openai.com',
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'Content-Length': Buffer.byteLength(body)
        }
      },
      (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(parsed);
            } else {
              reject(new Error(parsed?.error?.message || 'OpenAI request failed'));
            }
          } catch (e) {
            reject(e);
          }
        });
      }
    );

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

module.exports = router;
