'use client';

import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sun, MoonStar } from 'lucide-react'

interface NavbarProps {
  onLogin?: () => void;
  onSignup?: () => void;
}

export function Navbar({ onLogin, onSignup }: NavbarProps) {
  const { theme, setTheme } = useTheme()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  const checkAuth = () => {
    const token = localStorage.getItem('token')
    setIsAuthenticated(!!token)
  }

  useEffect(() => {
    setMounted(true)
    // Initial check
    checkAuth()

    // Listen for storage changes
    window.addEventListener('storage', checkAuth)
    
    // Listen for custom auth event
    window.addEventListener('authStateChanged', checkAuth)

    return () => {
      window.removeEventListener('storage', checkAuth)
      window.removeEventListener('authStateChanged', checkAuth)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    setIsAuthenticated(false)
    // Dispatch auth change event
    window.dispatchEvent(new Event('authStateChanged'))
    router.push('/')
  }

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) return null

  return (
    <nav className="w-full border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-40">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold hover:opacity-80">StudyBuddy</Link>
        
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="rounded-full w-9 h-9 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
          >
            {theme === 'dark' ? (
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />
            ) : (
              <MoonStar className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>

          {isAuthenticated ? (
            <>
              <Link href="/teams">
                <Button variant="ghost">Teams</Button>
              </Link>
              <Link href="/studyGroups">
                <Button variant="ghost">Study Groups</Button>
              </Link>
              <Link href="/calendar">
                <Button variant="ghost">Calendar</Button>
              </Link>
              <Link href="/userProfile">
                <Button variant="ghost">Profile</Button>
              </Link>
              <Button variant="destructive" onClick={handleLogout}>Logout</Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={onLogin}>Login</Button>
              <Button variant="default" onClick={onSignup}>Sign up</Button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
} 