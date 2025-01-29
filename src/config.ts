const getBaseUrl = () => {
  // Check if we're in development mode
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:8000';
  }
  // Production mode
  return 'https://studybuddybackend-production.up.railway.app';
};

const getFrontendUrl = () => {
  // Check if we're in development mode
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }
  // Production mode
  return 'https://study-buddy-frontend-zeta.vercel.app';
};

export const config = {
  API_URL: getBaseUrl(),
  FRONTEND_URL: getFrontendUrl(),
} as const;

// Log the current configuration
if (typeof window !== 'undefined') {
  console.log('Current API URL:', getBaseUrl());
  console.log('Current Frontend URL:', getFrontendUrl());
} 