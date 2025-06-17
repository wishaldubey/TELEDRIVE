import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';

// Paths that require authentication
const PROTECTED_PATHS = ['/dashboard', '/api/files', '/api/download'];

export async function middleware(request: NextRequest) {
  // Check if the request is for a protected route
  const path = request.nextUrl.pathname;
  
  if (!PROTECTED_PATHS.some(prefix => path.startsWith(prefix))) {
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
    const payload = await verifyAuthToken(token);
    
    if (!payload) {
      // If token is invalid, redirect to login
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    // Token is valid, continue to the requested page
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
  ],
}; 