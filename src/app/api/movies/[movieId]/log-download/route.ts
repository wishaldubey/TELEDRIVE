import { NextRequest, NextResponse } from "next/server";
import { cookies } from 'next/headers';
import { verifyAuthToken } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(
  req: NextRequest,
  { params }: { params: { movieId: string } }
) {
  try {
    // Verify authentication
    const cookieStore = cookies();
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
    
    const movieId = params.movieId;
    
    try {
      // Connect to MongoDB
      const client = await connectToDatabase();
      const db = client.db("teledriveDB");
      const moviesCollection = db.collection("movies");
      
      // Update movie to add user to downloads array if not already there
      const result = await moviesCollection.updateOne(
        { _id: new ObjectId(movieId) },
        { $addToSet: { downloads: user.user_id.toString() } }
      );
      
      if (result.matchedCount === 0) {
        return NextResponse.json(
          { success: false, error: 'Movie not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ success: true });
      
    } catch (error) {
      console.error('Error logging movie download:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to log download' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in log download endpoint:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
} 