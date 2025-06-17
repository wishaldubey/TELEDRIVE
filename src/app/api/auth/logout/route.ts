import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    // Clear the auth cookie
    const cookieStore = await cookies();
    cookieStore.set({
      name: 'auth_token',
      value: '',
      expires: new Date(0), // Set expiry in the past to delete the cookie
      path: '/',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ success: false, error: 'Failed to logout' }, { status: 500 });
  }
} 