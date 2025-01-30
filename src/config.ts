import axios from 'axios';

const getBaseUrl = () => {
  // Check if we're in development mode
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:8000';
  }
  // Default to production mode if NODE_ENV is undefined
  return 'https://studybuddybackend-production.up.railway.app';
};

const getFrontendUrl = () => {
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

// Remove these as they should be set by the server, not the client
// axios.defaults.headers.common['Access-Control-Allow-Origin'] = '*';
// axios.defaults.headers.common['Access-Control-Allow-Credentials'] = 'true';

// Add proper content type and accept headers
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.headers.common['Accept'] = 'application/json';

// Ensure URLs don't have trailing slashes
export const config = {
  API_URL: getBaseUrl().replace(/\/$/, ''),
  FRONTEND_URL: getFrontendUrl().replace(/\/$/, ''),
  ENV: getEnvironment(),
} as const;

// Log the current configuration
if (typeof window !== 'undefined') {
  console.log('Current environment:', getEnvironment());
  console.log('Current API URL:', getBaseUrl());
  console.log('Current Frontend URL:', getFrontendUrl());
} 