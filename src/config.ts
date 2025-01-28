const getBaseUrl = () => {
  // Check if we're in the browser
  if (typeof window !== 'undefined') {
    // Check if we're in production (vercel deployment)
    if (window.location.hostname !== 'localhost') {
      return 'https://studybuddybackend-production.up.railway.app';
    }
    // For local development
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  }
  // Server-side
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
};

const getFrontendUrl = () => {
  if (typeof window !== 'undefined') {
    if (window.location.hostname !== 'localhost') {
      return 'https://study-buddy-frontend-zeta.vercel.app';
    }
    // For local development
    return process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
  }
  return process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
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