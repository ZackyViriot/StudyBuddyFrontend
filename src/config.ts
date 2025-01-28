const getBaseUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return 'https://studybuddybackend-production.up.railway.app';
  }
  return 'http://localhost:8000';
};

const getFrontendUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return 'https://study-buddy-frontend-zeta.vercel.app';
  }
  return 'http://localhost:3000';
};

export const config = {
  API_URL: getBaseUrl(),
  FRONTEND_URL: getFrontendUrl(),
} as const; 