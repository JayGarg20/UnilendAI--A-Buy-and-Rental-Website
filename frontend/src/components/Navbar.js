// src/components/Navbar.js
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const Navbar = ({ theme, onToggleTheme }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/listings?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const isActive = (path) => location.pathname === path ? 'nav-link active fw-semibold' : 'nav-link';

  return (
    <nav className="unilend-navbar navbar navbar-expand-lg">
      <div className="container">
        {/* Brand */}
        <Link to="/" className="brand me-4">
          Uni<span>Lend</span> AI
        </Link>

        {/* Search bar (desktop) */}
        <form className="d-none d-lg-flex me-auto" style={{ maxWidth: 360, flex: 1 }} onSubmit={handleSearch}>
          <div className="input-group">
            <input
              type="text"
              className="form-control form-control-sm border-end-0"
              placeholder="Search items..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ borderRadius: '8px 0 0 8px', fontSize: '0.88rem' }}
            />
            <button className="btn btn-primary btn-sm px-3" type="submit" style={{ borderRadius: '0 8px 8px 0' }}>
              <i className="bi bi-search" />
            </button>
          </div>
        </form>

        {/* Mobile toggler */}
        <button
          className="navbar-toggler border-0"
          onClick={() => setMenuOpen(!menuOpen)}
          style={{ boxShadow: 'none' }}
        >
          <i className={`bi ${menuOpen ? 'bi-x-lg' : 'bi-list'} fs-4`} />
        </button>

        {/* Nav links */}
        <div className={`collapse navbar-collapse ${menuOpen ? 'show' : ''}`}>
          <ul className="navbar-nav ms-lg-3 me-auto align-items-lg-center gap-lg-1">
            <li className="nav-item">
              <Link to="/listings" className={isActive('/listings')} onClick={() => setMenuOpen(false)}>
                Browse
              </Link>
            </li>
            {user && (
              <>
                <li className="nav-item">
                  <Link to="/my-listings" className={isActive('/my-listings')} onClick={() => setMenuOpen(false)}>
                    My Listings
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/my-orders" className={isActive('/my-orders')} onClick={() => setMenuOpen(false)}>
                    My Orders
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/wishlist" className={isActive('/wishlist')} onClick={() => setMenuOpen(false)}>
                    <i className="bi bi-heart me-1" />Wishlist
                  </Link>
                </li>
              </>
            )}
          </ul>

          {/* Mobile search */}
          <form className="d-lg-none my-2" onSubmit={handleSearch}>
            <div className="input-group">
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Search items..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <button className="btn btn-primary btn-sm" type="submit">
                <i className="bi bi-search" />
              </button>
            </div>
          </form>

          {/* Auth buttons */}
          <div className="d-flex align-items-center gap-2 mt-2 mt-lg-0">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm px-3"
              onClick={onToggleTheme}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              <i className={`bi ${theme === 'dark' ? 'bi-sun' : 'bi-moon-stars'} me-1`} />
              {theme === 'dark' ? 'Light' : 'Dark'}
            </button>

            {user ? (
              <>
                <Link
                  to="/add-listing"
                  className="btn btn-primary btn-sm px-3"
                  onClick={() => setMenuOpen(false)}
                >
                  <i className="bi bi-plus-lg me-1" />Sell / Rent
                </Link>
                <div className="dropdown">
                  <button
                    className="btn btn-light btn-sm d-flex align-items-center gap-2"
                    data-bs-toggle="dropdown"
                    style={{ borderRadius: 8 }}
                  >
                    {user.avatar
                      ? <img src={user.avatar} alt="avatar" style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover' }} />
                      : <span
                          style={{
                            width: 28, height: 28, borderRadius: '50%',
                            background: '#2563eb', color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.75rem', fontWeight: 700
                          }}
                        >
                          {user.name?.charAt(0).toUpperCase()}
                        </span>
                    }
                    <span className="d-none d-lg-inline" style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                      {user.name?.split(' ')[0]}
                    </span>
                    <i className="bi bi-chevron-down" style={{ fontSize: '0.7rem' }} />
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end" style={{ minWidth: 180 }}>
                    <li><Link className="dropdown-item" to="/profile" onClick={() => setMenuOpen(false)}><i className="bi bi-person me-2" />My Profile</Link></li>
                    <li><Link className="dropdown-item" to="/my-listings" onClick={() => setMenuOpen(false)}><i className="bi bi-grid me-2" />My Listings</Link></li>
                    <li><Link className="dropdown-item" to="/my-orders" onClick={() => setMenuOpen(false)}><i className="bi bi-bag me-2" />My Orders</Link></li>
                    <li><Link className="dropdown-item" to="/wishlist" onClick={() => setMenuOpen(false)}><i className="bi bi-heart me-2" />Wishlist</Link></li>
                    <li><hr className="dropdown-divider" /></li>
                    <li><button className="dropdown-item text-danger" onClick={handleLogout}><i className="bi bi-box-arrow-right me-2" />Logout</button></li>
                  </ul>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline-primary btn-sm px-3" onClick={() => setMenuOpen(false)}>
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm px-3" onClick={() => setMenuOpen(false)}>
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
