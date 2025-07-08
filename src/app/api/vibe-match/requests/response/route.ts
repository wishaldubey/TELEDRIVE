import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { verifyAuthToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import { createChatRoom } from '@/services/firebase';

// Handle POST request to respond to a vibe request
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
    const { request_id, action } = body;

    // Validate required fields
    if (!request_id) {
      return NextResponse.json({ 
        success: false, 
        message: 'Request ID is required' 
      }, { status: 400 });
    }

    if (!['accept', 'reject'].includes(action)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Action must be "accept" or "reject"' 
      }, { status: 400 });
    }

    // Connect to the database
    const client = await connectToDatabase();
    const db = client.db('teledriveDB');
    const vibeRequestsCollection = db.collection('vibeRequests');

    // Find the request
    const vibeRequest = await vibeRequestsCollection.findOne({
      _id: new ObjectId(request_id),
      toUserId: user.user_id,
      status: "pending"
    });

    if (!vibeRequest) {
      return NextResponse.json({ 
        success: false, 
        message: 'Vibe request not found or already processed' 
      }, { status: 404 });
    }

    // Update the request status based on the action
    const newStatus = action === 'accept' ? "accepted" : "rejected";
    await vibeRequestsCollection.updateOne(
      { _id: new ObjectId(request_id) },
      { $set: { status: newStatus, updated_at: new Date() } }
    );

    // If accepting the request, create a match record
    if (action === 'accept') {
      const matchesCollection = db.collection('vibeMatches');
      
      // Create a new match
      const matchResult = await matchesCollection.insertOne({
        user1: vibeRequest.fromUserId,
        user2: user.user_id,
        matchScore: vibeRequest.matchScore,
        sharedMovies: vibeRequest.sharedMovies,
        createdAt: new Date(),
        status: "active"
      });
      
      const matchId = matchResult.insertedId.toString();
      
      // Create a Firebase chat room
      try {
        await createChatRoom(
          matchId,
          vibeRequest.fromUserId,
          user.user_id,
          vibeRequest.matchScore,
          vibeRequest.sharedMovies
        );
      } catch (firebaseError) {
        console.error('Error creating Firebase chat room:', firebaseError);
        // Continue even if Firebase fails - we'll retry later
      }

      return NextResponse.json({
        success: true,
        message: 'Vibe request accepted! You have a new match.',
        matched: true,
        matchId
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Vibe request rejected',
      rejected: true
    });
  } catch (error) {
    console.error('Error responding to vibe request:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
} 