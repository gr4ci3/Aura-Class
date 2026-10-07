// Central API Base URL Configuration for Frontend
// Reads directly from Vite environment variables during build / deployment.
// Supported env variables:
// - VITE_API_BASE_URL (Recommended: e.g. https://your-backend-api.onrender.com/api)
// - VITE_API_URL (Alternative alias)
export const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000/api'
).replace(/\/+$/, '');

export default API_BASE;
