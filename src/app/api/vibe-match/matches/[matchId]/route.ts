import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { verifyAuthToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest, { params }: { params: { matchId: string } }) {
  try {
    // Get match ID from params
    const { matchId } = params;
    
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

    // Find the match
    const match = await matchesCollection.findOne({
      _id: new ObjectId(matchId),
      $or: [
        { user1: user.user_id },
        { user2: user.user_id }
      ],
      status: "active"
    });

    if (!match) {
      return NextResponse.json({ 
        success: false, 
        message: 'Match not found or you do not have access to this match' 
      }, { status: 404 });
    }

    // Determine which user is the "other" user
    const otherUserId = match.user1 === user.user_id ? match.user2 : match.user1;
    
    // Get the other user's info
    const otherUser = await usersCollection.findOne({ user_id: otherUserId });
    const otherUserProfile = await profilesCollection.findOne({ user_id: otherUserId });
    
    // Enhance match with other user's info
    const enhancedMatch = {
      ...match,
      otherUserName: otherUserProfile?.name || otherUser?.username || `User ${otherUserId}`,
      otherUserProfilePic: otherUserProfile?.profile_picture
    };

    return NextResponse.json({
      success: true,
      match: enhancedMatch
    });
  } catch (error) {
    console.error('Error fetching match:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
} 