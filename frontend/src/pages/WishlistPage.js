// src/pages/WishlistPage.js
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getMe, toggleWishlist } from '../utils/api';
import ListingCard from '../components/ListingCard';

const WishlistPage = () => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getMe();
        setWishlist(data.user.wishlist || []);
      } catch { toast.error('Could not load wishlist'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const handleRemove = async (listingId) => {
    try {
      await toggleWishlist(listingId);
      setWishlist(prev => prev.filter(l => (l._id || l).toString() !== listingId.toString()));
      toast.success('Removed from wishlist');
    } catch { toast.error('Failed'); }
  };

  const items = wishlist.filter(l => typeof l === 'object' && l._id);

  return (
    <div className="container" style={{ padding: '32px 12px' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.8rem', marginBottom: 4 }}>
            My Wishlist
          </h1>
          <p style={{ color: '#64748b', margin: 0 }}>{items.length} saved item{items.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {loading ? (
        <div className="loading-screen"><div className="spinner-border text-primary" /></div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
          <i className="bi bi-heart fs-1 d-block mb-3" />
          <h5 style={{ fontFamily: 'Syne, sans-serif' }}>Your wishlist is empty</h5>
          <p>Browse listings and click the heart icon to save items.</p>
          <Link to="/listings" className="btn btn-primary px-4" style={{ borderRadius: 8 }}>Browse Listings</Link>
        </div>
      ) : (
        <div className="row g-3">
          {items.map(listing => (
            <div key={listing._id} className="col-sm-6 col-md-4 col-lg-3">
              <ListingCard
                listing={listing}
                onWishlistChange={(id, wishlisted) => {
                  if (!wishlisted) setWishlist(prev => prev.filter(l => l._id !== id));
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WishlistPage;
