import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { verifyAuthToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// Handle POST request to record a swipe on a movie
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
    const { movie_id, liked } = body;

    // Validate required fields
    if (!movie_id) {
      return NextResponse.json({ 
        success: false, 
        message: 'Movie ID is required' 
      }, { status: 400 });
    }

    if (typeof liked !== 'boolean') {
      return NextResponse.json({ 
        success: false, 
        message: 'Liked status must be a boolean' 
      }, { status: 400 });
    }

    // Connect to the database
    const client = await connectToDatabase();
    const db = client.db('teledriveDB');
    const profilesCollection = db.collection('vibeMatchProfiles');

    // Check if user has a profile
    const userProfile = await profilesCollection.findOne({ user_id: user.user_id });
    if (!userProfile) {
      return NextResponse.json({ 
        success: false, 
        message: 'User profile not found' 
      }, { status: 404 });
    }

    // Check daily limit (100 movies per day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Initialize or update daily swipe count
    let dailySwipeCount = 0;
    let lastSwipeDate = userProfile.last_swipe_date || null;

    // Reset counter if it's a new day
    if (!lastSwipeDate || new Date(lastSwipeDate) < today) {
      dailySwipeCount = 1; // Including this swipe
    } else {
      dailySwipeCount = (userProfile.daily_swipe_count || 0) + 1;
    }

    // Check if daily limit reached
    if (dailySwipeCount > 100) {
      return NextResponse.json({ 
        success: false, 
        message: 'Daily swipe limit reached (100 movies per day)',
        dailyLimit: true
      }, { status: 429 });
    }

    // Update user profile with swipe info
    // We'll store liked and disliked movies in separate arrays
    // This is more storage efficient than individual documents
    const updateField = liked ? 'liked_movies' : 'disliked_movies';
    
    // Update query
    const updateQuery = {
      $addToSet: { [updateField]: movie_id },
      $set: { 
        last_swipe_date: new Date(),
        daily_swipe_count: dailySwipeCount,
        updated_at: new Date()
      }
    };

    // Update the profile
    const result = await profilesCollection.updateOne(
      { user_id: user.user_id },
      updateQuery
    );

    if (!result.acknowledged) {
      throw new Error('Failed to record swipe');
    }

    return NextResponse.json({
      success: true,
      message: 'Swipe recorded successfully',
      dailySwipeCount
    });
  } catch (error) {
    console.error('Error recording swipe:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
} 