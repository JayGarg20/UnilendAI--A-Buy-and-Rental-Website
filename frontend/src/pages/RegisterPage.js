// src/pages/RegisterPage.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const YEARS  = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Postgrad'];

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    college: '', studentYear: '', department: '', phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [step, setStep] = useState(1); // 2-step registration

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const nextStep = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) { toast.error('Fill all required fields'); return; }
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setStep(2);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.college || !form.studentYear) { toast.error('College and year are required'); return; }
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created! Welcome to UniLend AI!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" style={{ padding: '40px 0' }}>
      <div className="container">
        <div className="auth-card" style={{ maxWidth: 500 }}>
          <div className="auth-logo">Uni<span>Lend</span> AI</div>
          <p style={{ textAlign: 'center', color: '#64748b', marginBottom: 24, fontSize: '0.92rem' }}>
            Join your campus marketplace
          </p>

          {/* Step indicator */}
          <div className="d-flex align-items-center mb-4 gap-2">
            {[1, 2].map(s => (
              <React.Fragment key={s}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontWeight: 700,
                  fontSize: '0.85rem',
                  background: step >= s ? '#2563eb' : '#e2e8f0',
                  color: step >= s ? '#fff' : '#64748b'
                }}>{s}</div>
                {s < 2 && <div style={{ flex: 1, height: 2, background: step > s ? '#2563eb' : '#e2e8f0', borderRadius: 2 }} />}
              </React.Fragment>
            ))}
            <div style={{ marginLeft: 8, fontSize: '0.82rem', color: '#64748b' }}>
              {step === 1 ? 'Account Info' : 'College Info'}
            </div>
          </div>

          {step === 1 ? (
            <form onSubmit={nextStep}>
              <div className="mb-3">
                <label className="form-label fw-semibold" style={{ fontSize: '0.88rem' }}>Full Name *</label>
                <input name="name" className="form-control" placeholder="Your full name" value={form.name} onChange={handle} required />
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold" style={{ fontSize: '0.88rem' }}>Email Address *</label>
                <input name="email" type="email" className="form-control" placeholder="you@college.edu" value={form.email} onChange={handle} required />
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold" style={{ fontSize: '0.88rem' }}>Password *</label>
                <div className="input-group">
                  <input
                    name="password" type={showPass ? 'text' : 'password'}
                    className="form-control" placeholder="Min. 6 characters"
                    value={form.password} onChange={handle} required
                  />
                  <button type="button" className="input-group-text" onClick={() => setShowPass(!showPass)}>
                    <i className={`bi ${showPass ? 'bi-eye-slash' : 'bi-eye'}`} />
                  </button>
                </div>
              </div>
              <div className="mb-4">
                <label className="form-label fw-semibold" style={{ fontSize: '0.88rem' }}>Confirm Password *</label>
                <input
                  name="confirmPassword" type="password" className="form-control"
                  placeholder="Repeat password" value={form.confirmPassword} onChange={handle} required
                />
              </div>
              <button type="submit" className="btn btn-primary w-100 py-2 fw-bold" style={{ borderRadius: 8 }}>
                Continue <i className="bi bi-arrow-right ms-1" />
              </button>
            </form>
          ) : (
            <form onSubmit={submit}>
              <div className="mb-3">
                <label className="form-label fw-semibold" style={{ fontSize: '0.88rem' }}>College / University *</label>
                <input name="college" className="form-control" placeholder="e.g. IIT Delhi, BITS Pilani" value={form.college} onChange={handle} required />
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold" style={{ fontSize: '0.88rem' }}>Year of Study *</label>
                <select name="studentYear" className="form-select" value={form.studentYear} onChange={handle} required>
                  <option value="">Select year</option>
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold" style={{ fontSize: '0.88rem' }}>Department</label>
                <input name="department" className="form-control" placeholder="e.g. Computer Science" value={form.department} onChange={handle} />
              </div>
              <div className="mb-4">
                <label className="form-label fw-semibold" style={{ fontSize: '0.88rem' }}>Phone Number</label>
                <input name="phone" className="form-control" placeholder="10-digit mobile number" value={form.phone} onChange={handle} />
              </div>
              <div className="d-flex gap-2">
                <button type="button" className="btn btn-outline-secondary py-2 fw-semibold" style={{ borderRadius: 8, flex: 1 }} onClick={() => setStep(1)}>
                  <i className="bi bi-arrow-left me-1" /> Back
                </button>
                <button type="submit" className="btn btn-primary py-2 fw-bold" style={{ borderRadius: 8, flex: 2 }} disabled={loading}>
                  {loading ? <><span className="spinner-border spinner-border-sm me-2" />Creating...</> : 'Create Account'}
                </button>
              </div>
            </form>
          )}

          <div style={{ textAlign: 'center', marginTop: 20, fontSize: '0.9rem', color: '#64748b' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
