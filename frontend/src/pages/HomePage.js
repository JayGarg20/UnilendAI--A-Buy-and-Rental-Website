// src/pages/HomePage.js
import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getRecommendations, getTrending } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import ListingCard from '../components/ListingCard';

const CATEGORIES = [
  { label: 'Books & Notes',   icon: 'bi-book',           color: '#dbeafe' },
  { label: 'Electronics',     icon: 'bi-laptop',         color: '#dcfce7' },
  { label: 'Stationery',      icon: 'bi-pencil',         color: '#fef9c3' },
  { label: 'Lab Equipment',   icon: 'bi-eyedropper',     color: '#f3e8ff' },
  { label: 'Clothing',        icon: 'bi-bag',            color: '#ffe4e6' },
  { label: 'Sports & Fitness',icon: 'bi-bicycle',        color: '#ffedd5' },
  { label: 'Furniture',       icon: 'bi-house',          color: '#d1fae5' },
  { label: 'Other',           icon: 'bi-grid',           color: '#e0f2fe' },
];

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQ, setSearchQ] = useState('');
  const [trending, setTrending] = useState([]);
  const [recs, setRecs] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        if (user) {
          const { data } = await getRecommendations();
          setRecs(data.recommendations);
          setTrending(data.recommendations.trending || []);
        } else {
          const { data } = await getTrending();
          setTrending(data.trending || []);
        }
      } catch { /* silently ignore */ }
      finally { setLoading(false); }
    };
    load();
  }, [user]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQ.trim()) navigate(`/listings?search=${encodeURIComponent(searchQ.trim())}`);
  };

  return (
    <>
      {/* ── Hero ────────────────────────────────── */}
      <section className="hero-section">
        <div className="container text-center position-relative">
          <span style={{
            background: 'rgba(255,255,255,0.15)',
            color: '#fff', borderRadius: 20, padding: '4px 16px',
            fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.08em',
            display: 'inline-block', marginBottom: 16
          }}>
            ✦ AI-POWERED CAMPUS MARKETPLACE
          </span>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 800, lineHeight: 1.15, marginBottom: 16 }}>
            Buy, Rent & Sell<br />Within Your Campus
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: 0.85, maxWidth: 520, margin: '0 auto' }}>
            Connect with seniors, find affordable items, and earn from what you no longer need — all within your college community.
          </p>

          {/* Search */}
          <form onSubmit={handleSearch} className="hero-search-box">
            <i className="bi bi-search me-2" style={{ opacity: 0.7 }} />
            <input
              type="text"
              placeholder="Search books, electronics, furniture..."
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
            />
            <button type="submit">Search</button>
          </form>

          {/* Quick stats */}
          <div className="d-flex justify-content-center gap-4 mt-4 flex-wrap" style={{ opacity: 0.85 }}>
            {[['10K+','Students'], ['5K+','Listings'], ['₹0','Commission']].map(([num, label]) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'Syne, sans-serif' }}>{num}</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ──────────────────────────── */}
      <section style={{ padding: '52px 0 40px' }}>
        <div className="container">
          <div className="d-flex justify-content-between align-items-end mb-4">
            <div>
              <h2 className="section-title mb-1">Browse Categories</h2>
              <p className="section-subtitle mb-0">Find exactly what you need</p>
            </div>
            <Link to="/listings" className="btn btn-outline-primary btn-sm">View All</Link>
          </div>
          <div className="row g-3">
            {CATEGORIES.map(cat => (
              <div key={cat.label} className="col-6 col-sm-4 col-md-3">
                <div
                  onClick={() => navigate(`/listings?category=${encodeURIComponent(cat.label)}`)}
                  style={{
                    background: cat.color, borderRadius: 14, padding: '20px 16px',
                    textAlign: 'center', cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    border: '1px solid transparent'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <i className={`bi ${cat.icon}`} style={{ fontSize: '1.8rem', color: '#1e293b', marginBottom: 8, display: 'block' }} />
                  <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>
                    {cat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI Personalised Recommendations ─────── */}
      {user && recs && (
        <>
          {recs.sameCollege?.length > 0 && (
            <section style={{ padding: '0 0 48px' }}>
              <div className="container">
                <div className="d-flex align-items-center gap-3 mb-2">
                  <h2 className="section-title mb-0">Near You — {user.college}</h2>
                  <span className="ai-badge">AI Picks</span>
                </div>
                <p className="section-subtitle">Items listed by students in your college</p>
                <div className="row g-3">
                  {recs.sameCollege.slice(0, 4).map(listing => (
                    <div key={listing._id} className="col-sm-6 col-md-4 col-lg-3">
                      <ListingCard listing={listing} showAiBadge />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {recs.personalised?.length > 0 && (
            <section style={{ padding: '0 0 48px' }}>
              <div className="container">
                <div className="d-flex align-items-center gap-3 mb-2">
                  <h2 className="section-title mb-0">Recommended for You</h2>
                  <span className="ai-badge">AI Picks</span>
                </div>
                <p className="section-subtitle">
                  Based on your interest in: {recs.basedOn?.join(', ')}
                </p>
                <div className="row g-3">
                  {recs.personalised.slice(0, 4).map(listing => (
                    <div key={listing._id} className="col-sm-6 col-md-4 col-lg-3">
                      <ListingCard listing={listing} showAiBadge />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {/* ── Trending ─────────────────────────────── */}
      <section style={{ padding: '0 0 56px' }}>
        <div className="container">
          <div className="d-flex justify-content-between align-items-end mb-4">
            <div>
              <h2 className="section-title mb-1">Trending Now</h2>
              <p className="section-subtitle mb-0">Popular items on the platform</p>
            </div>
            <Link to="/listings" className="btn btn-outline-primary btn-sm">See All</Link>
          </div>

          {loading ? (
            <div className="loading-screen"><div className="spinner-border text-primary" /></div>
          ) : trending.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-box-open fs-1 d-block mb-2" />
              No listings yet. <Link to="/add-listing">Be the first to list!</Link>
            </div>
          ) : (
            <div className="row g-3">
              {trending.map(listing => (
                <div key={listing._id} className="col-sm-6 col-md-4 col-lg-3">
                  <ListingCard listing={listing} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────── */}
      {!user && (
        <section style={{ background: '#1d4ed8', padding: '52px 0', color: '#fff', textAlign: 'center' }}>
          <div className="container">
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, marginBottom: 12, fontSize: '2rem' }}>
              Ready to Join?
            </h2>
            <p style={{ opacity: 0.85, marginBottom: 24, maxWidth: 480, margin: '0 auto 24px' }}>
              Register with your college email and start buying, renting, or selling today.
            </p>
            <div className="d-flex gap-3 justify-content-center">
              <Link to="/register" className="btn btn-light px-4 py-2 fw-bold" style={{ borderRadius: 8, color: '#1d4ed8' }}>
                Create Account
              </Link>
              <Link to="/listings" className="btn btn-outline-light px-4 py-2 fw-semibold" style={{ borderRadius: 8 }}>
                Browse First
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  );
};

export default HomePage;
