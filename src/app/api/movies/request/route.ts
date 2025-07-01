import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';
import { SUPER_ADMINS } from '@/lib/client-auth';
import { cookies } from 'next/headers';
import { connectToDatabase } from '@/lib/db/mongodb';

// Telegram bot token from environment variable
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export async function POST(request: NextRequest) {
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
    const { movieName, releaseYear, language } = await request.json();
    
    if (!movieName || !movieName.trim()) {
      return NextResponse.json(
        { success: false, error: 'Movie name is required' },
        { status: 400 }
      );
    }
    
    // Connect to MongoDB
    const client = await connectToDatabase();
    const db = client.db('teledriveDB');
    
    // Log the request to database
    const requestsCollection = db.collection('movie_requests');
    await requestsCollection.insertOne({
      movieName,
      releaseYear,
      language,
      userId: user.user_id,
      username: user.username,
      status: 'pending',
      createdAt: new Date()
    });
    
    // Format the message
    let movieDetails = movieName;
    if (releaseYear) {
      movieDetails += ` (${releaseYear})`;
    }
    if (language) {
      movieDetails += ` [${language}]`;
    }
    
    // Send message to all super admins via Telegram bot
    if (BOT_TOKEN && SUPER_ADMINS.length > 0) {
      for (const adminId of SUPER_ADMINS) {
        const userFullName = user.first_name && user.last_name 
          ? `${user.first_name} ${user.last_name}`
          : user.first_name || user.username || `User ${user.user_id}`;

        const message = `🎬 *New Movie Request*\n` +
                       `Movie: *${movieDetails}*\n` +
                       `User: ${userFullName}`;
        
        try {
          await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              chat_id: adminId,
              text: message,
              parse_mode: 'Markdown'
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
      message: 'Movie request submitted successfully'
    });
    
  } catch (error) {
    console.error('Error submitting movie request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit movie request' },
      { status: 500 }
    );
  }
} 