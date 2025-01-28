const getBaseUrl = () => {
  // Use NEXT_PUBLIC prefix to make it available on the client side
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
};

const getFrontendUrl = () => {
  return process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
};

export const config = {
  API_URL: getBaseUrl(),
  FRONTEND_URL: getFrontendUrl(),
} as const; 