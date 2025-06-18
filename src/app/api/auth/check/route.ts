import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  // Get auth token from cookies
  const token = request.cookies.get('auth_token')?.value;
  
  if (!token) {
    return NextResponse.json({ 
      authenticated: false 
    }, { status: 200 });
  }
  
  try {
    // Verify the auth token
    const user = await verifyAuthToken(token);
    
    if (!user) {
      return NextResponse.json({ 
        authenticated: false 
      }, { status: 200 });
    }
    
    // User is authenticated
    return NextResponse.json({ 
      authenticated: true,
      user: {
        user_id: user.user_id,
        username: user.username,
        channel_id: user.channel_id
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ 
      authenticated: false,
      error: 'Invalid authentication token' 
    }, { status: 200 });
  }
} 