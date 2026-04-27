// src/pages/ListingsPage.js
import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getListings } from '../utils/api';
import ListingCard from '../components/ListingCard';

const CATEGORIES = ['Books & Notes','Electronics','Stationery','Lab Equipment','Clothing','Sports & Fitness','Furniture','Other'];
const CONDITIONS = ['New','Like New','Good','Fair','Poor'];
const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Newest First' },
  { value: 'createdAt',  label: 'Oldest First' },
  { value: 'sellPrice',  label: 'Price: Low to High' },
  { value: '-sellPrice', label: 'Price: High to Low' },
];

const ListingsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);

  // Filters from URL
  const [filters, setFilters] = useState({
    search:      searchParams.get('search')      || '',
    category:    searchParams.get('category')    || '',
    listingType: searchParams.get('listingType') || '',
    condition:   searchParams.get('condition')   || '',
    minPrice:    searchParams.get('minPrice')    || '',
    maxPrice:    searchParams.get('maxPrice')    || '',
    sort:        searchParams.get('sort')        || '-createdAt',
    page:        Number(searchParams.get('page')) || 1,
  });

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
      const { data } = await getListings(params);
      setListings(data.listings);
      setPagination(data.pagination);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  // Sync filters → URL
  useEffect(() => {
    const params = {};
    Object.entries(filters).forEach(([k, v]) => { if (v && !(k === 'page' && v === 1)) params[k] = v; });
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  const setFilter = (key, value) => setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  const clearFilters = () => setFilters({ search: '', category: '', listingType: '', condition: '', minPrice: '', maxPrice: '', sort: '-createdAt', page: 1 });

  const activeFilterCount = [filters.category, filters.listingType, filters.condition, filters.minPrice, filters.maxPrice]
    .filter(Boolean).length;

  return (
    <div className="container" style={{ padding: '32px 12px' }}>
      <div className="row g-4">
        {/* ── Sidebar ──────────────────────────── */}
        <div className="col-lg-3 d-none d-lg-block">
          <div className="filter-panel">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem' }}>
                Filters {activeFilterCount > 0 && <span className="badge bg-primary ms-1" style={{ fontSize: '0.7rem' }}>{activeFilterCount}</span>}
              </span>
              {activeFilterCount > 0 && (
                <button onClick={clearFilters} className="btn btn-link btn-sm p-0 text-danger" style={{ fontSize: '0.82rem' }}>
                  Clear all
                </button>
              )}
            </div>

            {/* Category */}
            <div className="mb-4">
              <h6>Category</h6>
              {CATEGORIES.map(cat => (
                <div key={cat} className="form-check mb-1">
                  <input
                    className="form-check-input" type="radio" name="category"
                    id={`cat-${cat}`} checked={filters.category === cat}
                    onChange={() => setFilter('category', filters.category === cat ? '' : cat)}
                  />
                  <label className="form-check-label" htmlFor={`cat-${cat}`} style={{ fontSize: '0.88rem', cursor: 'pointer' }}>
                    {cat}
                  </label>
                </div>
              ))}
            </div>

            {/* Type */}
            <div className="mb-4">
              <h6>Listing Type</h6>
              {[['sell','For Sale'], ['rent','For Rent'], ['both','Both']].map(([val, label]) => (
                <div key={val} className="form-check mb-1">
                  <input
                    className="form-check-input" type="radio" name="listingType"
                    id={`type-${val}`} checked={filters.listingType === val}
                    onChange={() => setFilter('listingType', filters.listingType === val ? '' : val)}
                  />
                  <label className="form-check-label" htmlFor={`type-${val}`} style={{ fontSize: '0.88rem', cursor: 'pointer' }}>
                    {label}
                  </label>
                </div>
              ))}
            </div>

            {/* Condition */}
            <div className="mb-4">
              <h6>Condition</h6>
              {CONDITIONS.map(cond => (
                <div key={cond} className="form-check mb-1">
                  <input
                    className="form-check-input" type="checkbox" id={`cond-${cond}`}
                    checked={filters.condition === cond}
                    onChange={() => setFilter('condition', filters.condition === cond ? '' : cond)}
                  />
                  <label className="form-check-label" htmlFor={`cond-${cond}`} style={{ fontSize: '0.88rem', cursor: 'pointer' }}>
                    {cond}
                  </label>
                </div>
              ))}
            </div>

            {/* Price range */}
            <div className="mb-3">
              <h6>Price Range (₹)</h6>
              <div className="d-flex gap-2">
                <input
                  type="number" className="form-control form-control-sm" placeholder="Min"
                  value={filters.minPrice}
                  onChange={e => setFilter('minPrice', e.target.value)}
                />
                <input
                  type="number" className="form-control form-control-sm" placeholder="Max"
                  value={filters.maxPrice}
                  onChange={e => setFilter('maxPrice', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Main Content ─────────────────────── */}
        <div className="col-lg-9">
          {/* Top bar */}
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
            <div>
              <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.5rem', marginBottom: 2 }}>
                {filters.category || 'All Listings'}
              </h1>
              {!loading && (
                <p style={{ fontSize: '0.88rem', color: '#64748b', margin: 0 }}>
                  {pagination.total || 0} item{pagination.total !== 1 ? 's' : ''} found
                </p>
              )}
            </div>
            <div className="d-flex gap-2 flex-wrap">
              {/* Mobile filter toggle */}
              <button
                className="btn btn-outline-secondary btn-sm d-lg-none"
                data-bs-toggle="offcanvas" data-bs-target="#filterOffcanvas"
              >
                <i className="bi bi-funnel me-1" />Filters
                {activeFilterCount > 0 && <span className="badge bg-primary ms-1">{activeFilterCount}</span>}
              </button>
              <select
                className="form-select form-select-sm"
                style={{ width: 'auto', minWidth: 170 }}
                value={filters.sort}
                onChange={e => setFilter('sort', e.target.value)}
              >
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Active filter chips */}
          {activeFilterCount > 0 && (
            <div className="d-flex flex-wrap gap-2 mb-3">
              {filters.category && (
                <span className="badge bg-light text-dark border" style={{ fontWeight: 500, padding: '6px 12px', borderRadius: 20 }}>
                  {filters.category}
                  <button onClick={() => setFilter('category', '')} className="btn-close btn-close-sm ms-2" style={{ fontSize: '0.5rem' }} />
                </span>
              )}
              {filters.listingType && (
                <span className="badge bg-light text-dark border" style={{ fontWeight: 500, padding: '6px 12px', borderRadius: 20 }}>
                  {filters.listingType === 'sell' ? 'For Sale' : filters.listingType === 'rent' ? 'For Rent' : 'Both'}
                  <button onClick={() => setFilter('listingType', '')} className="btn-close btn-close-sm ms-2" style={{ fontSize: '0.5rem' }} />
                </span>
              )}
              {filters.condition && (
                <span className="badge bg-light text-dark border" style={{ fontWeight: 500, padding: '6px 12px', borderRadius: 20 }}>
                  {filters.condition}
                  <button onClick={() => setFilter('condition', '')} className="btn-close btn-close-sm ms-2" style={{ fontSize: '0.5rem' }} />
                </span>
              )}
            </div>
          )}

          {/* Grid */}
          {loading ? (
            <div className="loading-screen"><div className="spinner-border text-primary" /></div>
          ) : listings.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-search fs-1 text-muted d-block mb-3" />
              <h5 style={{ fontFamily: 'Syne, sans-serif' }}>No listings found</h5>
              <p className="text-muted">Try adjusting your filters or search query.</p>
              <button onClick={clearFilters} className="btn btn-primary px-4">Clear Filters</button>
            </div>
          ) : (
            <>
              <div className="row g-3">
                {listings.map(listing => (
                  <div key={listing._id} className="col-sm-6 col-xl-4">
                    <ListingCard listing={listing} />
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="d-flex justify-content-center mt-4">
                  <nav>
                    <ul className="pagination pagination-sm">
                      <li className={`page-item ${filters.page <= 1 ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={() => setFilter('page', filters.page - 1)}>‹</button>
                      </li>
                      {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                        .filter(p => p === 1 || p === pagination.pages || Math.abs(p - filters.page) <= 2)
                        .map((p, idx, arr) => (
                          <React.Fragment key={p}>
                            {idx > 0 && arr[idx - 1] !== p - 1 && <li className="page-item disabled"><span className="page-link">…</span></li>}
                            <li className={`page-item ${filters.page === p ? 'active' : ''}`}>
                              <button className="page-link" onClick={() => setFilter('page', p)}>{p}</button>
                            </li>
                          </React.Fragment>
                        ))}
                      <li className={`page-item ${filters.page >= pagination.pages ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={() => setFilter('page', filters.page + 1)}>›</button>
                      </li>
                    </ul>
                  </nav>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Mobile filter offcanvas ──────────────── */}
      <div className="offcanvas offcanvas-start d-lg-none" id="filterOffcanvas" style={{ maxWidth: 300 }}>
        <div className="offcanvas-header">
          <h5 className="offcanvas-title" style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>Filters</h5>
          <button className="btn-close" data-bs-dismiss="offcanvas" />
        </div>
        <div className="offcanvas-body">
          {/* Same filter content for mobile - abbreviated */}
          <div className="mb-3">
            <h6 style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b' }}>Category</h6>
            {CATEGORIES.map(cat => (
              <div key={cat} className="form-check mb-1">
                <input className="form-check-input" type="radio" name="mcat" id={`mcat-${cat}`}
                  checked={filters.category === cat}
                  onChange={() => setFilter('category', filters.category === cat ? '' : cat)} />
                <label className="form-check-label" htmlFor={`mcat-${cat}`} style={{ fontSize: '0.88rem' }}>{cat}</label>
              </div>
            ))}
          </div>
          <div className="mb-3">
            <h6 style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b' }}>Type</h6>
            {[['sell','For Sale'],['rent','For Rent'],['both','Both']].map(([val, label]) => (
              <div key={val} className="form-check mb-1">
                <input className="form-check-input" type="radio" name="mtype" id={`mtype-${val}`}
                  checked={filters.listingType === val}
                  onChange={() => setFilter('listingType', filters.listingType === val ? '' : val)} />
                <label className="form-check-label" htmlFor={`mtype-${val}`} style={{ fontSize: '0.88rem' }}>{label}</label>
              </div>
            ))}
          </div>
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="btn btn-outline-danger btn-sm w-100 mt-2">Clear All Filters</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListingsPage;
