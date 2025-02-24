'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { config } from '@/config';
import Cookies from 'js-cookie';

interface LoginFormProps {
  onClose: () => void;
  onSwitchToSignup: () => void;
}

interface LoginError {
  response?: {
    data?: {
      message?: string;
    };
    status?: number;
  };
  message?: string;
}

export function LoginForm({ onClose, onSwitchToSignup }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    console.log('Login attempt with config:', {
      apiUrl: config.API_URL,
      baseUrl: config.BASE_URL,
      env: process.env.NODE_ENV,
      nextPublicApiUrl: process.env.NEXT_PUBLIC_API_URL
    });

    try {
      const loginUrl = `${config.API_URL}/api/auth/login`;
      console.log('Making login request to:', loginUrl);

      const response = await config.axios.post(loginUrl, {
        email: formData.email,
        password: formData.password
      });

      if (response.data.access_token) {
        try {
          // Store token in both localStorage and cookie
          localStorage.setItem('token', response.data.access_token);
          Cookies.set('token', response.data.access_token, { 
            expires: 7, // 7 days
            path: '/',
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
          });

          if (response.data.user) {
            const userData = JSON.stringify(response.data.user);
            localStorage.setItem('user', userData);
            Cookies.set('user', userData, { 
              expires: 7,
              path: '/',
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax'
            });
          }

          // Dispatch auth change event
          window.dispatchEvent(new Event('authStateChanged'));
          
          // Close the form first
          onClose();
          
          // Get the callback URL from search params or default to /dashboard
          const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
          
          // Add a small delay before redirecting
          setTimeout(() => {
            try {
              router.push(callbackUrl);
            } catch (routerError) {
              console.error('Router push failed:', routerError);
              // Fallback to window.location if router fails
              window.location.href = callbackUrl;
            }
          }, 100);
        } catch (storageError) {
          console.error('Storage error:', storageError);
          // If localStorage fails, still try to redirect
          onClose();
          const callbackUrl = searchParams.get('callbackUrl') || '/teams';
          window.location.href = callbackUrl;
        }
      } else {
        throw new Error('No access token received');
      }
    } catch (error) {
      const err = error as LoginError;
      console.error('Login failed:', err);
      
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message === 'Network Error') {
        setError('Unable to connect to the server. Please check your internet connection.');
      } else {
        setError('Failed to log in. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        className="bg-white dark:bg-gray-800 w-full max-w-md rounded-xl shadow-xl p-4 sm:p-6 my-8 mx-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Welcome back</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Please sign in to your account
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
              required
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </motion.button>

          <div className="text-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              type="button"
              onClick={onSwitchToSignup}
              className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300"
            >
              Don&apos;t have an account? Sign up
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
} 