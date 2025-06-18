import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuthToken } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db/mongodb';

// Telegram Bot API URL for file downloads
const TELEGRAM_API_BASE = 'https://api.telegram.org';
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8069923631:AAFuNciS0sd8WzCCH-Zx-acdd9l3rt5O3FA';

export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    // Get params
    const { fileId } = params;
    
    // Check if this is a public request (no auth needed)
    const isPublic = request.nextUrl.searchParams.get('public') === 'true';
    const isDirect = request.nextUrl.searchParams.get('direct') === 'true';
    let userId = null;
    let fileData = null;
    
    // Connect to MongoDB
    const client = await connectToDatabase();
    const db = client.db('teledriveDB');
    const filesCollection = db.collection('files');
    const moviesCollection = db.collection('movies');
    
    // First check if this is a movie file (public access allowed)
    const movieFile = await moviesCollection.findOne({ file_id: fileId });
    
    if (movieFile) {
      // This is a movie file, allow public access
      fileData = { 
        file_id: fileId, 
        thumb_file_id: movieFile.thumb_file_id || fileId,
        mime_type: 'image/jpeg'
      };
    } else {
      // Not a movie, check authentication for private files
      const cookieStore = await cookies();
      const token = cookieStore.get('auth_token')?.value;
      
      if (!token) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
      
      const user = await verifyAuthToken(token);
      if (!user) {
        return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
      }
      
      userId = user.user_id;
      
      // Get file info from MongoDB to verify ownership
      fileData = await filesCollection.findOne({ file_id: fileId, owner_id: userId });
    }
    
    if (!fileData) {
      console.log(`File not found or access denied: ${fileId} for user: ${userId}`);
      return NextResponse.json({ error: 'File not found or access denied' }, { status: 404 });
    }
    
    // Use thumb_file_id if available, otherwise use the file_id itself
    const thumbnailFileId = fileData.thumb_file_id || fileId;
    
    // Get file path from Telegram
    const getFileUrl = `${TELEGRAM_API_BASE}/bot${BOT_TOKEN}/getFile?file_id=${thumbnailFileId}`;
    console.log(`Requesting thumbnail info from Telegram: ${getFileUrl}`);
    
    const fileResponse = await fetch(getFileUrl);
    const fileResult = await fileResponse.json();
    
    if (!fileResult.ok || !fileResult.result?.file_path) {
      console.error('No file_path in Telegram response:', fileResult);
      
      // Return a placeholder image instead of an error
      const placeholderPath = process.cwd() + '/public/placeholder-movie.jpg';
      
      // For Vercel, we need to redirect to the placeholder
      return NextResponse.redirect(new URL('/placeholder-movie.jpg', request.url));
    }
    
    const filePath = fileResult.result.file_path;
    const downloadUrl = `${TELEGRAM_API_BASE}/file/bot${BOT_TOKEN}/${filePath}`;
    
    console.log(`Downloading thumbnail from: ${downloadUrl}`);
    
    // Fetch the thumbnail from Telegram
    const thumbnailResponse = await fetch(downloadUrl);
    
    if (!thumbnailResponse.ok) {
      console.error(`Failed to download thumbnail: ${thumbnailResponse.status} ${thumbnailResponse.statusText}`);
      return NextResponse.json({ 
        error: 'Failed to download thumbnail from Telegram', 
        status: thumbnailResponse.status,
        statusText: thumbnailResponse.statusText
      }, { status: thumbnailResponse.status });
    }
    
    // Instead of streaming directly, convert to arrayBuffer for Vercel compatibility
    const arrayBuffer = await thumbnailResponse.arrayBuffer();
    
    const headers = new Headers();
    headers.set('Content-Type', 'image/jpeg');
    headers.set('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    
    // For direct access, add CORS headers
    if (isDirect) {
      headers.set('Access-Control-Allow-Origin', '*');
      headers.set('Access-Control-Allow-Methods', 'GET');
      headers.set('Access-Control-Allow-Headers', 'Content-Type');
    }
    
    // Return the thumbnail as a buffer instead of streaming
    return new NextResponse(arrayBuffer, {
      status: 200,
      headers
    });
  } catch (error) {
    console.error('Error downloading thumbnail:', error);
    return NextResponse.json({ 
      error: 'Failed to download thumbnail',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 