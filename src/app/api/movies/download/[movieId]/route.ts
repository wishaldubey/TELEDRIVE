import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";
import axios from "axios";
import { verifyAuthToken } from '@/lib/auth';
import { cookies } from 'next/headers';

// Get the bot token from environment variables
const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || '8069923631:AAFuNciS0sd8WzCCH-Zx-acdd9l3rt5O3FA';
const PUBLIC_MOVIE_CHANNEL_ID = process.env.PUBLIC_MOVIE_CHANNEL_ID;

async function forwardFileToUser(userId: number, messageId: number, channelId: string, caption?: string) {
  try {
    if (!BOT_TOKEN) {
      throw new Error('Bot token not configured');
    }
    
    // Use the provided channel ID
    if (!channelId) {
      throw new Error('Channel ID not provided');
    }
    
    // Use the Telegram Bot API to forward the file
    const forwardUrl = `https://api.telegram.org/bot${BOT_TOKEN}/copyMessage`;
    
    console.log(`Sending movie to user ${userId} from channel ${channelId}, message ID: ${messageId}`);
    
    // Send a request to copy the message (not forward, to avoid the "Forwarded from" tag)
    const response = await fetch(forwardUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: userId,
        from_chat_id: channelId,
        message_id: messageId,
        caption: caption || undefined,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Telegram API error:', errorData);
      throw new Error(`Failed to forward file: ${errorData.description || 'Unknown error'}`);
    }
    
    const result = await response.json();
    console.log('Telegram API response:', result);
    
    return true;
  } catch (error) {
    console.error('Error forwarding file to user:', error);
    throw error;
  }
}

// Handle direct download/streaming
export async function GET(
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
    
    // Connect to MongoDB
    const client = await connectToDatabase();
    const db = client.db('teledriveDB');
    const moviesCollection = db.collection('movies');
    
    // Get movieId from params - this is a server component so we don't need React.use()
    const { movieId } = params;
    
    // Validate movieId format
    if (!ObjectId.isValid(movieId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid movie ID format' },
        { status: 400 }
      );
    }
    
    // Find movie by ID
    const movie = await moviesCollection.findOne({ 
      _id: new ObjectId(movieId) 
    });

    if (!movie) {
      return NextResponse.json(
        { success: false, error: 'Movie not found' },
        { status: 404 }
      );
    }
    
    // Redirect to movie detail page
    return NextResponse.redirect(new URL(`/cinema/${movieId}`, request.url));
    
  } catch (error) {
    console.error('Error processing download request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process download request' },
      { status: 500 }
    );
  }
}

// Handle sending file to Telegram DM
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
    
    // Connect to MongoDB
    const client = await connectToDatabase();
    const db = client.db('teledriveDB');
    const moviesCollection = db.collection('movies');
    
    // Get movieId from params - this is a server component so we don't need React.use()
    const { movieId } = params;
    
    // Validate movieId format
    if (!ObjectId.isValid(movieId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid movie ID format' },
        { status: 400 }
      );
    }
    
    // Find movie by ID
    const movie = await moviesCollection.findOne({ 
      _id: new ObjectId(movieId) 
    });
    
    if (!movie) {
      return NextResponse.json(
        { success: false, error: 'Movie not found' },
        { status: 404 }
      );
    }
    
    // Create a caption with movie info
    const caption = `🎬 ${movie.title} ${movie.release_year ? `(${movie.release_year})` : ''}\n\n${movie.genres?.join(', ') || ''}`;
    
    // Get the channel ID (use movie.channel_id if available, otherwise PUBLIC_MOVIE_CHANNEL_ID)
    const sourceChannelId = movie.channel_id || PUBLIC_MOVIE_CHANNEL_ID;
    
    if (!sourceChannelId) {
      return NextResponse.json(
        { success: false, error: 'No channel ID available for this movie' },
        { status: 500 }
      );
    }
    
    // Forward the file to user's Telegram
    await forwardFileToUser(
      user.user_id, 
      movie.message_id,
      sourceChannelId,
      caption
    );
    
    return NextResponse.json({
      success: true,
      message: 'Movie sent to your Telegram'
    });
    
  } catch (error) {
    console.error('Error sending movie to Telegram:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send movie to Telegram', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 