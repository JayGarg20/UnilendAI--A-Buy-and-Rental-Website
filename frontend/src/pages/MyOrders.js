// src/pages/MyOrders.js
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getMyOrders, getMySales, updateOrderStatus, rateOrder } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const statusColor = {
  pending:   { bg: '#fef9c3', text: '#a16207' },
  confirmed: { bg: '#dbeafe', text: '#1d4ed8' },
  completed: { bg: '#dcfce7', text: '#16a34a' },
  cancelled: { bg: '#fee2e2', text: '#dc2626' },
};

const statusLabel = {
  pending: 'Pending Approval',
  confirmed: 'Approved',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const formatDate = (value) => {
  if (!value) return '-';
  const dt = new Date(value);
  return Number.isNaN(dt.getTime()) ? '-' : dt.toLocaleDateString();
};

const MyOrders = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState('buying');
  const [orders, setOrders] = useState([]);
  const [sales, setSales]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratingOrderId, setRatingOrderId] = useState(null);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [didInitialLoad, setDidInitialLoad] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [o, s] = await Promise.all([getMyOrders(), getMySales()]);
        setOrders(o.data.orders);
        setSales(s.data.orders);
      } catch { toast.error('Could not load orders'); }
      finally {
        setLoading(false);
        setDidInitialLoad(true);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!didInitialLoad) return;

    const interval = setInterval(async () => {
      try {
        const [o, s] = await Promise.all([getMyOrders(), getMySales()]);

        setOrders((prev) => {
          const prevMap = new Map(prev.map(item => [item._id, item.status]));
          o.data.orders.forEach((nextOrder) => {
            const previousStatus = prevMap.get(nextOrder._id);
            if (previousStatus && previousStatus !== nextOrder.status) {
              if (nextOrder.status === 'completed') {
                toast.success('Seller approved your order ✅');
              } else if (nextOrder.status === 'cancelled') {
                toast.info('Seller declined/cancelled your order');
              }
            }
          });
          return o.data.orders;
        });

        setSales(s.data.orders);
      } catch {
        // Silent polling failure
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [didInitialLoad]);

  useEffect(() => {
    if (!loading && tab === 'buying' && orders.length === 0 && sales.length > 0) {
      setTab('selling');
    }
  }, [loading, tab, orders.length, sales.length]);

  const handleStatusUpdate = async (id, status, isSale) => {
    try {
      const { data } = await updateOrderStatus(id, status);
      const updater = prev => prev.map(o => o._id === id ? { ...o, status } : o);
      // Keep both tabs in sync
      setSales(updater);
      setOrders(updater);
      toast.success(data?.message || `Order ${status}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update status');
    }
  };

  const handleRate = async (orderId) => {
    try {
      await rateOrder(orderId, { rating, review });
      setRatingOrderId(null);
      toast.success('Review submitted!');
    } catch { toast.error('Failed to submit review'); }
  };

  const PLACEHOLDER = 'https://via.placeholder.com/60x60?text=Item';

  const renderOrder = (order, isSale) => (
    <div key={order._id} style={{
      background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12,
      padding: '16px', marginBottom: 12
    }}>
      <div className="d-flex gap-3 align-items-start">
        <img
          src={order.listing?.images?.[0]
            ? `${process.env.REACT_APP_API_URL?.replace('/api','') || ''}/uploads/${order.listing.images[0]}`
            : PLACEHOLDER}
          alt=""
          style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
          onError={e => e.target.src = PLACEHOLDER}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="d-flex justify-content-between align-items-start gap-2 flex-wrap">
            <div>
              <Link to={`/listings/${order.listing?._id}`} style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: 'var(--dark)', textDecoration: 'none' }}>
                {order.listing?.title}
              </Link>
              <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 2 }}>
                {order.listing?.category} · {order.orderType === 'rent' ? `Rented ${order.rentDays} day(s)` : 'Bought'}
              </div>
            </div>
            <span style={{
              background: (statusColor[order.status] || statusColor.pending).bg,
              color: (statusColor[order.status] || statusColor.pending).text,
              borderRadius: 20, padding: '3px 12px', fontSize: '0.78rem', fontWeight: 600, flexShrink: 0
            }}>
              {statusLabel[order.status] || order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
          </div>

          <div className="d-flex gap-3 flex-wrap mt-2" style={{ fontSize: '0.82rem' }}>
            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: '#2563eb' }}>
              ₹{order.amount?.toLocaleString()}
            </span>
            <span style={{ color: 'var(--muted)' }}>
              <i className="bi bi-credit-card me-1" />{order.paymentMethod}
            </span>
            <span style={{ color: 'var(--muted)' }}>
              <i className="bi bi-person me-1" />
              {isSale
                ? `Buyer: ${order.buyerSnapshot?.name || order.buyer?.name}`
                : `Seller: ${order.seller?.name}`}
            </span>
            <span style={{ color: 'var(--muted)' }}>
              {new Date(order.createdAt).toLocaleDateString()}
            </span>
          </div>

          <div style={{
            marginTop: 10,
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'var(--light-bg)',
            fontSize: '0.82rem'
          }}>
            <div style={{ fontWeight: 700, color: 'var(--dark)', marginBottom: 4 }}>
              {isSale ? 'Buyer Details' : 'Seller Details'}
            </div>
            <div style={{ color: 'var(--muted)' }}>
              <i className="bi bi-person me-1" />
              {isSale ? (order.buyerSnapshot?.name || order.buyer?.name || '-') : (order.seller?.name || '-')}
            </div>
            <div style={{ color: 'var(--muted)' }}>
              <i className="bi bi-envelope me-1" />
              {isSale ? (order.buyerSnapshot?.email || order.buyer?.email || '-') : (order.seller?.email || '-')}
            </div>
            <div style={{ color: 'var(--muted)' }}>
              <i className="bi bi-telephone me-1" />
              {isSale ? (order.buyerSnapshot?.phone || order.buyer?.phone || '-') : (order.seller?.phone || '-')}
            </div>

            <div style={{ fontWeight: 700, color: 'var(--dark)', marginTop: 8, marginBottom: 4 }}>Order Info</div>
            <div style={{ color: 'var(--muted)' }}>
              <i className="bi bi-bag-check me-1" />{order.orderType === 'rent' ? 'Rental' : 'Purchase'}
            </div>
            {order.orderType === 'rent' && (
              <>
                <div style={{ color: 'var(--muted)' }}>
                  <i className="bi bi-calendar-range me-1" />Duration: {order.rentDays} day{order.rentDays > 1 ? 's' : ''}
                </div>
                <div style={{ color: 'var(--muted)' }}>
                  <i className="bi bi-calendar-event me-1" />Start: {formatDate(order.rentalStartDate)}
                </div>
                <div style={{ color: 'var(--muted)' }}>
                  <i className="bi bi-calendar2-check me-1" />End: {formatDate(order.rentalEndDate)}
                </div>
              </>
            )}

            {order.status === 'pending' && !isSale && (
              <div style={{ color: 'var(--muted)', marginTop: 8 }}>
                <i className="bi bi-hourglass-split me-1" />Waiting for seller approval.
              </div>
            )}

            {order.status === 'completed' && !isSale && (
              <div style={{ color: '#16a34a', marginTop: 8, fontWeight: 600 }}>
                <i className="bi bi-check-circle me-1" />Seller accepted your order
                {order.completedAt && ` on ${new Date(order.completedAt).toLocaleString()}`}
              </div>
            )}

            {order.status === 'cancelled' && !isSale && (
              <div style={{ color: '#dc2626', marginTop: 8, fontWeight: 600 }}>
                <i className="bi bi-x-circle me-1" />Order cancelled/declined
                {order.cancelledAt && ` on ${new Date(order.cancelledAt).toLocaleString()}`}
              </div>
            )}
          </div>

          {order.meetupNote && (
            <div style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: 4 }}>
              <i className="bi bi-geo-alt me-1" />{order.meetupNote}
            </div>
          )}

          {/* Actions */}
          <div className="d-flex gap-2 mt-3 flex-wrap">
            {isSale && order.status === 'pending' && (
              <>
                <button onClick={() => handleStatusUpdate(order._id, 'completed', true)}
                  className="btn btn-success btn-sm fw-semibold" style={{ borderRadius: 7 }}>
                  Approve & Complete
                </button>
                <button onClick={() => handleStatusUpdate(order._id, 'cancelled', true)}
                  className="btn btn-outline-danger btn-sm fw-semibold" style={{ borderRadius: 7 }}>
                  Decline
                </button>
              </>
            )}
            {isSale && order.status === 'confirmed' && (
              <button onClick={() => handleStatusUpdate(order._id, 'completed', true)}
                className="btn btn-primary btn-sm fw-semibold" style={{ borderRadius: 7 }}>
                Complete (Legacy)
              </button>
            )}
            {!isSale && order.status === 'pending' && (
              <button onClick={() => handleStatusUpdate(order._id, 'cancelled', false)}
                className="btn btn-outline-danger btn-sm fw-semibold" style={{ borderRadius: 7 }}>
                Cancel Order
              </button>
            )}
            {!isSale && order.status === 'completed' && !order.sellerRating && (
              <button onClick={() => setRatingOrderId(order._id)}
                className="btn btn-outline-warning btn-sm fw-semibold" style={{ borderRadius: 7 }}>
                <i className="bi bi-star me-1" />Rate Seller
              </button>
            )}

            {/* Contact */}
            {order.status === 'pending' && (
              <a href={`tel:${isSale ? order.buyer?.phone : order.seller?.phone}`}
                className="btn btn-outline-secondary btn-sm fw-semibold" style={{ borderRadius: 7 }}>
                <i className="bi bi-phone me-1" />Contact
              </a>
            )}
          </div>

          {/* Rating form */}
          {ratingOrderId === order._id && (
            <div style={{ background: 'var(--light-bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '14px', marginTop: 12 }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, marginBottom: 10 }}>Rate your experience</div>
              <div className="d-flex gap-1 mb-2">
                {[1,2,3,4,5].map(s => (
                  <button key={s} type="button" onClick={() => setRating(s)}
                    style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: s <= rating ? '#f59e0b' : '#d1d5db' }}>
                    ★
                  </button>
                ))}
              </div>
              <textarea className="form-control form-control-sm mb-2" rows={2}
                placeholder="Write a review (optional)" value={review}
                onChange={e => setReview(e.target.value)} />
              <div className="d-flex gap-2">
                <button onClick={() => setRatingOrderId(null)} className="btn btn-outline-secondary btn-sm" style={{ borderRadius: 7 }}>Cancel</button>
                <button onClick={() => handleRate(order._id)} className="btn btn-primary btn-sm fw-bold" style={{ borderRadius: 7 }}>Submit</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const current = tab === 'buying' ? orders : sales;

  return (
    <div className="container" style={{ padding: '32px 12px', maxWidth: 860 }}>
      <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.8rem', marginBottom: 24 }}>My Orders</h1>

      {/* Tab switcher */}
      <div className="d-flex gap-1 mb-4" style={{ background: 'var(--light-bg)', border: '1px solid var(--border)', borderRadius: 10, padding: 4, display: 'inline-flex' }}>
        {[['buying', `Buying (${orders.length})`], ['selling', `Selling (${sales.length})`]].map(([val, label]) => (
          <button key={val} onClick={() => setTab(val)} style={{
            background: tab === val ? 'var(--card-bg)' : 'transparent',
            border: 'none', borderRadius: 8, padding: '8px 20px',
            fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer',
            color: tab === val ? 'var(--dark)' : 'var(--muted)',
            boxShadow: tab === val ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
            fontFamily: 'Syne, sans-serif'
          }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'buying' && orders.length === 0 && sales.length > 0 && (
        <div className="alert alert-info py-2 px-3" style={{ borderRadius: 8, marginBottom: 12 }}>
          <div className="d-flex justify-content-between align-items-center gap-2 flex-wrap">
            <span style={{ fontSize: '0.86rem' }}>
              You have {sales.length} sale order{sales.length > 1 ? 's' : ''}. Approve from the Selling tab.
            </span>
            <button className="btn btn-sm btn-primary" onClick={() => setTab('selling')}>
              Open Selling
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading-screen"><div className="spinner-border text-primary" /></div>
      ) : current.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
          <i className="bi bi-bag fs-1 d-block mb-3" />
          <h5 style={{ fontFamily: 'Syne, sans-serif' }}>
            {tab === 'buying' ? 'No orders yet' : 'No sales yet'}
          </h5>
          <p>{tab === 'buying' ? 'Browse listings to find something you need.' : 'Create a listing to start selling.'}</p>
          <Link to={tab === 'buying' ? '/listings' : '/add-listing'} className="btn btn-primary px-4" style={{ borderRadius: 8 }}>
            {tab === 'buying' ? 'Browse Listings' : 'Create Listing'}
          </Link>
        </div>
      ) : (
        current.map(order => renderOrder(order, tab === 'selling'))
      )}
    </div>
  );
};

export default MyOrders;
