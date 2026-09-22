import axios from 'axios';

// In dev, VITE_API_BASE_URL is unset → uses the Vite proxy ("/api").
// In production, set VITE_API_BASE_URL to the backend origin, e.g.
//   https://freelancer-marketplace-backend-xxxx.onrender.com
// and requests go to "<that origin>/api".
const API_BASE = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api`
  : '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach JWT token when available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Session expired or invalid token - clear and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Avoid redirect loop if already on an auth page
      const path = window.location.pathname;
      if (path !== '/login' && path !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
