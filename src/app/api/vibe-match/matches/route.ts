import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { verifyAuthToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
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

    // Connect to the database
    const client = await connectToDatabase();
    const db = client.db('teledriveDB');
    const matchesCollection = db.collection('vibeMatches');
    const usersCollection = db.collection('users');
    const profilesCollection = db.collection('vibeMatchProfiles');

    // Find matches where the current user is either user1 or user2
    const matches = await matchesCollection.find({
      $or: [
        { user1: user.user_id },
        { user2: user.user_id }
      ],
      status: "active"
    }).toArray();

    // Fetch other users' info for the matches
    const enhancedMatches = await Promise.all(matches.map(async (match) => {
      // Determine which user is the "other" user
      const otherUserId = match.user1 === user.user_id ? match.user2 : match.user1;
      
      // Get the other user's info
      const otherUser = await usersCollection.findOne({ user_id: otherUserId });
      const otherUserProfile = await profilesCollection.findOne({ user_id: otherUserId });
      
      return {
        ...match,
        otherUserName: otherUserProfile?.name || otherUser?.username || `User ${otherUserId}`,
        otherUserProfilePic: otherUserProfile?.profile_picture
      };
    }));

    return NextResponse.json({
      success: true,
      matches: enhancedMatches
    });
  } catch (error) {
    console.error('Error fetching matches:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
} 