import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { verifyAuthToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Get auth token from cookies
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }

    // Verify auth token
    const user = await verifyAuthToken(token);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Invalid authentication token' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { movieIds } = body;

    if (!movieIds || !Array.isArray(movieIds) || movieIds.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Valid movie IDs array is required' 
      }, { status: 400 });
    }

    // Connect to the database
    const client = await connectToDatabase();
    const db = client.db('teledriveDB');
    const moviesCollection = db.collection('movies');

    // Fetch movies
    const movies = await moviesCollection.find({
      _id: { $in: movieIds.map(id => id.toString()) }
    }).toArray();

    return NextResponse.json({
      success: true,
      movies
    });
  } catch (error) {
    console.error('Error fetching movie details:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
} 