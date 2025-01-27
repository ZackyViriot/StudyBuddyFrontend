import { useTheme } from 'next-themes'
import { Button } from '@/app/userProfile/components/ui/button'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface NavbarProps {
  onLogin: () => void
  onSignup: () => void
}

export function Navbar({ onLogin, onSignup }: NavbarProps) {
  const { theme, setTheme } = useTheme()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const checkAuth = () => {
    const token = localStorage.getItem('token')
    setIsAuthenticated(!!token)
  }

  useEffect(() => {
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
    window.location.href = '/'
  }

  return (
    <nav className="w-full border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold hover:opacity-80">StudyBuddy</Link>
        
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? '🌞' : '🌙'}
          </Button>

          {isAuthenticated ? (
            <>
              <Link href="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <Link href="/study-groups">
                <Button variant="ghost">Study Groups</Button>
              </Link>
              <Link href="/calendar">
                <Button variant="ghost">Calendar</Button>
              </Link>
              <Link href="/profile">
                <Button variant="ghost">Profile</Button>
              </Link>
              <Button variant="destructive" onClick={handleLogout}>Logout</Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={onLogin}>Login</Button>
              <Button onClick={onSignup}>Sign Up</Button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
} 