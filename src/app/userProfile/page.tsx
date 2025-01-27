'use client';

import { ProfileForm } from './components/ProfileForm';
import { useEffect, useState } from 'react';
import { Navbar } from '@/app/(landing)/components/Navbar';

export default function UserProfile() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar onLogin={() => {}} onSignup={() => {}} />
      
      <div className="container mx-auto py-8 px-4 flex justify-center">
        <div className="w-full max-w-4xl">
          <ProfileForm />
        </div>
      </div>
    </div>
  );
}
