import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname

  // Skip middleware for API routes and static assets
  if (path.startsWith('/api') || 
      path.startsWith('/_next') || 
      path.startsWith('/static') ||
      path === '/favicon.ico') {
    return NextResponse.next()
  }

  // Define public paths that don't require authentication
  const isPublicPath = path === '/' || path.startsWith('/public')

  // Get the token from cookies
  const token = request.cookies.get('token')?.value

  // If we're on a protected path and don't have a token, redirect to home
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL('/', request.url))
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
     * 5. api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
} 