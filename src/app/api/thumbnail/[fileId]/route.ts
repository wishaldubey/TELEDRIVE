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
    
    // Get user from token
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const user = await verifyAuthToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }
    
    const userId = user.user_id;
    
    // Get file info from MongoDB to verify ownership
    const client = await connectToDatabase();
    const db = client.db('teledriveDB');
    const filesCollection = db.collection('files');
    
    const fileData = await filesCollection.findOne({ file_id: fileId, owner_id: userId });
    
    if (!fileData) {
      console.log(`File not found or access denied: ${fileId} for user: ${userId}`);
      return NextResponse.json({ error: 'File not found or access denied' }, { status: 404 });
    }
    
    // Check if the file has a thumbnail
    if (!fileData.thumb_file_id) {
      console.log(`No thumbnail available for file: ${fileId}`);
      return NextResponse.json({ error: 'No thumbnail available' }, { status: 404 });
    }
    
    // Get file path from Telegram
    const getFileUrl = `${TELEGRAM_API_BASE}/bot${BOT_TOKEN}/getFile?file_id=${fileData.thumb_file_id}`;
    console.log(`Requesting thumbnail info from Telegram: ${getFileUrl}`);
    
    const fileResponse = await fetch(getFileUrl);
    const fileResult = await fileResponse.json();
    
    if (!fileResult.ok || !fileResult.result?.file_path) {
      console.error('No file_path in Telegram response:', fileResult);
      return NextResponse.json({ 
        error: 'Failed to get thumbnail from Telegram', 
        details: fileResult.description || 'Invalid file path'
      }, { status: 500 });
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
    
    const headers = new Headers(thumbnailResponse.headers);
    headers.set('Content-Type', 'image/jpeg');
    headers.set('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    
    // Return a streaming response with the thumbnail
    return new NextResponse(thumbnailResponse.body, {
      status: thumbnailResponse.status,
      statusText: thumbnailResponse.statusText,
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