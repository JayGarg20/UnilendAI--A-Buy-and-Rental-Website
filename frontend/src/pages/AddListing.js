// src/pages/AddListing.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { createListing, suggestPrice } from '../utils/api';

const CATEGORIES = ['Books & Notes','Electronics','Stationery','Lab Equipment','Clothing','Sports & Fitness','Furniture','Other'];
const CONDITIONS = ['New','Like New','Good','Fair','Poor'];

const AddListing = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', description: '', category: '', listingType: 'sell',
    sellPrice: '', rentPrice: '', condition: ''
  });
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);

  const sectionCardStyle = {
    background: 'var(--card-bg)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    padding: '24px'
  };

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleImages = (e) => {
    const files = Array.from(e.target.files).slice(0, 8);
    setImages(files);
    setPreviews(files.map(f => URL.createObjectURL(f)));
  };

  const handleSuggestPrice = async () => {
    if (!form.category || !form.condition || !form.listingType) {
      toast.warn('Please select Category, Condition, and Listing Type first');
      return;
    }
    setLoadingSuggestion(true);
    try {
      const { data } = await suggestPrice({ category: form.category, condition: form.condition, listingType: form.listingType });
      setAiSuggestion(data.suggestion);
      toast.success('AI price suggestion ready!');
    } catch { toast.error('Could not fetch suggestion'); }
    finally { setLoadingSuggestion(false); }
  };

  const applyPrice = (type, value) => {
    if (type === 'sell') setForm(f => ({ ...f, sellPrice: value }));
    else setForm(f => ({ ...f, rentPrice: value }));
    toast.success('Price applied!');
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.category || !form.condition) {
      toast.error('Please fill all required fields'); return;
    }
    if (form.listingType !== 'rent' && !form.sellPrice) { toast.error('Please enter a sell price'); return; }
    if (form.listingType !== 'sell' && !form.rentPrice) { toast.error('Please enter a rent price'); return; }

    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      images.forEach(img => fd.append('images', img));
      const { data } = await createListing(fd);
      toast.success('Listing created successfully!');
      navigate(`/listings/${data.listing._id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create listing');
    } finally { setLoading(false); }
  };

  return (
    <div className="container" style={{ padding: '32px 12px', maxWidth: 760 }}>
      <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.8rem', marginBottom: 4 }}>
        Create a Listing
      </h1>
      <p style={{ color: 'var(--muted)', marginBottom: 28 }}>List an item to sell or rent to fellow students.</p>

      <form onSubmit={submit}>
        <div style={{ ...sectionCardStyle, marginBottom: 20 }}>
          <h5 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: 18, fontSize: '1rem' }}>
            Basic Information
          </h5>

          <div className="mb-3">
            <label className="form-label fw-semibold" style={{ fontSize: '0.88rem' }}>Title *</label>
            <input name="title" className="form-control" placeholder="e.g. Engineering Mathematics Textbook (3rd Sem)" value={form.title} onChange={handle} required maxLength={100} />
            <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 4 }}>{form.title.length}/100</div>
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold" style={{ fontSize: '0.88rem' }}>Description *</label>
            <textarea name="description" className="form-control" rows={4}
              placeholder="Describe the item's condition, edition, included accessories, reason for selling, etc."
              value={form.description} onChange={handle} required maxLength={1000} />
            <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 4 }}>{form.description.length}/1000</div>
          </div>

          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-semibold" style={{ fontSize: '0.88rem' }}>Category *</label>
              <select name="category" className="form-select" value={form.category} onChange={handle} required>
                <option value="">Select category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold" style={{ fontSize: '0.88rem' }}>Condition *</label>
              <select name="condition" className="form-select" value={form.condition} onChange={handle} required>
                <option value="">Select condition</option>
                {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div style={{ ...sectionCardStyle, marginBottom: 20 }}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, margin: 0, fontSize: '1rem' }}>
              Pricing & Listing Type
            </h5>
            <button
              type="button"
              onClick={handleSuggestPrice}
              className="btn btn-sm"
              disabled={loadingSuggestion}
              style={{
                background: 'linear-gradient(90deg,#7c3aed,#2563eb)',
                color: '#fff', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600, padding: '5px 14px'
              }}
            >
              {loadingSuggestion
                ? <><span className="spinner-border spinner-border-sm me-1" />Thinking...</>
                : '✦ AI Suggest Price'}
            </button>
          </div>

          {/* AI Suggestion card */}
          {aiSuggestion && (
            <div style={{ background: 'rgba(124,58,237,0.10)', border: '1px solid rgba(124,58,237,0.35)', borderRadius: 10, padding: '14px 16px', marginBottom: 18 }}>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#6d28d9', marginBottom: 10 }}>
                ✦ AI Price Suggestion — {aiSuggestion.category}, {aiSuggestion.condition}
              </div>
              <div className="row g-2">
                <div className="col-sm-6">
                  <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: 4 }}>Sell Price Range</div>
                  <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>
                    ₹{aiSuggestion.priceRange.sell.low} – ₹{aiSuggestion.priceRange.sell.high}
                    <span style={{ fontSize: '0.78rem', color: '#7c3aed', marginLeft: 6 }}>
                      (recommended: ₹{aiSuggestion.suggestedSellPrice})
                    </span>
                  </div>
                  <button type="button" onClick={() => applyPrice('sell', aiSuggestion.suggestedSellPrice)}
                    className="btn btn-sm mt-1" style={{ background: '#7c3aed', color: '#fff', borderRadius: 6, fontSize: '0.78rem' }}>
                    Apply Sell Price
                  </button>
                </div>
                <div className="col-sm-6">
                  <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: 4 }}>Rent / Day Range</div>
                  <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>
                    ₹{aiSuggestion.priceRange.rent.low} – ₹{aiSuggestion.priceRange.rent.high}
                    <span style={{ fontSize: '0.78rem', color: '#7c3aed', marginLeft: 6 }}>
                      (recommended: ₹{aiSuggestion.suggestedRentPrice})
                    </span>
                  </div>
                  <button type="button" onClick={() => applyPrice('rent', aiSuggestion.suggestedRentPrice)}
                    className="btn btn-sm mt-1" style={{ background: '#7c3aed', color: '#fff', borderRadius: 6, fontSize: '0.78rem' }}>
                    Apply Rent Price
                  </button>
                </div>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#7c3aed', marginTop: 10, marginBottom: 0, fontStyle: 'italic' }}>
                💡 {aiSuggestion.tip}
              </p>
            </div>
          )}

          <div className="mb-3">
            <label className="form-label fw-semibold" style={{ fontSize: '0.88rem' }}>Listing Type *</label>
            <div className="d-flex gap-2">
              {[['sell','For Sale Only'],['rent','For Rent Only'],['both','Both (Sale & Rent)']].map(([val, label]) => (
                <button
                  key={val} type="button"
                  onClick={() => setForm(f => ({ ...f, listingType: val }))}
                  className={`btn btn-sm flex-fill ${form.listingType === val ? 'btn-primary' : 'btn-outline-secondary'}`}
                  style={{ borderRadius: 8, fontWeight: 600, fontSize: '0.82rem' }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="row g-3">
            {(form.listingType === 'sell' || form.listingType === 'both') && (
              <div className="col-md-6">
                <label className="form-label fw-semibold" style={{ fontSize: '0.88rem' }}>Sell Price (₹) *</label>
                <div className="input-group">
                  <span className="input-group-text">₹</span>
                  <input name="sellPrice" type="number" className="form-control" placeholder="0" min="0" value={form.sellPrice} onChange={handle} />
                </div>
              </div>
            )}
            {(form.listingType === 'rent' || form.listingType === 'both') && (
              <div className="col-md-6">
                <label className="form-label fw-semibold" style={{ fontSize: '0.88rem' }}>Rent Price / Day (₹) *</label>
                <div className="input-group">
                  <span className="input-group-text">₹</span>
                  <input name="rentPrice" type="number" className="form-control" placeholder="0" min="0" value={form.rentPrice} onChange={handle} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Images */}
        <div style={{ ...sectionCardStyle, marginBottom: 24 }}>
          <h5 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: 4, fontSize: '1rem' }}>Photos</h5>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: 14 }}>Upload up to 8 images. First image will be the cover.</p>

          <input type="file" multiple accept="image/*" className="form-control mb-3" onChange={handleImages} />

          {previews.length > 0 && (
            <div className="d-flex gap-2 flex-wrap">
              {previews.map((src, i) => (
                <div key={i} style={{ width: 90, height: 90, borderRadius: 8, overflow: 'hidden', border: `2px solid ${i === 0 ? '#2563eb' : 'var(--border)'}` }}>
                  <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="d-flex gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn btn-outline-secondary px-4 py-2 fw-semibold" style={{ borderRadius: 8 }}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary flex-fill py-2 fw-bold" style={{ borderRadius: 8, fontSize: '1rem' }} disabled={loading}>
            {loading ? <><span className="spinner-border spinner-border-sm me-2" />Creating...</> : 'Create Listing'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddListing;
