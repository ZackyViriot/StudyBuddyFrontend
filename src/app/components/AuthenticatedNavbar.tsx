'use client';

import { useTheme } from 'next-themes';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export function AuthenticatedNavbar() {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const name = localStorage.getItem('userName');
    if (name) setUserName(name);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    router.push('/');
  };

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/dashboard" className="text-xl font-bold text-blue-600 dark:text-blue-400">
                StudyBuddy
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/dashboard"
                className="text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium"
              >
                Dashboard
              </Link>
              <Link
                href="/studyGroups"
                className="text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium"
              >
                Study Groups
              </Link>
              <Link
                href="/profile"
                className="text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium"
              >
                Profile
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
            >
              {theme === 'dark' ? '🌞' : '🌙'}
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
} 