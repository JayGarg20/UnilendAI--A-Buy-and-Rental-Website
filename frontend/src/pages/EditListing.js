// src/pages/EditListing.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getListing, updateListing } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['Books & Notes','Electronics','Stationery','Lab Equipment','Clothing','Sports & Fitness','Furniture','Other'];
const CONDITIONS = ['New','Like New','Good','Fair','Poor'];

const EditListing = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [form, setForm] = useState(null);
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getListing(id);
        const l = data.listing;
        if (l.seller._id !== user._id) { navigate('/my-listings'); return; }
        setForm({
          title: l.title, description: l.description, category: l.category,
          listingType: l.listingType, sellPrice: l.sellPrice, rentPrice: l.rentPrice,
          condition: l.condition, status: l.status
        });
        setPreviews(l.images.map(f => `${process.env.REACT_APP_API_URL?.replace('/api','') || ''}/uploads/${f}`));
      } catch { toast.error('Listing not found'); navigate('/my-listings'); }
      finally { setFetching(false); }
    };
    if (user) load();
  }, [id, user, navigate]);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleImages = (e) => {
    const files = Array.from(e.target.files).slice(0, 8);
    setImages(files);
    setPreviews(files.map(f => URL.createObjectURL(f)));
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      images.forEach(img => fd.append('images', img));
      await updateListing(id, fd);
      toast.success('Listing updated!');
      navigate(`/listings/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed');
    } finally { setLoading(false); }
  };

  if (fetching) return <div className="loading-screen"><div className="spinner-border text-primary" /></div>;
  if (!form) return null;

  return (
    <div className="container" style={{ padding: '32px 12px', maxWidth: 760 }}>
      <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.8rem', marginBottom: 24 }}>
        Edit Listing
      </h1>

      <form onSubmit={submit}>
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 14, padding: '24px', marginBottom: 20 }}>
          <h5 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: 18, fontSize: '1rem' }}>Basic Information</h5>

          <div className="mb-3">
            <label className="form-label fw-semibold" style={{ fontSize: '0.88rem' }}>Title *</label>
            <input name="title" className="form-control" value={form.title} onChange={handle} required maxLength={100} />
          </div>
          <div className="mb-3">
            <label className="form-label fw-semibold" style={{ fontSize: '0.88rem' }}>Description *</label>
            <textarea name="description" className="form-control" rows={4} value={form.description} onChange={handle} required maxLength={1000} />
          </div>
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label fw-semibold" style={{ fontSize: '0.88rem' }}>Category *</label>
              <select name="category" className="form-select" value={form.category} onChange={handle}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label fw-semibold" style={{ fontSize: '0.88rem' }}>Condition *</label>
              <select name="condition" className="form-select" value={form.condition} onChange={handle}>
                {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label fw-semibold" style={{ fontSize: '0.88rem' }}>Status</label>
              <select name="status" className="form-select" value={form.status} onChange={handle}>
                <option value="available">Available</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 14, padding: '24px', marginBottom: 20 }}>
          <h5 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: 18, fontSize: '1rem' }}>Pricing</h5>
          <div className="mb-3">
            <label className="form-label fw-semibold" style={{ fontSize: '0.88rem' }}>Listing Type</label>
            <div className="d-flex gap-2">
              {[['sell','For Sale'],['rent','For Rent'],['both','Both']].map(([val, label]) => (
                <button key={val} type="button"
                  onClick={() => setForm(f => ({ ...f, listingType: val }))}
                  className={`btn btn-sm flex-fill ${form.listingType === val ? 'btn-primary' : 'btn-outline-secondary'}`}
                  style={{ borderRadius: 8, fontWeight: 600, fontSize: '0.82rem' }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="row g-3">
            {(form.listingType === 'sell' || form.listingType === 'both') && (
              <div className="col-md-6">
                <label className="form-label fw-semibold" style={{ fontSize: '0.88rem' }}>Sell Price (₹)</label>
                <div className="input-group">
                  <span className="input-group-text">₹</span>
                  <input name="sellPrice" type="number" className="form-control" value={form.sellPrice} onChange={handle} min="0" />
                </div>
              </div>
            )}
            {(form.listingType === 'rent' || form.listingType === 'both') && (
              <div className="col-md-6">
                <label className="form-label fw-semibold" style={{ fontSize: '0.88rem' }}>Rent / Day (₹)</label>
                <div className="input-group">
                  <span className="input-group-text">₹</span>
                  <input name="rentPrice" type="number" className="form-control" value={form.rentPrice} onChange={handle} min="0" />
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 14, padding: '24px', marginBottom: 24 }}>
          <h5 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: 8, fontSize: '1rem' }}>Update Photos</h5>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: 14 }}>Upload new images to replace existing ones.</p>

          {previews.length > 0 && (
            <div className="d-flex gap-2 flex-wrap mb-3">
              {previews.map((src, i) => (
                <div key={i} style={{ width: 80, height: 80, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}
          <input type="file" multiple accept="image/*" className="form-control" onChange={handleImages} />
        </div>

        <div className="d-flex gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn btn-outline-secondary px-4 py-2 fw-semibold" style={{ borderRadius: 8 }}>Cancel</button>
          <button type="submit" className="btn btn-primary flex-fill py-2 fw-bold" style={{ borderRadius: 8 }} disabled={loading}>
            {loading ? <><span className="spinner-border spinner-border-sm me-2" />Saving...</> : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditListing;
