// src/utils/api.js
import axios from 'axios';

const isLocalDev = typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname);
const resolvedBaseURL = process.env.REACT_APP_API_URL || (isLocalDev ? 'http://localhost:5001/api' : '/api');

const API = axios.create({
  baseURL: resolvedBaseURL
});

// Attach token from localStorage on every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('unilend_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const registerUser  = (data) => API.post('/auth/register', data);
export const loginUser     = (data) => API.post('/auth/login', data);
export const getMe         = ()     => API.get('/auth/me');

// Listings
export const getListings     = (params) => API.get('/listings', { params });
export const getListing      = (id)     => API.get(`/listings/${id}`);
export const createListing   = (data)   => API.post('/listings', data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const updateListing   = (id, data) => API.put(`/listings/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteListing   = (id)     => API.delete(`/listings/${id}`);
export const toggleWishlist  = (id)     => API.post(`/listings/${id}/wishlist`);
export const getMyListings   = ()       => API.get('/listings/user/my-listings');

// Orders
export const createOrder     = (data)   => API.post('/orders', data);
export const getMyOrders     = ()       => API.get('/orders/my-orders');
export const getMySales      = ()       => API.get('/orders/my-sales');
export const getListingOrders = (listingId) => API.get(`/orders/listing/${listingId}`);
export const updateOrderStatus = (id, status) => API.patch(`/orders/${id}/status`, { status });
export const rateOrder       = (id, data)     => API.post(`/orders/${id}/rate`, data);

// Users
export const getUserProfile  = (id)     => API.get(`/users/${id}`);
export const updateProfile   = (data)   => API.put('/users/me/update', data);
export const changePassword  = (data)   => API.put('/users/me/password', data);
export const trackCategory   = (category) => API.post('/users/me/track-category', { category });

// AI
export const getRecommendations = () => API.get('/ai/recommendations');
export const getTrending        = () => API.get('/ai/trending');
export const suggestPrice       = (data) => API.post('/ai/suggest-price', data);
export const askAssistant       = (data) => API.post('/ai/assistant', data);
export const askAgent           = (data) => API.post('/ai/agent', data);

export default API;
