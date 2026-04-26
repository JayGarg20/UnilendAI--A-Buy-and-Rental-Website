// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';

import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar       from './components/Navbar';
import Footer       from './components/Footer';
import HomePage     from './pages/HomePage';
import LoginPage    from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ListingsPage from './pages/ListingsPage';
import ListingDetail from './pages/ListingDetail';
import AddListing   from './pages/AddListing';
import EditListing  from './pages/EditListing';
import ProfilePage  from './pages/ProfilePage';
import MyListings   from './pages/MyListings';
import MyOrders     from './pages/MyOrders';
import WishlistPage from './pages/WishlistPage';
import AIAssistantWidget from './components/AIAssistantWidget';

// Protected route wrapper
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner-border text-primary" /></div>;
  return user ? children : <Navigate to="/login" replace />;
};

// Redirect logged-in users away from auth pages
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner-border text-primary" /></div>;
  return user ? <Navigate to="/" replace /> : children;
};

const AppContent = () => {
  const [theme, setTheme] = React.useState(() => localStorage.getItem('unilend_theme') || 'dark');

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('unilend_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
  <Router>
    <Navbar theme={theme} onToggleTheme={toggleTheme} />
    <main style={{ minHeight: 'calc(100vh - 130px)' }}>
      <Routes>
        <Route path="/"              element={<HomePage />} />
        <Route path="/listings"      element={<ListingsPage />} />
        <Route path="/listings/:id"  element={<ListingDetail />} />

        <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

        <Route path="/add-listing"       element={<PrivateRoute><AddListing /></PrivateRoute>} />
        <Route path="/edit-listing/:id"  element={<PrivateRoute><EditListing /></PrivateRoute>} />
        <Route path="/profile"           element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route path="/profile/:id"       element={<ProfilePage />} />
        <Route path="/my-listings"       element={<PrivateRoute><MyListings /></PrivateRoute>} />
        <Route path="/my-orders"         element={<PrivateRoute><MyOrders /></PrivateRoute>} />
        <Route path="/wishlist"          element={<PrivateRoute><WishlistPage /></PrivateRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
    <Footer theme={theme} onToggleTheme={toggleTheme} />
    <AIAssistantWidget />
    <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar={false} />
  </Router>
  );
};

const App = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;
