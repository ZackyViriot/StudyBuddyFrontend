import axios from 'axios';

const getBaseUrl = () => {
  // Check if we're in the browser
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost';
    if (isLocalhost) {
      console.log('Local environment detected, using localhost:8000');
      return 'http://localhost:8000';
    }
  }
  
  console.log('Production environment detected, using railway app URL');
  return 'https://studybuddybackend-production.up.railway.app';
};

export const getFrontendUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3000'
    : 'https://study-buddy-frontend-zeta.vercel.app';
};

const getEnvironment = () => {
  if (typeof window !== 'undefined') {
    return window.location.hostname === 'localhost' ? 'development' : 'production';
  }
  return process.env.NODE_ENV || 'production';
};

// Configure axios defaults
axios.defaults.withCredentials = true;

// Create an axios instance with default config
const axiosInstance = axios.create({
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Configure axios interceptors
axiosInstance.interceptors.request.use((config) => {
  // Get token from localStorage
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  // Log the request URL and environment
  console.log('Making request:', {
    url: config.url,
    method: config.method,
    environment: getEnvironment(),
    baseURL: config.baseURL,
    hasToken: !!token
  });
  
  // If token exists, add it to headers
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

axiosInstance.interceptors.response.use(
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
        return axiosInstance(originalRequest);
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

// Get the base URL with environment detection
const baseUrl = getBaseUrl();
console.log('Configured base URL:', baseUrl);

// Ensure URLs don't have trailing slashes
export const config = {
  BASE_URL: baseUrl.replace(/\/$/, ''),
  API_URL: baseUrl.replace(/\/$/, ''),
  FRONTEND_URL: getFrontendUrl().replace(/\/$/, ''),
  ENV: getEnvironment(),
  axios: axiosInstance
} as const;

// Log the current configuration
if (typeof window !== 'undefined') {
  console.log('Current configuration:', {
    environment: getEnvironment(),
    hostname: window.location.hostname,
    baseUrl: getBaseUrl(),
    frontendUrl: getFrontendUrl(),
    hasToken: !!localStorage.getItem('token')
  });
} 