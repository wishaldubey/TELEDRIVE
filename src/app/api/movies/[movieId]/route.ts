import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { connectToDatabase } from '@/lib/db/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: { movieId: string } }
) {
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
    
    // Verify authentication
    const user = await verifyAuthToken(token);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid authentication token' },
        { status: 401 }
      );
    }
    
    // Connect to MongoDB
    const client = await connectToDatabase();
    const db = client.db('teledriveDB');
    const moviesCollection = db.collection('movies');
    
    // Get movieId from params - this is a server component so we don't need React.use()
    const { movieId } = params;
    
    // Validate movieId format
    if (!ObjectId.isValid(movieId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid movie ID format' },
        { status: 400 }
      );
    }
    
    // Find movie by ID
    const movie = await moviesCollection.findOne({ 
      _id: new ObjectId(movieId) 
    });
    
    if (!movie) {
      return NextResponse.json(
        { success: false, error: 'Movie not found' },
        { status: 404 }
      );
    }
    
    // Convert ObjectId to string for proper JSON serialization
    const movieWithStringId = {
      ...movie,
      _id: movie._id.toString()
    };
    
    return NextResponse.json(movieWithStringId);
    
  } catch (error) {
    console.error('Error getting movie details:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve movie details' },
      { status: 500 }
    );
  }
} 