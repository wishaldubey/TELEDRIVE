import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { isSuperAdmin } from '@/lib/client-auth';
import { cookies } from 'next/headers';
import { connectToDatabase } from '@/lib/db/mongodb';
import { ObjectId } from 'mongodb';

export async function PATCH(
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
    
    // Check if user is a super admin
    if (!isSuperAdmin(user)) {
      return NextResponse.json(
        { success: false, error: 'Permission denied. Super admin access required.' },
        { status: 403 }
      );
    }

    // Parse request body
    const updateData = await request.json();
    const allowedFields = ['title', 'overview', 'genres', 'poster_url', 'release_year', 'vote_average', 'runtime'];
    
    // Filter out any fields that are not allowed to be updated
    const filteredUpdate = Object.keys(updateData)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updateData[key];
        return obj;
      }, {} as Record<string, any>);
    
    // Add metadata_fetched flag if poster_url is provided
    if (updateData.poster_url) {
      filteredUpdate.metadata_fetched = true;
    }
    
    // Add updatedAt timestamp
    filteredUpdate.updatedAt = new Date();
    
    // Connect to MongoDB
    const client = await connectToDatabase();
    const db = client.db('teledriveDB');
    const moviesCollection = db.collection('movies');
    
    // Get movieId from params
    const { movieId } = params;
    
    // Validate movieId format
    if (!ObjectId.isValid(movieId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid movie ID format' },
        { status: 400 }
      );
    }
    
    // Update movie in database
    const result = await moviesCollection.updateOne(
      { _id: new ObjectId(movieId) },
      { $set: filteredUpdate }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Movie not found' },
        { status: 404 }
      );
    }
    
    // Get the updated movie
    const updatedMovie = await moviesCollection.findOne({ 
      _id: new ObjectId(movieId) 
    });
    
    // Convert ObjectId to string for proper JSON serialization
    const movieWithStringId = {
      ...updatedMovie,
      _id: updatedMovie?._id.toString()
    };
    
    return NextResponse.json({
      success: true,
      message: 'Movie updated successfully',
      movie: movieWithStringId
    });
    
  } catch (error) {
    console.error('Error updating movie:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update movie' },
      { status: 500 }
    );
  }
} 