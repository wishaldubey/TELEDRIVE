import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SignJWT } from 'jose';
import bcrypt from 'bcrypt';
import { connectToDatabase } from '@/lib/db/mongodb';

// JWT secret
const JWT_SECRET = 'secure-jwt-secret-for-teledrive-project';

export async function POST(request: Request) {
  try {
    // Extract username and password from request body
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Connect to the database
    const client = await connectToDatabase();
    const db = client.db('teledriveDB');
    const usersCollection = db.collection('users');

    // Handle both formats of username (with and without the "user-" prefix)
    let user = null;
    
    // First, try with the username as provided
    user = await usersCollection.findOne({ username });
    
    // If not found, try with "user-" prefix
    if (!user && !username.startsWith('user-')) {
      user = await usersCollection.findOne({ username: `user-${username}` });
    }
    
    // If still not found, try without "user-" prefix
    if (!user && username.startsWith('user-')) {
      const unprefixedUsername = username.substring(5); // Remove "user-" prefix
      user = await usersCollection.findOne({ user_id: Number(unprefixedUsername) });
    }
    
    // Try with numeric user_id
    if (!user && !isNaN(Number(username))) {
      user = await usersCollection.findOne({ user_id: Number(username) });
    }

    if (!user) {
      console.log(`User not found for username: ${username}`);
      return NextResponse.json(
        { success: false, error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      console.log(`Invalid password for username: ${username}`);
      return NextResponse.json(
        { success: false, error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Create JWT token
    const secret = new TextEncoder().encode(JWT_SECRET);
    
    const token = await new SignJWT({
      user_id: user.user_id,
      username: user.username
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d') // Token expires in 7 days
      .sign(secret);

    // Set the auth token as a secure cookie
    const cookieStore = await cookies();
    cookieStore.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
      sameSite: 'strict'
    });

    console.log(`Login successful for user: ${user.username}`);
    return NextResponse.json({
      success: true,
      user: {
        user_id: user.user_id,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    );
  }
} 