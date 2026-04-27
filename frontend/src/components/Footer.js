// src/components/Footer.js
import React from 'react';
import { Link } from 'react-router-dom';

const Footer = ({ theme, onToggleTheme }) => (
  <footer className="unilend-footer">
    <div className="container">
      <div className="row g-4">
        <div className="col-md-4">
          <div className="unilend-footer-brand">
            Uni<span style={{ color: '#f97316' }}>Lend</span> AI
          </div>
          <p className="unilend-footer-text">
            The campus marketplace for students. Buy, sell, and rent items within your college community.
          </p>
        </div>
        <div className="col-md-2">
          <h6 className="unilend-footer-heading">Platform</h6>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {[['Browse', '/listings'], ['Sell an Item', '/add-listing'], ['Rent an Item', '/add-listing']].map(([label, to]) => (
              <li key={label} style={{ marginBottom: 6 }}>
                <Link to={to} className="unilend-footer-link">{label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="col-md-2">
          <h6 className="unilend-footer-heading">Account</h6>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {[['Login', '/login'], ['Sign Up', '/register'], ['My Profile', '/profile']].map(([label, to]) => (
              <li key={label} style={{ marginBottom: 6 }}>
                <Link to={to} className="unilend-footer-link">{label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="col-md-4">
          <h6 className="unilend-footer-heading">Categories</h6>
          <div className="d-flex flex-wrap gap-2">
            {['Books & Notes','Electronics','Stationery','Lab Equipment','Clothing','Sports & Fitness','Furniture','Other'].map(cat => (
              <Link
                key={cat}
                to={`/listings?category=${encodeURIComponent(cat)}`}
                className="unilend-footer-chip"
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <hr className="unilend-footer-divider" />
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
        <div className="unilend-footer-copy">© {new Date().getFullYear()} UniLend AI — Built for college students</div>
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          onClick={onToggleTheme}
        >
          <i className={`bi ${theme === 'dark' ? 'bi-sun' : 'bi-moon-stars'} me-1`} />
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
      </div>
    </div>
  </footer>
);

export default Footer;
