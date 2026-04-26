// src/pages/LoginPage.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { toast.error('Please fill all fields'); return; }
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="container">
        <div className="auth-card">
          <div className="auth-logo">Uni<span>Lend</span> AI</div>
          <p style={{ textAlign: 'center', color: '#64748b', marginBottom: 28, fontSize: '0.92rem' }}>
            Login to your campus marketplace account
          </p>

          <form onSubmit={submit}>
            <div className="mb-3">
              <label className="form-label fw-semibold" style={{ fontSize: '0.88rem' }}>Email Address</label>
              <div className="input-group">
                <span className="input-group-text"><i className="bi bi-envelope" /></span>
                <input
                  type="email"
                  name="email"
                  className="form-control"
                  placeholder="you@college.edu"
                  value={form.email}
                  onChange={handle}
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label fw-semibold" style={{ fontSize: '0.88rem' }}>Password</label>
              <div className="input-group">
                <span className="input-group-text"><i className="bi bi-lock" /></span>
                <input
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  className="form-control"
                  placeholder="Your password"
                  value={form.password}
                  onChange={handle}
                  required
                />
                <button
                  type="button"
                  className="input-group-text"
                  onClick={() => setShowPass(!showPass)}
                  style={{ cursor: 'pointer' }}
                >
                  <i className={`bi ${showPass ? 'bi-eye-slash' : 'bi-eye'}`} />
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 py-2 fw-bold"
              style={{ borderRadius: 8, fontSize: '0.95rem' }}
              disabled={loading}
            >
              {loading ? <><span className="spinner-border spinner-border-sm me-2" />Logging in...</> : 'Login'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 20, fontSize: '0.9rem', color: '#64748b' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>
              Sign Up
            </Link>
          </div>

          {/* Demo credentials hint */}
          <div style={{
            background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8,
            padding: '12px 14px', marginTop: 20, fontSize: '0.82rem', color: '#0369a1'
          }}>
            <i className="bi bi-info-circle me-2" />
            <strong>Demo:</strong> Register a new account to explore all features.
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
