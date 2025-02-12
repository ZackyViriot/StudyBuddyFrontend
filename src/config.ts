import axios from 'axios';

const getApiUrl = () => {
  // Check if we're in development mode
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:8000';
  }
  // Production URL
  return 'https://studybuddybackend-production.up.railway.app';
};

export const getFrontendUrl = () => {
  // Check if we're in development mode
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }
  // Default to production mode if NODE_ENV is undefined
  return 'https://study-buddy-frontend-zeta.vercel.app';
};

const getEnvironment = () => {
  return process.env.NODE_ENV || 'production';
};

// Configure axios defaults
axios.defaults.withCredentials = true;

// Configure axios interceptors
axios.interceptors.request.use((config) => {
  // Get token from localStorage
  const token = localStorage.getItem('token');
  
  // If token exists, add it to headers
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Ensure proper headers are set
  config.headers['Content-Type'] = 'application/json';
  config.headers.Accept = 'application/json';
  
  return config;
});

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token or reauthenticate
        const token = localStorage.getItem('token');
        if (!token) {
          // Redirect to login if no token
          window.location.href = '/auth/signin';
          return Promise.reject(error);
        }

        // Retry the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return axios(originalRequest);
      } catch (refreshError) {
        // If refresh fails, redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/auth/signin';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Ensure URLs don't have trailing slashes
export const config = {
  API_URL: getApiUrl(),
  FRONTEND_URL: getFrontendUrl().replace(/\/$/, ''),
  ENV: getEnvironment(),
} as const;

// Log the current configuration
if (typeof window !== 'undefined') {
  console.log('Current environment:', getEnvironment());
  console.log('Current API URL:', getApiUrl());
  console.log('Current Frontend URL:', getFrontendUrl());
} 