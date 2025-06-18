import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';

// Paths that require authentication
const PROTECTED_PATHS = ['/dashboard', '/api/files', '/api/download'];
// Paths that require Drive Mode access (require channel_id)
const DRIVE_MODE_PATHS = ['/dashboard', '/api/files'];
// Paths that both user types can access (but still need auth)
const CINEMA_PATHS = ['/cinema', '/api/movies'];

export async function middleware(request: NextRequest) {
  // Check if the request is for a protected route
  const path = request.nextUrl.pathname;
  
  // If not a protected path, continue
  if (!PROTECTED_PATHS.some(prefix => path.startsWith(prefix)) && 
      !CINEMA_PATHS.some(prefix => path.startsWith(prefix))) {
    return NextResponse.next();
  }

  // Get the token from cookies
  const token = request.cookies.get('auth_token')?.value;
  
  // If there's no token, redirect to login
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  try {
    // Verify the token
    const user = await verifyAuthToken(token);
    
    if (!user) {
      // If token is invalid, redirect to login
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    // Check if the user is trying to access Drive Mode paths but doesn't have a channel_id
    if (DRIVE_MODE_PATHS.some(prefix => path.startsWith(prefix)) && !user.channel_id) {
      // Redirect to cinema if the user is a public user
      const cinemaUrl = new URL('/cinema', request.url);
      return NextResponse.redirect(cinemaUrl);
    }

    // Token is valid and user has appropriate access, continue to the requested page
    return NextResponse.next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    // If there's an error, redirect to login
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }
}

// Only run middleware on the defined paths
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/files/:path*',
    '/api/download/:path*',
    '/cinema/:path*',
    '/api/movies/:path*',
  ],
}; 