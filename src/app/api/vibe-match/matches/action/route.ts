import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { verifyAuthToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// Handle POST request to record an action on a match
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
    const { match_user_id, action, match_percentage, shared_movies } = body;

    // Validate required fields
    if (!match_user_id) {
      return NextResponse.json({ 
        success: false, 
        message: 'Match user ID is required' 
      }, { status: 400 });
    }

    if (!['rizz', 'skip'].includes(action)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Action must be "rizz" or "skip"' 
      }, { status: 400 });
    }

    // Connect to the database
    const client = await connectToDatabase();
    const db = client.db('teledriveDB');
    const matchActionsCollection = db.collection('vibeMatchActions');
    const vibeRequestsCollection = db.collection('vibeRequests');
    const profilesCollection = db.collection('vibeMatchProfiles');

    // If action is "skip", just record it and return
    if (action === 'skip') {
      const skipData = {
        from_user_id: user.user_id,
        to_user_id: match_user_id,
        action: 'skip',
        created_at: new Date()
      };

      await matchActionsCollection.insertOne(skipData);

      return NextResponse.json({
        success: true,
        message: 'Skip action recorded successfully',
        action: 'skip'
      });
    }

    // For "rizz" action, we need to handle it differently
    
    // First, check if there's already a pending request from this user to the match
    const existingRequest = await vibeRequestsCollection.findOne({
      fromUserId: user.user_id,
      toUserId: match_user_id,
      status: "pending"
    });

    if (existingRequest) {
      return NextResponse.json({
        success: true,
        message: 'Vibe request already sent',
        action: 'rizz',
        alreadySent: true
      });
    }

    // Check if there's a pending request from the match to this user
    const incomingRequest = await vibeRequestsCollection.findOne({
      fromUserId: match_user_id,
      toUserId: user.user_id,
      status: "pending"
    });

    // Get sender's profile for notification
    const senderProfile = await profilesCollection.findOne({ user_id: user.user_id });
    const senderName = senderProfile?.name || 'Someone';

    // If there's an incoming request, automatically accept it
    if (incomingRequest) {
      // Update the request status to accepted
      await vibeRequestsCollection.updateOne(
        { _id: incomingRequest._id },
        { $set: { status: "accepted", updated_at: new Date() } }
      );

      // Create a new match record
      const matchesCollection = db.collection('vibeMatches');
      await matchesCollection.insertOne({
        user1: user.user_id,
        user2: match_user_id,
        matchScore: incomingRequest.matchScore,
        sharedMovies: incomingRequest.sharedMovies,
        createdAt: new Date(),
        status: "active"
      });

      // Record the action in matchActions
      await matchActionsCollection.insertOne({
        from_user_id: user.user_id,
        to_user_id: match_user_id,
        action: 'rizz',
        created_at: new Date()
      });

      return NextResponse.json({
        success: true,
        message: 'Match created! They also liked you.',
        action: 'rizz',
        mutualMatch: true
      });
    }

    // If no existing request, create a new one
    const requestData = {
      fromUserId: user.user_id,
      toUserId: match_user_id,
      matchScore: match_percentage || 0,
      sharedMovies: shared_movies || [],
      senderName,
      createdAt: new Date(),
      status: "pending"
    };

    await vibeRequestsCollection.insertOne(requestData);

    // Record the action in matchActions
    await matchActionsCollection.insertOne({
      from_user_id: user.user_id,
      to_user_id: match_user_id,
      action: 'rizz',
      created_at: new Date()
    });

    return NextResponse.json({
      success: true,
      message: 'Vibe request sent successfully',
      action: 'rizz',
      requestSent: true
    });
  } catch (error) {
    console.error('Error recording match action:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
} 