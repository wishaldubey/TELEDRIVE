import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { verifyAuthToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// Handle GET request to fetch vibe requests for the user
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'pending'; // Default to pending
    const type = searchParams.get('type') || 'incoming'; // Default to incoming requests

    // Connect to the database
    const client = await connectToDatabase();
    const db = client.db('teledriveDB');
    const vibeRequestsCollection = db.collection('vibeRequests');

    let query = {};
    
    // Build query based on type (incoming or outgoing)
    if (type === 'incoming') {
      query = {
        toUserId: user.user_id,
        status: status
      };
    } else if (type === 'outgoing') {
      query = {
        fromUserId: user.user_id,
        status: status
      };
    } else if (type === 'all') {
      query = {
        $or: [
          { toUserId: user.user_id },
          { fromUserId: user.user_id }
        ],
        status: status
      };
    }

    // Fetch requests
    const requests = await vibeRequestsCollection
      .find(query)
      .sort({ createdAt: -1 }) // Most recent first
      .toArray();

    // Convert MongoDB ObjectId to string for serialization
    const formattedRequests = requests.map(request => ({
      ...request,
      _id: request._id.toString()
    }));

    return NextResponse.json({
      success: true,
      requests: formattedRequests
    });
  } catch (error) {
    console.error('Error fetching vibe requests:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
} 