// src/pages/ProfilePage.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getUserProfile, updateProfile, changePassword } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import ListingCard from '../components/ListingCard';

const YEARS = ['1st Year','2nd Year','3rd Year','4th Year','Postgrad'];

const ProfilePage = () => {
  const { id } = useParams();
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('listings'); // 'listings' | 'password'
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });

  const isOwn = !id || id === user?._id;

  useEffect(() => {
    const load = async () => {
      try {
        const targetId = id || user?._id;
        if (!targetId) { navigate('/login'); return; }
        const { data } = await getUserProfile(targetId);
        setProfile(data.user);
        setListings(data.listings);
        setEditForm({
          name: data.user.name, college: data.user.college,
          studentYear: data.user.studentYear, department: data.user.department || '',
          phone: data.user.phone || '', bio: data.user.bio || ''
        });
      } catch { toast.error('Profile not found'); navigate('/'); }
      finally { setLoading(false); }
    };
    load();
  }, [id, user, navigate]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await updateProfile(editForm);
      setProfile(data.user);
      updateUser(data.user);
      setEditing(false);
      toast.success('Profile updated!');
    } catch { toast.error('Update failed'); }
    finally { setSaving(false); }
  };

  const handleChangePass = async (e) => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirm) { toast.error('Passwords do not match'); return; }
    if (passForm.newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setSaving(true);
    try {
      await changePassword({ currentPassword: passForm.currentPassword, newPassword: passForm.newPassword });
      toast.success('Password changed!');
      setPassForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="loading-screen"><div className="spinner-border text-primary" /></div>;
  if (!profile) return null;

  return (
    <div className="container" style={{ padding: '32px 12px' }}>
      <div className="row g-4">
        {/* ── Profile sidebar ──────────────────── */}
        <div className="col-lg-4">
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 16, padding: '28px', textAlign: 'center' }}>
            {/* Avatar */}
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2rem', fontWeight: 800, margin: '0 auto 16px',
              fontFamily: 'Syne, sans-serif'
            }}>
              {profile.name?.charAt(0).toUpperCase()}
            </div>

            <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.3rem', marginBottom: 4 }}>{profile.name}</h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginBottom: 4 }}>{profile.college}</p>
            <p style={{ color: 'var(--muted)', fontSize: '0.82rem', marginBottom: 12 }}>{profile.studentYear} · {profile.department}</p>

            {profile.avgRating > 0 && (
              <div style={{ marginBottom: 12 }}>
                <span style={{ color: '#f59e0b', fontSize: '1.1rem' }}>{'★'.repeat(Math.round(profile.avgRating))}</span>
                <span style={{ fontSize: '0.82rem', color: '#64748b', marginLeft: 6 }}>
                  {profile.avgRating.toFixed(1)} ({profile.totalRatings} reviews)
                </span>
              </div>
            )}

            {profile.bio && (
              <p style={{ fontSize: '0.88rem', color: 'var(--muted)', marginBottom: 16, lineHeight: 1.6 }}>{profile.bio}</p>
            )}

            {/* Stats */}
            <div className="row g-2 mb-4">
              <div className="col-6">
                <div className="stat-card">
                  <div className="stat-num">{listings.length}</div>
                  <div className="stat-label">Listings</div>
                </div>
              </div>
              <div className="col-6">
                <div className="stat-card">
                  <div className="stat-num">{profile.totalRatings || 0}</div>
                  <div className="stat-label">Reviews</div>
                </div>
              </div>
            </div>

            {profile.phone && (
              <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: 8 }}>
                <i className="bi bi-phone me-2" />{profile.phone}
              </div>
            )}

            <div style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
              <i className="bi bi-calendar me-2" />Joined {new Date(profile.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            </div>

            {isOwn && (
              <button
                onClick={() => setEditing(!editing)}
                className="btn btn-outline-primary w-100 mt-4 fw-semibold"
                style={{ borderRadius: 8 }}
              >
                <i className="bi bi-pencil me-2" />{editing ? 'Cancel Edit' : 'Edit Profile'}
              </button>
            )}
          </div>
        </div>

        {/* ── Right side ──────────────────────────── */}
        <div className="col-lg-8">
          {/* Edit form */}
          {isOwn && editing && (
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 16, padding: '24px', marginBottom: 24 }}>
              {/* Tabs */}
              <div className="d-flex gap-3 mb-4" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
                {['listings','password'].map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    style={{
                      background: 'none', border: 'none', fontFamily: 'Syne, sans-serif',
                      fontWeight: 700, fontSize: '0.92rem', cursor: 'pointer', paddingBottom: 8,
                      borderBottom: `2px solid ${tab === t ? '#2563eb' : 'transparent'}`,
                      color: tab === t ? '#2563eb' : 'var(--muted)', textTransform: 'capitalize'
                    }}>
                    {t === 'listings' ? 'Edit Profile Info' : 'Change Password'}
                  </button>
                ))}
              </div>

              {tab === 'listings' ? (
                <form onSubmit={handleSave}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.88rem' }}>Full Name</label>
                      <input className="form-control" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.88rem' }}>College</label>
                      <input className="form-control" value={editForm.college} onChange={e => setEditForm({...editForm, college: e.target.value})} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.88rem' }}>Year of Study</label>
                      <select className="form-select" value={editForm.studentYear} onChange={e => setEditForm({...editForm, studentYear: e.target.value})}>
                        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.88rem' }}>Department</label>
                      <input className="form-control" value={editForm.department} onChange={e => setEditForm({...editForm, department: e.target.value})} placeholder="e.g. Computer Science" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.88rem' }}>Phone</label>
                      <input className="form-control" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} placeholder="Mobile number" />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold" style={{ fontSize: '0.88rem' }}>Bio</label>
                      <textarea className="form-control" rows={3} value={editForm.bio} onChange={e => setEditForm({...editForm, bio: e.target.value})} placeholder="Tell others about yourself..." maxLength={300} />
                    </div>
                  </div>
                  <div className="d-flex gap-2 mt-3">
                    <button type="button" onClick={() => setEditing(false)} className="btn btn-outline-secondary" style={{ borderRadius: 8 }}>Cancel</button>
                    <button type="submit" className="btn btn-primary fw-bold px-4" style={{ borderRadius: 8 }} disabled={saving}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleChangePass}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold" style={{ fontSize: '0.88rem' }}>Current Password</label>
                    <input type="password" className="form-control" value={passForm.currentPassword} onChange={e => setPassForm({...passForm, currentPassword: e.target.value})} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold" style={{ fontSize: '0.88rem' }}>New Password</label>
                    <input type="password" className="form-control" value={passForm.newPassword} onChange={e => setPassForm({...passForm, newPassword: e.target.value})} required />
                  </div>
                  <div className="mb-4">
                    <label className="form-label fw-semibold" style={{ fontSize: '0.88rem' }}>Confirm New Password</label>
                    <input type="password" className="form-control" value={passForm.confirm} onChange={e => setPassForm({...passForm, confirm: e.target.value})} required />
                  </div>
                  <button type="submit" className="btn btn-primary fw-bold px-4" style={{ borderRadius: 8 }} disabled={saving}>
                    {saving ? 'Changing...' : 'Change Password'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Listings */}
          <div>
            <h4 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, marginBottom: 16, fontSize: '1.2rem' }}>
              {isOwn ? 'My Active Listings' : `${profile.name}'s Listings`}
            </h4>
            {listings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>
                <i className="bi bi-box fs-1 d-block mb-3" />
                <p>No active listings yet.</p>
                {isOwn && (
                  <button onClick={() => navigate('/add-listing')} className="btn btn-primary px-4" style={{ borderRadius: 8 }}>
                    Create Your First Listing
                  </button>
                )}
              </div>
            ) : (
              <div className="row g-3">
                {listings.map(l => (
                  <div key={l._id} className="col-sm-6">
                    <ListingCard listing={l} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
