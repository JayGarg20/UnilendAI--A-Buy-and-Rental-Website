// src/pages/ListingDetail.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getListing, createOrder, toggleWishlist, trackCategory, deleteListing, getListingOrders, updateOrderStatus } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const PLACEHOLDER = 'https://via.placeholder.com/600x400?text=No+Image';

const ListingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [orderType, setOrderType] = useState('buy');
  const [rentDays, setRentDays] = useState(1);
  const [payMethod, setPayMethod] = useState('cash');
  const [meetupNote, setMeetupNote] = useState('');
  const [ordering, setOrdering] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [listingOrders, setListingOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getListing(id);
        setListing(data.listing);
        const wishlisted = user?.wishlist?.some((item) => (item._id || item).toString() === id.toString()) || false;
        setIsWishlisted(wishlisted);
        setOrderType(data.listing.listingType === 'rent' ? 'rent' : 'buy');
        // Track category for AI recommendations
        if (user) trackCategory(data.listing.category).catch(() => {});
      } catch {
        toast.error('Listing not found');
        navigate('/listings');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, user, navigate]);

  useEffect(() => {
    const loadListingOrders = async () => {
      if (!user || !listing || user._id !== listing.seller?._id) return;
      setOrdersLoading(true);
      try {
        const { data } = await getListingOrders(listing._id);
        setListingOrders(data.orders || []);
      } catch {
        // ignore seller-orders panel failure
      } finally {
        setOrdersLoading(false);
      }
    };

    loadListingOrders();
  }, [listing, user]);

  const handleWishlist = async () => {
    if (!user) { navigate('/login'); return; }
    try {
      const { data } = await toggleWishlist(id);
      setIsWishlisted(data.wishlisted);
      toast.success(data.wishlisted ? 'Added to wishlist!' : 'Removed from wishlist');
    } catch { toast.error('Failed to update wishlist'); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to remove this listing?')) return;
    try {
      await deleteListing(id);
      toast.success('Listing removed successfully');
      navigate('/my-listings');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to remove listing');
    }
  };

  const handleSellerOrderAction = async (orderId, status) => {
    try {
      const { data } = await updateOrderStatus(orderId, status);
      setListingOrders(prev => prev.map(o => o._id === orderId ? { ...o, ...data.order, status } : o));
      toast.success(data?.message || `Order ${status}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update order');
    }
  };

  const handleOrder = async () => {
    if (!user) { navigate('/login'); return; }
    setOrdering(true);
    try {
      await createOrder({ listingId: id, orderType, rentDays, paymentMethod: payMethod, meetupNote });
      toast.success('Order placed successfully! Contact the seller to arrange handover.');
      setShowModal(false);
      navigate('/my-orders');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Order failed');
    } finally {
      setOrdering(false);
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner-border text-primary" /></div>;
  if (!listing) return null;

  const images = listing.images?.length
    ? listing.images.map(f => `${process.env.REACT_APP_API_URL?.replace('/api','') || ''}/uploads/${f}`)
    : [PLACEHOLDER];

  const isOwner = user?._id === listing.seller?._id;
  const isAvailable = listing.status === 'available';
  const totalRent = listing.rentPrice * rentDays;

  const condBadge = {
    'New':'badge-new','Like New':'badge-like-new','Good':'badge-good','Fair':'badge-fair','Poor':'badge-poor'
  }[listing.condition] || 'badge-good';
  const pendingCount = listingOrders.filter(o => o.status === 'pending').length;

  return (
    <div className="container" style={{ padding: '32px 12px' }}>
      <nav style={{ fontSize: '0.85rem', marginBottom: 20, color: 'var(--muted)' }}>
        <Link to="/" style={{ color: 'var(--muted)', textDecoration: 'none' }}>Home</Link>
        {' / '}
        <Link to="/listings" style={{ color: 'var(--muted)', textDecoration: 'none' }}>Listings</Link>
        {' / '}
        <span style={{ color: 'var(--dark)' }}>{listing.title}</span>
      </nav>

      <div className="row g-4">
        {/* ── Images ──────────────────────────────── */}
        <div className="col-lg-7">
          <div style={{ background: 'var(--light-bg)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', marginBottom: 10, aspectRatio: '4/3' }}>
            <img
              src={images[activeImg]}
              alt={listing.title}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onError={e => e.target.src = PLACEHOLDER}
            />
          </div>
          {images.length > 1 && (
            <div className="d-flex gap-2 flex-wrap">
              {images.map((img, i) => (
                <div
                  key={i}
                  onClick={() => setActiveImg(i)}
                  style={{
                    width: 72, height: 72, borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
                    border: `2px solid ${activeImg === i ? '#2563eb' : 'var(--border)'}`
                  }}
                >
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => e.target.src = PLACEHOLDER} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Info + Order ─────────────────────────── */}
        <div className="col-lg-5">
          <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
            <div>
              <div className="d-flex gap-2 mb-2 flex-wrap">
                <span className="badge-category" style={{
                  background: '#eff6ff', color: '#2563eb', borderRadius: 20,
                  padding: '4px 12px', fontSize: '0.78rem', fontWeight: 600
                }}>{listing.category}</span>
                <span className={`badge-type ${condBadge}`} style={{ borderRadius: 20, padding: '4px 12px', fontSize: '0.78rem', fontWeight: 600 }}>
                  {listing.condition}
                </span>
                <span className={`badge-type ${listing.status !== 'available' ? 'badge-poor' : 'badge-new'}`}
                  style={{ borderRadius: 20, padding: '4px 12px', fontSize: '0.78rem', fontWeight: 600 }}>
                  {listing.status === 'available' ? 'Available' : listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                </span>
              </div>
              <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.6rem', lineHeight: 1.2, marginBottom: 12 }}>
                {listing.title}
              </h1>
            </div>
            <button onClick={handleWishlist} style={{
              background: isWishlisted ? '#ef4444' : 'var(--card-bg)',
              border: isWishlisted ? '1px solid #dc2626' : '1px solid var(--border)', borderRadius: '50%',
              width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0
            }}>
              <i className={`bi ${isWishlisted ? 'bi-heart-fill' : 'bi-heart'}`} style={{ fontSize: '1.1rem', color: isWishlisted ? '#fff' : '#dc2626' }} />
            </button>
          </div>

          {/* Price */}
          <div className="d-flex gap-3 align-items-center mb-4">
            {(listing.listingType === 'sell' || listing.listingType === 'both') && (
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 500 }}>Buy Price</div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.8rem', color: '#2563eb' }}>
                  ₹{listing.sellPrice?.toLocaleString()}
                </div>
              </div>
            )}
            {(listing.listingType === 'rent' || listing.listingType === 'both') && (
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 500 }}>Rent / Day</div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.8rem', color: '#a16207' }}>
                  ₹{listing.rentPrice?.toLocaleString()}
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div style={{ marginBottom: 20 }}>
            <h6 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: 8 }}>Description</h6>
            <p style={{ color: 'var(--muted)', fontSize: '0.92rem', lineHeight: 1.7 }}>{listing.description}</p>
          </div>

          {/* Stats */}
          <div className="d-flex gap-3 mb-4" style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
            <span><i className="bi bi-heart me-1" />{listing.wishlistCount} wishlisted</span>
            <span><i className="bi bi-clock me-1" />{new Date(listing.createdAt).toLocaleDateString()}</span>
          </div>

          {/* Action buttons */}
          {isOwner ? (
            <div className="d-flex gap-2">
              <button onClick={() => navigate(`/edit-listing/${listing._id}`)} className="btn btn-primary flex-fill fw-bold" style={{ borderRadius: 8 }}>
                <i className="bi bi-pencil me-2" />Edit Listing
              </button>
              <button onClick={handleDelete} className="btn btn-outline-danger fw-bold" style={{ borderRadius: 8 }}>
                <i className="bi bi-trash me-2" />Remove
              </button>
            </div>
          ) : isAvailable ? (
            <button
              onClick={() => setShowModal(true)}
              className="btn btn-primary w-100 py-2 fw-bold"
              style={{ borderRadius: 8, fontSize: '1rem' }}
            >
              <i className="bi bi-bag-check me-2" />
              {listing.listingType === 'rent' ? 'Rent Now' : listing.listingType === 'sell' ? 'Buy Now' : 'Buy / Rent'}
            </button>
          ) : (
            <button disabled className="btn btn-secondary w-100 py-2 fw-bold" style={{ borderRadius: 8 }}>
              Not Available
            </button>
          )}

          {/* Seller card */}
          <div style={{
            background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12,
            padding: '16px', marginTop: 16
          }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
              Listed by
            </div>
            <div className="d-flex align-items-center gap-3">
              <div style={{
                width: 44, height: 44, borderRadius: '50%', background: '#2563eb',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '1rem', flexShrink: 0
              }}>
                {listing.seller?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <Link to={`/profile/${listing.seller?._id}`} style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--dark)', textDecoration: 'none' }}>
                  {listing.seller?.name}
                </Link>
                <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{listing.seller?.college}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{listing.seller?.studentYear}</div>
                {listing.seller?.avgRating > 0 && (
                  <div style={{ fontSize: '0.8rem', color: '#f59e0b', marginTop: 2 }}>
                    {'★'.repeat(Math.round(listing.seller.avgRating))} ({listing.seller.totalRatings} ratings)
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Seller order approvals */}
          {isOwner && (
            <div style={{
              background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12,
              padding: '16px', marginTop: 16
            }}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, margin: 0 }}>Incoming Order Requests</h6>
                <span className="badge bg-warning text-dark" style={{ borderRadius: 20, padding: '4px 10px' }}>
                  {pendingCount} Pending
                </span>
              </div>

              {ordersLoading ? (
                <div style={{ fontSize: '0.86rem', color: 'var(--muted)' }}>Loading requests...</div>
              ) : listingOrders.length === 0 ? (
                <div style={{ fontSize: '0.86rem', color: 'var(--muted)' }}>No order requests for this listing yet.</div>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {listingOrders.map((o) => (
                    <div key={o._id} style={{
                      border: '1px solid var(--border)',
                      borderRadius: 10,
                      padding: '10px 12px',
                      background: 'var(--light-bg)'
                    }}>
                      <div className="d-flex justify-content-between align-items-start gap-2 flex-wrap">
                        <div style={{ fontSize: '0.85rem' }}>
                          <div style={{ fontWeight: 700, color: 'var(--dark)' }}>{o.buyerSnapshot?.name || o.buyer?.name || 'Buyer'}</div>
                          <div style={{ color: 'var(--muted)' }}>
                            {o.orderType === 'rent' ? `Rent (${o.rentDays} day${o.rentDays > 1 ? 's' : ''})` : 'Buy'} · ₹{o.amount?.toLocaleString()}
                          </div>
                          <div style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>
                            Placed on {new Date(o.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <span style={{
                          background: o.status === 'pending' ? '#fef9c3' : o.status === 'completed' ? '#dcfce7' : '#fee2e2',
                          color: o.status === 'pending' ? '#a16207' : o.status === 'completed' ? '#166534' : '#dc2626',
                          borderRadius: 20,
                          padding: '3px 10px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          textTransform: 'capitalize'
                        }}>
                          {o.status}
                        </span>
                      </div>

                      {o.status === 'pending' && (
                        <div className="d-flex gap-2 mt-2">
                          <button
                            type="button"
                            onClick={() => handleSellerOrderAction(o._id, 'completed')}
                            className="btn btn-success btn-sm fw-semibold"
                            style={{ borderRadius: 7 }}
                          >
                            Approve & Complete
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSellerOrderAction(o._id, 'cancelled')}
                            className="btn btn-outline-danger btn-sm fw-semibold"
                            style={{ borderRadius: 7 }}
                          >
                            Decline
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Order Modal ──────────────────────────── */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: '16px'
        }}>
          <div style={{
            background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 16, padding: '32px',
            maxWidth: 460, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.18)'
          }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, margin: 0 }}>
                Place Order
              </h5>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>
                <i className="bi bi-x-lg" />
              </button>
            </div>

            {listing.listingType === 'both' && (
              <div className="d-flex gap-2 mb-4">
                {['buy','rent'].map(t => (
                  <button
                    key={t}
                    onClick={() => setOrderType(t)}
                    className={`btn flex-fill ${orderType === t ? 'btn-primary' : 'btn-outline-secondary'}`}
                    style={{ borderRadius: 8, fontWeight: 600, textTransform: 'capitalize' }}
                  >
                    {t === 'buy' ? `Buy — ₹${listing.sellPrice?.toLocaleString()}` : `Rent — ₹${listing.rentPrice}/day`}
                  </button>
                ))}
              </div>
            )}

            {orderType === 'rent' && (
              <div className="mb-3">
                <label className="form-label fw-semibold" style={{ fontSize: '0.88rem' }}>Number of Days</label>
                <input
                  type="number" className="form-control" min={1} max={90}
                  value={rentDays}
                  onChange={e => setRentDays(Math.max(1, Number(e.target.value)))}
                />
                <div style={{ marginTop: 6, fontSize: '0.88rem', color: '#2563eb', fontWeight: 600 }}>
                  Total: ₹{totalRent.toLocaleString()} for {rentDays} day{rentDays !== 1 ? 's' : ''}
                </div>
              </div>
            )}

            <div className="mb-3">
              <label className="form-label fw-semibold" style={{ fontSize: '0.88rem' }}>Payment Method</label>
              <select className="form-select" value={payMethod} onChange={e => setPayMethod(e.target.value)}>
                <option value="cash">Cash (on meetup)</option>
                <option value="upi">UPI</option>
                <option value="online">Online Transfer</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="form-label fw-semibold" style={{ fontSize: '0.88rem' }}>Meetup Note (optional)</label>
              <textarea
                className="form-control" rows={2} placeholder="e.g. Meet at library gate, Tuesday 3pm"
                value={meetupNote} onChange={e => setMeetupNote(e.target.value)}
              />
            </div>

            <div style={{ background: 'var(--light-bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px', marginBottom: 20, fontSize: '0.85rem', color: 'var(--muted)' }}>
              <i className="bi bi-shield-check me-2" />
              Meetup on campus. Exchange item in person.
            </div>

            <div className="d-flex gap-2">
              <button onClick={() => setShowModal(false)} className="btn btn-outline-secondary flex-fill" style={{ borderRadius: 8 }}>
                Cancel
              </button>
              <button onClick={handleOrder} className="btn btn-primary flex-fill fw-bold" style={{ borderRadius: 8 }} disabled={ordering}>
                {ordering ? <><span className="spinner-border spinner-border-sm me-2" />Placing...</> : 'Confirm Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListingDetail;
