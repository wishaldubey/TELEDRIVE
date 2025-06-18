import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuthToken } from '@/lib/auth';

export async function GET() {
  try {
    // Get token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Verify and decode token to get user data
    const user = await verifyAuthToken(token);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid authentication token' },
        { status: 401 }
      );
    }
    
    // Return user data
    return NextResponse.json({
      success: true,
      user_id: user.user_id,
      username: user.username,
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      isPublicUser: user.isPublicUser || false,
      channel_id: user.channel_id || null
    });
    
  } catch (error) {
    console.error('Error getting user data:', error);
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    );
  }
} 