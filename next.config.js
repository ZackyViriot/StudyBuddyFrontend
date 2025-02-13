/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  publicRuntimeConfig: {
    apiUrl: process.env.NODE_ENV === 'development' 
      ? 'http://localhost:8000'
      : 'https://studybuddybackend-production.up.railway.app'
  },
  async rewrites() {
    const apiUrl = process.env.NODE_ENV === 'development'
      ? 'http://localhost:8000'
      : 'https://studybuddybackend-production.up.railway.app';

    console.log('Using API URL:', apiUrl);

    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`
      },
      {
        source: '/auth/:path*',
        destination: `${apiUrl}/auth/:path*`
      }
    ]
  }
};

module.exports = nextConfig; 
