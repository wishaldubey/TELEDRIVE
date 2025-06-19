import { NextRequest, NextResponse } from "next/server";
import { cookies } from 'next/headers';
import { verifyAuthToken } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db/mongodb';

export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const cookieStore = await cookies();
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
    
    // Get query parameters for pagination if provided
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const page = parseInt(url.searchParams.get("page") || "1");
    const skip = (page - 1) * limit;
    
    try {
      // Connect to MongoDB
      const client = await connectToDatabase();
      const db = client.db("teledriveDB");
      
      // Find the user to get the watchlist
      const userData = await db.collection("users").findOne({ user_id: user.user_id });
      
      if (!userData || !userData.watchlist) {
        return NextResponse.json({
          success: true,
          movies: [],
          pagination: {
            total: 0,
            page,
            limit,
            totalPages: 0
          }
        });
      }
      
      // Get movies from watchlist
      const movies = await db.collection("movies")
        .find({ _id: { $in: userData.watchlist } })
        .skip(skip)
        .limit(limit)
        .toArray();
      
      // Get total count for pagination
      const totalCount = userData.watchlist.length;
      
      return NextResponse.json({
        success: true,
        movies,
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit)
        }
      });
      
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch watchlist' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in watchlist get endpoint:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
} 