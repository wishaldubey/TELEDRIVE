import { cookies } from 'next/headers';
import { jwtVerify, SignJWT } from 'jose';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from './mongodb';
import { AppUser } from '@/types';

// Hardcoded environment variables
const BOT_TOKEN = '8069923631:AAFuNciS0sd8WzCCH-Zx-acdd9l3rt5O3FA';
const JWT_SECRET = 'secure-jwt-secret-for-teledrive-project';

// Types for Telegram authentication data
export interface TelegramAuthData {
  id: number;
  first_name: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

// Function to verify Telegram authentication data
export async function verifyTelegramAuth(authData: Omit<TelegramAuthData, 'hash'> & { hash: string }): Promise<boolean> {
  const { hash, ...data } = authData;
  
  // Create a string of key=value pairs sorted alphabetically by key
  const dataCheckString = Object.keys(data)
    .sort()
    .map(key => `${key}=${data[key as keyof typeof data]}`)
    .join('\n');
  
  // Create the secret key by hashing the bot token
  const secretKey = crypto.createHash('sha256').update(BOT_TOKEN).digest();
  
  // Compute the hash of the data_check_string using the secret key
  const computedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');
  
  // The computed hash should match the hash provided in the auth data
  return computedHash === hash;
}

// Function to create a JWT token from Telegram authentication data
export async function createAuthToken(authData: TelegramAuthData | AppUser) {
  const secret = new TextEncoder().encode(JWT_SECRET);
  
  // Check if the input is TelegramAuthData or AppUser
  if ('auth_date' in authData) {
    // It's TelegramAuthData
    const token = await new SignJWT({ 
      id: authData.id,
      first_name: authData.first_name,
      username: authData.username,
      photo_url: authData.photo_url
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d') // Token expires in 7 days
      .sign(secret);
    
    return token;
  } else {
    // It's AppUser
    try {
      const token = jwt.sign(
        { user: authData },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      return token;
    } catch {
      return null;
    }
  }
}

// Function to verify a JWT token
export async function verifyAuthToken(token: string) {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

// Function to get the current user from cookies
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  
  if (!token) {
    return null;
  }
  
  try {
    const user = await verifyAuthToken(token);
    return user;
  } catch {
    return null;
  }
}

export async function getUserByUsername(username: string): Promise<AppUser | null> {
  try {
    const client = await connectToDatabase();
    const db = client.db('teledriveDB');
    const usersCollection = db.collection('users');
    
    const user = await usersCollection.findOne({ username });
    
    if (!user) {
      return null;
    }
    
    return {
      user_id: user.user_id,
      username: user.username,
      profile_photo_url: user.profile_photo_url,
    };
  } catch {
    return null;
  }
} 