import { NextRequest, NextResponse } from "next/server";
import { cookies } from 'next/headers';
import { verifyAuthToken } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
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
    
    // Get movie ID from request body
    const { movieId } = await req.json();
    
    if (!movieId) {
      return NextResponse.json(
        { success: false, error: 'Movie ID is required' },
        { status: 400 }
      );
    }
    
    try {
      // Connect to MongoDB
      const client = await connectToDatabase();
      const db = client.db("teledriveDB");
      const usersCollection = db.collection("users");
      
      // Create ObjectId from movieId
      const movieObjectId = new ObjectId(movieId);
      
      // Remove movie from watchlist
      const result = await usersCollection.updateOne(
        { user_id: user.user_id },
        { $pull: { watchlist: movieObjectId } }
      );
      
      return NextResponse.json({ success: true });
      
    } catch (error) {
      console.error('Error removing movie from watchlist:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update watchlist' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in watchlist remove endpoint:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
} 