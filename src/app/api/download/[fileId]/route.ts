import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuthToken } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db/mongodb';
import path from 'path';

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
    
    console.log(`Download request for file: ${fileId} by user: ${userId}`);
    
    // Get file info from MongoDB to verify ownership
    const client = await connectToDatabase();
    const db = client.db('teledriveDB');
    const filesCollection = db.collection('files');
    
    const fileData = await filesCollection.findOne({ file_id: fileId, owner_id: userId });
    
    if (!fileData) {
      console.log(`File not found or access denied: ${fileId} for user: ${userId}`);
      return NextResponse.json({ error: 'File not found or access denied' }, { status: 404 });
    }
    
    // Check if we should stream the file directly (view=true) or force download
    const searchParams = request.nextUrl.searchParams;
    const isViewMode = searchParams.get('view') === 'true';
    const sendToTelegram = searchParams.get('sendToTelegram') === 'true';
    
    // If user requested to send the file via Telegram
    if (sendToTelegram) {
      try {
        // Forward the message to the user
        const forwardUrl = `${TELEGRAM_API_BASE}/bot${BOT_TOKEN}/forwardMessage`;
        const forwardResponse = await fetch(forwardUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: userId,
            from_chat_id: fileData.channel_id,
            message_id: fileData.message_id
          })
        });
        
        const forwardResult = await forwardResponse.json();
        
        if (!forwardResult.ok) {
          console.error(`Failed to forward message: ${JSON.stringify(forwardResult)}`);
          return NextResponse.json({ 
            error: 'Failed to send file via Telegram', 
            details: forwardResult.description || 'Unknown error' 
          }, { status: 500 });
        }
        
        return NextResponse.json({ 
          success: true, 
          message: 'File sent to your Telegram account' 
        });
      } catch (error) {
        console.error('Error forwarding message:', error);
        return NextResponse.json({ 
          error: 'Failed to send file via Telegram',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
      }
    }
    
    // Get file path from Telegram
    const getFileUrl = `${TELEGRAM_API_BASE}/bot${BOT_TOKEN}/getFile?file_id=${fileId}`;
    console.log(`Requesting file info from Telegram: ${getFileUrl}`);
    
    const fileResponse = await fetch(getFileUrl);
    const fileResult = await fileResponse.json();
    
    console.log('Telegram getFile response:', JSON.stringify(fileResult));
    
    if (!fileResult.ok) {
      // Check if the file is too big
      if (fileResult.description && fileResult.description.includes("file is too big")) {
        console.log(`File is too big: ${fileId}`);
        
        // Return a response with options
        return NextResponse.json({
          error: 'File is too big to download directly',
          fileSize: fileData.file_size || 'Unknown',
          options: {
            sendToTelegram: true
          }
        }, { status: 413 }); // 413 Payload Too Large
      }
      
      console.error(`Telegram API error: ${JSON.stringify(fileResult)}`);
      return NextResponse.json({ 
        error: 'Failed to get file from Telegram', 
        details: fileResult.description || 'Unknown error' 
      }, { status: 500 });
    }
    
    if (!fileResult.result?.file_path) {
      console.error('No file_path in Telegram response:', fileResult);
      return NextResponse.json({ 
        error: 'Invalid file path from Telegram', 
        details: 'The file may be too old or deleted from Telegram servers'
      }, { status: 500 });
    }
    
    const filePath = fileResult.result.file_path;
    const downloadUrl = `${TELEGRAM_API_BASE}/file/bot${BOT_TOKEN}/${filePath}`;
    
    console.log(`Downloading file from: ${downloadUrl}`);
    
    // Fetch the file from Telegram
    const fileDownloadResponse = await fetch(downloadUrl);
    
    if (!fileDownloadResponse.ok) {
      console.error(`Failed to download file: ${fileDownloadResponse.status} ${fileDownloadResponse.statusText}`);
      return NextResponse.json({ 
        error: 'Failed to download file from Telegram', 
        status: fileDownloadResponse.status,
        statusText: fileDownloadResponse.statusText
      }, { status: fileDownloadResponse.status });
    }
    
    const headers = new Headers(fileDownloadResponse.headers);
    
    // Determine the file name with proper extension
    let fileName = fileData.file_name || fileData.caption || `file_${fileId.substring(0, 8)}`;
    
    // Make sure the filename has an extension
    if (fileData.file_extension) {
      // Check if the filename already ends with the correct extension
      const currentExt = path.extname(fileName).toLowerCase();
      if (currentExt !== fileData.file_extension.toLowerCase()) {
        fileName = fileName.replace(/\.[^/.]+$/, '') + fileData.file_extension;
      }
    }
    
    // Set content type based on mime type if available
    if (fileData.mime_type) {
      headers.set('Content-Type', fileData.mime_type);
    }
    
    // Set content disposition based on mode (view or download)
    if (!isViewMode) {
      headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    } else {
      // For view mode, use inline disposition with the filename
      headers.set('Content-Disposition', `inline; filename="${encodeURIComponent(fileName)}"`);
    }
    
    console.log(`Successfully streaming file: ${fileId} as ${fileName}`);
    
    // Return a streaming response with the file
    return new NextResponse(fileDownloadResponse.body, {
      status: fileDownloadResponse.status,
      statusText: fileDownloadResponse.statusText,
      headers
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    return NextResponse.json({ 
      error: 'Failed to download file',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 