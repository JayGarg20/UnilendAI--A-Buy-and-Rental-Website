// src/pages/MyListings.js
import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getMyListings, deleteListing } from '../utils/api';

const MyListings = () => {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getMyListings();
        setListings(data.listings);
      } catch { toast.error('Could not load listings'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this listing?')) return;
    try {
      await deleteListing(id);
      setListings(prev => prev.filter(l => l._id !== id));
      toast.success('Listing removed');
    } catch { toast.error('Failed to remove listing'); }
  };

  const PLACEHOLDER = 'https://via.placeholder.com/80x80?text=No+Img';

  const statusColor = { available: '#16a34a', sold: '#2563eb', rented: '#f59e0b', inactive: '#94a3b8' };
  const statusLabel = { available: 'Available', sold: 'Sold', rented: 'Rented', inactive: 'Inactive' };

  return (
    <div className="container" style={{ padding: '32px 12px', maxWidth: 900 }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.8rem', marginBottom: 4 }}>My Listings</h1>
          <p style={{ color: 'var(--muted)', margin: 0 }}>{listings.length} total listing{listings.length !== 1 ? 's' : ''}</p>
        </div>
        <Link to="/add-listing" className="btn btn-primary fw-bold px-4 py-2" style={{ borderRadius: 8 }}>
          <i className="bi bi-plus-lg me-2" />New Listing
        </Link>
      </div>

      {loading ? (
        <div className="loading-screen"><div className="spinner-border text-primary" /></div>
      ) : listings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
          <i className="bi bi-box-open fs-1 d-block mb-3" />
          <h5 style={{ fontFamily: 'Syne, sans-serif' }}>No listings yet</h5>
          <p>Start by creating your first listing.</p>
          <Link to="/add-listing" className="btn btn-primary px-4" style={{ borderRadius: 8 }}>Create Listing</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {listings.map(l => (
            <div key={l._id} style={{
              background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12,
              padding: '16px', display: 'flex', gap: 16, alignItems: 'flex-start'
            }}>
              {/* Thumbnail */}
              <img
                src={l.images?.[0] ? `${process.env.REACT_APP_API_URL?.replace('/api','') || ''}/uploads/${l.images[0]}` : PLACEHOLDER}
                alt={l.title}
                style={{ width: 80, height: 80, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
                onError={e => e.target.src = PLACEHOLDER}
              />

              {/* Details */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="d-flex justify-content-between align-items-start gap-2">
                  <div>
                    <h6 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: 4, fontSize: '0.95rem' }}>
                      <Link to={`/listings/${l._id}`} style={{ color: 'var(--dark)', textDecoration: 'none' }}>
                        {l.title}
                      </Link>
                    </h6>
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: 4 }}>
                      {l.category} · {l.condition}
                    </div>
                  </div>
                  <span style={{
                    background: statusColor[l.status] + '20',
                    color: statusColor[l.status],
                    borderRadius: 20, padding: '3px 12px',
                    fontSize: '0.78rem', fontWeight: 600, flexShrink: 0
                  }}>
                    {statusLabel[l.status]}
                  </span>
                </div>

                <div className="d-flex gap-3 flex-wrap align-items-center mt-1">
                  {l.sellPrice > 0 && (
                    <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: '#2563eb', fontSize: '0.95rem' }}>
                      ₹{l.sellPrice.toLocaleString()}
                    </span>
                  )}
                  {l.rentPrice > 0 && (
                    <span style={{ fontSize: '0.85rem', color: '#a16207', fontWeight: 600 }}>
                      ₹{l.rentPrice}/day
                    </span>
                  )}
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                    <i className="bi bi-heart me-1" />{l.wishlistCount}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                    {new Date(l.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="d-flex flex-column gap-2 flex-shrink-0">
                <button onClick={() => navigate(`/edit-listing/${l._id}`)}
                  className="btn btn-outline-primary btn-sm fw-semibold" style={{ borderRadius: 7, fontSize: '0.82rem' }}>
                  <i className="bi bi-pencil me-1" />Edit
                </button>
                <button onClick={() => handleDelete(l._id)}
                  className="btn btn-outline-danger btn-sm fw-semibold" style={{ borderRadius: 7, fontSize: '0.82rem' }}>
                  <i className="bi bi-trash me-1" />Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyListings;
