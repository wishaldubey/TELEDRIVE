import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

// Use environment variable for JWT secret with fallback
const JWT_SECRET = process.env.JWT_SECRET || 'secure-jwt-secret-for-teledrive-project';

// User interface
export interface User {
  user_id: number;
  username: string;
  first_name?: string;
  last_name?: string;
}

/**
 * Verify JWT token
 * @param token - JWT token
 * @returns User data if valid, null otherwise
 */
export async function verifyAuthToken(token: string): Promise<User | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    
    return {
      user_id: payload.user_id as number,
      username: payload.username as string,
      first_name: payload.first_name as string || '',
      last_name: payload.last_name as string || ''
    };
  } catch {
    return null;
  }
}

/**
 * Get the current user from cookies
 * @returns User data if authenticated, null otherwise
 */
export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  
  if (!token) {
    return null;
  }
  
  return verifyAuthToken(token);
} 