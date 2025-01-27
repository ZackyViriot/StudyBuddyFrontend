'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { Navbar } from '@/app/(landing)/components/Navbar';
import { Footer } from '@/app/(landing)/components/Footer';
import { Hero } from '@/app/(landing)/components/Hero';
import { Features } from '@/app/(landing)/components/Features';
import { About } from '@/app/(landing)/components/About';
import { Pricing } from '@/app/(landing)/components/Pricing';
import { LoginForm } from '@/app/(landing)/components/LoginForm';
import { SignupForm } from '@/app/(landing)/components/SignupForm';

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null; // or a loading skeleton
  }

  const handleGetStarted = () => {
    setShowSignup(true);
  };

  const handleLogin = () => {
    setShowLogin(true);
  };

  return (
    <main className="min-h-screen">
      <Navbar onLogin={handleLogin} onSignup={handleGetStarted} />
      <Hero onGetStarted={handleGetStarted} onLogin={handleLogin} />
      <Features />
      <About />
      <Pricing onGetStarted={handleGetStarted} />
      <Footer />

      <AnimatePresence>
        {showLogin && (
          <LoginForm
            onClose={() => setShowLogin(false)}
            onSwitchToSignup={() => {
              setShowLogin(false);
              setShowSignup(true);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSignup && (
          <SignupForm
            onClose={() => setShowSignup(false)}
            onSwitchToLogin={() => {
              setShowSignup(false);
              setShowLogin(true);
            }}
          />
        )}
      </AnimatePresence>
    </main>
  );
} 