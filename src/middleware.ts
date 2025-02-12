import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname

  // Define public paths that don't require authentication
  const isPublicPath = path === '/' || 
    path === '/auth/signin' || 
    path === '/auth/signup' || 
    path.startsWith('/_next') || 
    path.startsWith('/api/auth')

  // Get the token from the cookies
  const token = request.cookies.get('token')?.value || ''

  // If the path is public and user is logged in, redirect to teams page
  if (isPublicPath && token) {
    return NextResponse.redirect(new URL('/teams', request.url))
  }

  // If the path is protected and user is not logged in, redirect to signin page
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }

  return NextResponse.next()
}

// Configure the paths that middleware will run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. _next/static (static files)
     * 2. _next/image (image optimization files)
     * 3. favicon.ico (favicon file)
     * 4. public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
} 