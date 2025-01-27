'use client';

import { useEffect } from 'react';
import { ProfileForm } from './components/ProfileForm';
import { Navbar } from '@/app/(landing)/components/Navbar';

export default function UserProfile() {
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/';
    }
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
