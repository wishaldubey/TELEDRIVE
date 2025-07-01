import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { SUPER_ADMINS } from '@/lib/client-auth';
import { cookies } from 'next/headers';
import { connectToDatabase } from '@/lib/db/mongodb';
import { ObjectId } from 'mongodb';

// Telegram bot token from environment variable
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export async function POST(
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
    
    // Parse request body
    const { reason, movieTitle } = await request.json();
    
    if (!reason || !reason.trim()) {
      return NextResponse.json(
        { success: false, error: 'Reason is required' },
        { status: 400 }
      );
    }
    
    // Connect to MongoDB
    const client = await connectToDatabase();
    const db = client.db('teledriveDB');
    
    // Get movieId from params
    const { movieId } = params;
    
    // Validate movieId format
    if (!ObjectId.isValid(movieId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid movie ID format' },
        { status: 400 }
      );
    }
    
    // Log the flag to database (optional)
    const flagsCollection = db.collection('movie_flags');
    await flagsCollection.insertOne({
      movieId: new ObjectId(movieId),
      movieTitle,
      userId: user.user_id,
      username: user.username,
      reason,
      createdAt: new Date()
    });
    
    // Send message to all super admins via Telegram bot
    if (BOT_TOKEN && SUPER_ADMINS.length > 0) {
      for (const adminId of SUPER_ADMINS) {
        const userFullName = user.first_name && user.last_name 
          ? `${user.first_name} ${user.last_name}`
          : user.first_name || user.username || `User ${user.user_id}`;

        const message = `🚩 *Movie Flagged*\n` +
                       `Title: *${movieTitle}*\n` +
                       `Flagged by: ${userFullName}\n` +
                       `Reason: *${reason}*\n\n` +
                       `[Open Movie](${process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com'}/cinema/${movieId})`;
        
        try {
          await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              chat_id: adminId,
              text: message,
              parse_mode: 'Markdown',
              disable_web_page_preview: false
            }),
          });
        } catch (error) {
          console.error(`Failed to send notification to admin ${adminId}:`, error);
          // Continue with other admins even if one fails
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Movie flagged successfully'
    });
    
  } catch (error) {
    console.error('Error flagging movie:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to flag movie' },
      { status: 500 }
    );
  }
} 