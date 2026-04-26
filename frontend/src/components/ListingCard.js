// src/components/ListingCard.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toggleWishlist } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const PLACEHOLDER = 'https://via.placeholder.com/400x200?text=No+Image';

const ListingCard = ({ listing, onWishlistChange, showAiBadge }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    const wishlisted = user?.wishlist?.some(
      (id) => (id._id || id).toString() === listing._id.toString()
    ) || false;
    setIsWishlisted(wishlisted);
  }, [user, listing._id]);

  const handleWishlist = async (e) => {
    e.stopPropagation();
    if (!user) { navigate('/login'); return; }
    try {
      const { data } = await toggleWishlist(listing._id);
      setIsWishlisted(data.wishlisted);
      toast.success(data.wishlisted ? 'Added to wishlist!' : 'Removed from wishlist');
      onWishlistChange && onWishlistChange(listing._id, data.wishlisted);
    } catch {
      toast.error('Failed to update wishlist');
    }
  };

  const imageUrl = listing.images?.[0]
    ? `${process.env.REACT_APP_API_URL?.replace('/api','') || ''}/uploads/${listing.images[0]}`
    : PLACEHOLDER;

  const typeClass = { sell: 'badge-sell', rent: 'badge-rent', both: 'badge-both' }[listing.listingType] || 'badge-sell';
  const typeLabel = { sell: 'For Sale', rent: 'For Rent', both: 'Sale / Rent' }[listing.listingType] || 'For Sale';

  const condClass = {
    'New': 'badge-new', 'Like New': 'badge-like-new',
    'Good': 'badge-good', 'Fair': 'badge-fair', 'Poor': 'badge-poor'
  }[listing.condition] || 'badge-good';

  return (
    <div className="listing-card h-100" onClick={() => navigate(`/listings/${listing._id}`)}>
      {/* Image */}
      <div className="card-img-wrap position-relative">
        <img src={imageUrl} alt={listing.title} />

        {/* Wishlist button */}
        <button
          onClick={handleWishlist}
          style={{
            position: 'absolute', top: 10, right: 10,
            background: isWishlisted ? '#ef4444' : 'rgba(255,255,255,0.92)',
            border: isWishlisted ? '1px solid #dc2626' : 'none', borderRadius: '50%',
            width: 34, height: 34, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          <i className={`bi ${isWishlisted ? 'bi-heart-fill' : 'bi-heart'}`} style={{ fontSize: '0.9rem', color: isWishlisted ? '#fff' : '#334155' }} />
        </button>

        {/* Type badge */}
        <span className={`badge-type ${typeClass} position-absolute`} style={{ bottom: 10, left: 10 }}>
          {typeLabel}
        </span>

        {showAiBadge && (
          <span className="ai-badge position-absolute" style={{ top: 10, left: 10 }}>
            ✦ Recommended
          </span>
        )}
      </div>

      {/* Body */}
      <div className="card-body-custom">
        <div className="d-flex align-items-center gap-2 mb-1">
          <span className="badge-category">{listing.category}</span>
          <span className={`badge-type ${condClass}`} style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 20 }}>
            {listing.condition}
          </span>
        </div>

        <h6 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.95rem', marginBottom: 6, lineHeight: 1.3 }}>
          {listing.title.length > 55 ? listing.title.slice(0, 55) + '…' : listing.title}
        </h6>

        {/* Price */}
        <div className="d-flex align-items-center gap-2 mb-2">
          {(listing.listingType === 'sell' || listing.listingType === 'both') && listing.sellPrice > 0 && (
            <span className="price-tag">₹{listing.sellPrice.toLocaleString()}</span>
          )}
          {(listing.listingType === 'rent' || listing.listingType === 'both') && listing.rentPrice > 0 && (
            <span style={{ fontSize: '0.88rem', color: '#a16207', fontWeight: 600 }}>
              ₹{listing.rentPrice}/day
            </span>
          )}
        </div>

        {/* Seller info */}
        <div className="d-flex align-items-center justify-content-between">
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
            <i className="bi bi-person-circle me-1" />
            {listing.seller?.name || 'Unknown'}
          </div>
        </div>

        <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 4 }}>
          <i className="bi bi-geo-alt me-1" />{listing.college}
        </div>
      </div>
    </div>
  );
};

export default ListingCard;
