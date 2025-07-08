import { NextRequest, NextResponse } from 'next/server';

// Telegram Bot API URL for file downloads
const TELEGRAM_API_BASE = 'https://api.telegram.org';
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8069923631:AAFuNciS0sd8WzCCH-Zx-acdd9l3rt5O3FA';

export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    // Get file ID
    const { fileId } = params;
    
    // Ensure we have a valid file ID
    if (!fileId || fileId.length < 10) {
      console.error('Invalid profile picture file ID:', fileId);
      return NextResponse.redirect(new URL('/placeholder-movie.jpg', request.url));
    }
    
    // Get file path from Telegram
    const getFileUrl = `${TELEGRAM_API_BASE}/bot${BOT_TOKEN}/getFile?file_id=${fileId}`;
    console.log(`Requesting profile picture from Telegram: ${getFileUrl}`);
    
    const fileResponse = await fetch(getFileUrl);
    const fileResult = await fileResponse.json();
    
    if (!fileResult.ok || !fileResult.result?.file_path) {
      console.error('No file_path in Telegram response:', fileResult);
      // Return a placeholder image instead of an error
      return NextResponse.redirect(new URL('/placeholder-movie.jpg', request.url));
    }
    
    const filePath = fileResult.result.file_path;
    const downloadUrl = `${TELEGRAM_API_BASE}/file/bot${BOT_TOKEN}/${filePath}`;
    
    console.log(`Downloading profile picture from: ${downloadUrl}`);
    
    // Fetch the image from Telegram
    const imageResponse = await fetch(downloadUrl);
    
    if (!imageResponse.ok) {
      console.error(`Failed to download profile picture: ${imageResponse.status} ${imageResponse.statusText}`);
      return NextResponse.redirect(new URL('/placeholder-movie.jpg', request.url));
    }
    
    // Convert to arrayBuffer for compatibility
    const arrayBuffer = await imageResponse.arrayBuffer();
    
    // Setup response headers
    const headers = new Headers();
    headers.set('Content-Type', 'image/jpeg');
    headers.set('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET');
    headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    // Return the image
    return new NextResponse(arrayBuffer, {
      status: 200,
      headers
    });
  } catch (error) {
    console.error('Error downloading profile picture:', error);
    return NextResponse.redirect(new URL('/placeholder-movie.jpg', request.url));
  }
} 