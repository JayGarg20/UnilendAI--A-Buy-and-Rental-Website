# 🎓 UniLend AI — Campus Buy & Rental Platform

A full-stack MERN web application for college students to buy, sell, and rent items within their campus community. Includes JWT authentication, AI-powered price suggestions, and category-based recommendations.

---

## 🗂️ Project Structure

```
unilend-ai/
├── backend/                  ← Node.js + Express API
│   ├── config/
│   │   └── db.js             ← MongoDB connection
│   ├── middleware/
│   │   └── authMiddleware.js ← JWT auth middleware
│   ├── models/
│   │   ├── User.js           ← User schema
│   │   ├── Listing.js        ← Listing schema
│   │   └── Order.js          ← Order schema
│   ├── routes/
│   │   ├── auth.js           ← Register / Login / Me
│   │   ├── listings.js       ← CRUD listings + search
│   │   ├── orders.js         ← Create / track orders
│   │   ├── users.js          ← Profile management
│   │   └── ai.js             ← Recommendations + price AI
│   ├── uploads/              ← Saved item images (auto-created)
│   ├── server.js             ← Express app entry point
│   ├── .env.example          ← Environment variable template
│   └── package.json
│
└── frontend/                 ← React.js app
    └── src/
        ├── context/
        │   └── AuthContext.js    ← Global auth state
        ├── utils/
        │   └── api.js            ← Axios API helpers
        ├── components/
        │   ├── Navbar.js
        │   ├── Footer.js
        │   └── ListingCard.js
        ├── pages/
        │   ├── HomePage.js       ← Hero + categories + AI recs
        │   ├── LoginPage.js
        │   ├── RegisterPage.js   ← 2-step registration
        │   ├── ListingsPage.js   ← Browse + filter + search
        │   ├── ListingDetail.js  ← Full view + order modal
        │   ├── AddListing.js     ← Create with AI price suggest
        │   ├── EditListing.js
        │   ├── ProfilePage.js    ← Profile + edit + password
        │   ├── MyListings.js
        │   ├── MyOrders.js       ← Buying + selling tabs
        │   └── WishlistPage.js
        ├── App.js                ← Routes
        ├── index.js
        └── index.css             ← Custom theme (Syne + DM Sans)
```

---

## ⚙️ Setup Instructions

### 1. Prerequisites
- Node.js v18+
- MongoDB (local) or MongoDB Atlas (free cloud)
- Git

---

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env → set MONGO_URI and JWT_SECRET
npm install
npm run dev
```

Your API runs at: `http://localhost:5000`

**.env values:**
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/unilend_ai
JWT_SECRET=your_strong_random_secret_here
JWT_EXPIRE=7d
NODE_ENV=development
```

---

### 3. Frontend Setup

```bash
cd frontend
cp .env.example .env
# For local dev, leave REACT_APP_API_URL empty (proxy handles it)
npm install
npm start
```

Your app runs at: `http://localhost:3000`

---

## 🧠 AI Features (Rule-Based Logic)

### 1. Smart Price Suggestion
**Endpoint:** `POST /api/ai/suggest-price`

Logic:
- Each category has a base market price estimate
- Multiplied by a condition depreciation factor (New=1.0, Poor=0.35)
- For rent: a fixed daily fraction of the sell price
- Returns low / mid / high price range + a pricing tip

### 2. Personalized Recommendations
**Endpoint:** `GET /api/ai/recommendations`

Logic:
- Tracks which categories a user has viewed (`viewedCategories` array in User model)
- Finds top 3 most-viewed categories
- Returns popular listings in those categories
- Also returns trending (by viewCount + wishlistCount) and same-college listings

No external ML libraries used — pure JavaScript logic.

---

## 🔐 Authentication

- JWT tokens (stored in localStorage)
- Protected routes on both frontend and backend
- Password hashing with bcryptjs (salt rounds: 10)
- Token expiry: 7 days (configurable)

---

## 📋 Features

| Feature | Status |
|---|---|
| User Registration (2-step) | ✅ |
| Login / Logout | ✅ |
| Browse Listings | ✅ |
| Search + Filters | ✅ |
| Create / Edit / Delete Listing | ✅ |
| Image Upload (local) | ✅ |
| Buy / Rent with Order Modal | ✅ |
| Order Tracking (pending→completed) | ✅ |
| Seller Rating System | ✅ |
| Wishlist | ✅ |
| User Profile + Edit | ✅ |
| Change Password | ✅ |
| AI Price Suggestion | ✅ |
| AI Recommendations | ✅ |
| Trending Listings | ✅ |
| Mobile Responsive | ✅ |

---

## 🚀 Deployment

### Backend → Render (Free)
1. Push code to GitHub
2. Create account on [render.com](https://render.com)
3. New Web Service → connect GitHub repo
4. Build command: `cd backend && npm install`
5. Start command: `cd backend && node server.js`
6. Add environment variables: `MONGO_URI`, `JWT_SECRET`

### Frontend → Firebase Hosting (Free)
```bash
npm install -g firebase-tools
firebase login
firebase init hosting   # build dir: build
cd frontend && npm run build
firebase deploy
```

Set `REACT_APP_API_URL=https://your-render-url.onrender.com/api` in frontend `.env` before building.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js, Bootstrap 5, React Router v6 |
| Styling | Bootstrap + Custom CSS (Syne + DM Sans fonts) |
| State | React Context API |
| HTTP | Axios |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| File Upload | Multer (local disk) |
| AI | Custom rule-based logic (no ML libs) |
| Notifications | React Toastify |

---

## 📞 API Endpoints

### Auth
| Method | Route | Description |
|---|---|---|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |

### Listings
| Method | Route | Description |
|---|---|---|
| GET | /api/listings | All listings (search/filter) |
| GET | /api/listings/:id | Single listing |
| POST | /api/listings | Create listing (auth) |
| PUT | /api/listings/:id | Update listing (auth) |
| DELETE | /api/listings/:id | Delete listing (auth) |
| POST | /api/listings/:id/wishlist | Toggle wishlist (auth) |
| GET | /api/listings/user/my-listings | My listings (auth) |

### Orders
| Method | Route | Description |
|---|---|---|
| POST | /api/orders | Create order (auth) |
| GET | /api/orders/my-orders | My purchases (auth) |
| GET | /api/orders/my-sales | My sales (auth) |
| PATCH | /api/orders/:id/status | Update status (auth) |
| POST | /api/orders/:id/rate | Rate order (auth) |

### AI
| Method | Route | Description |
|---|---|---|
| GET | /api/ai/recommendations | Personalised recs (auth) |
| GET | /api/ai/trending | Trending listings |
| POST | /api/ai/suggest-price | Price suggestion (auth) |

---

*Built as a college-level full-stack project — UniLend AI*
