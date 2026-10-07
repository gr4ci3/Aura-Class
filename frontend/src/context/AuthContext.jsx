import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE } from '../config/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('aura_token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sync token to localStorage and fetch user data
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        localStorage.setItem('aura_token', token);
        try {
          const res = await fetch(`${API_BASE}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
          } else {
            // Token expired or invalid
            logout();
          }
        } catch (err) {
          console.error('Auth check failed:', err);
          // Don't log out on network failure, just set loading false
        }
      } else {
        localStorage.removeItem('aura_token');
        setUser(null);
      }
      setLoading(false);
    };

    initAuth();
  }, [token]);

  const login = async (email, password) => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      setToken(data.token);
      setUser(data.user);
      return data.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const register = async (userData) => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setToken(data.token);
      setUser(data.user);
      return { user: data.user, warning: data.warning };
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('aura_token');
  };

  // Helper method for authenticated API fetches
  const authenticatedFetch = async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    };

    try {
      const res = await fetch(`${API_BASE}${url}`, {
        ...options,
        headers
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Request failed');
      }
      return data;
    } catch (err) {
      // If token expired, log out automatically
      if (err.message.toLowerCase().includes('token') || err.message.toLowerCase().includes('unauthorized')) {
        logout();
      }
      throw err;
    }
  };

  const value = {
    user,
    token,
    loading,
    error,
    login,
    register,
    logout,
    authenticatedFetch,
    API_BASE
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
