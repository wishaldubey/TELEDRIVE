import { NextRequest, NextResponse } from 'next/server';

// This is a catch-all proxy for stream segments and nested resources
export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    // Get the path parameter and query string
    const path = params.path || [];
    const fullPath = path.join('/');
    
    // Get URL from query params
    let url = req.nextUrl.searchParams.get('url');
    
    // If no URL is provided, we'll attempt to reconstruct it from the path
    if (!url) {
      // First try to get the URL from the path - this handles requests that were rewritten in the m3u8 files
      // Example: /api/stream-proxy/segment-123.ts?url=https://example.com/segment-123.ts
      url = req.nextUrl.searchParams.toString();
      
      // If still no URL, return an error
      if (!url) {
        return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
      }
    }
    
    // Decode URL
    const decodedUrl = decodeURIComponent(url);
    
    // Special handling for Google DAI streams
    const isGoogleStream = decodedUrl.includes('dai.google.com');
    
    // Debug logging
    console.log(`Proxying path segment: ${decodedUrl.substring(0, 100)}...`);
    
    // Create headers for the fetch request
    const headers: HeadersInit = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Origin': 'https://teledrive-web.vercel.app',
      'Referer': 'https://teledrive-web.vercel.app/',
    };
    
    // Enhanced headers for Google DAI streams
    if (isGoogleStream) {
      headers['Accept-Language'] = 'en-US,en;q=0.9';
      headers['Sec-Fetch-Mode'] = 'cors';
      headers['Sec-Fetch-Site'] = 'cross-site';
      headers['Sec-Fetch-Dest'] = 'empty';
    }
    
    // Fetch content from the original URL
    const response = await fetch(decodedUrl, {
      headers,
      method: 'GET',
      redirect: 'follow',
      // Don't cache sensitive content
      cache: isGoogleStream ? 'no-store' : 'default'
    });
    
    // If response is not OK, return an error
    if (!response.ok) {
      console.error(`Failed to fetch: ${decodedUrl.substring(0, 100)}...: ${response.status} ${response.statusText}`);
      return NextResponse.json({ 
        error: `Failed to fetch resource: ${response.statusText}`, 
        status: response.status,
        url: decodedUrl 
      }, { status: response.status });
    }
    
    // Get the content type from the response
    let contentType = response.headers.get('content-type');
    
    // Determine content type from URL if not provided in headers
    if (!contentType) {
      if (decodedUrl.endsWith('.m3u8') || decodedUrl.includes('.m3u8?')) {
        contentType = 'application/vnd.apple.mpegurl';
      } else if (decodedUrl.endsWith('.ts')) {
        contentType = 'video/mp2t';
      } else if (decodedUrl.endsWith('.key')) {
        contentType = 'application/octet-stream';
      }
    }
    
    // Check if this is an m3u8 file that needs URL rewriting
    const isM3u8 = (contentType?.includes('application/vnd.apple.mpegurl') || 
                   decodedUrl.endsWith('.m3u8') || 
                   decodedUrl.includes('.m3u8?'));
    
    if (isM3u8) {
      // Get the text content
      const text = await response.text();
      
      // Base URL for resolving relative URLs
      let baseUrl = new URL(decodedUrl);
      
      // Preserve query params for Google DAI streams since they're needed for authentication
      const shouldPreserveQuery = isGoogleStream;
      if (!shouldPreserveQuery) {
        baseUrl.search = ''; // Remove query string
      }
      baseUrl.hash = '';   // Remove hash
      
      // Get the directory part of the URL (without filename)
      const urlParts = baseUrl.pathname.split('/');
      urlParts.pop(); // Remove the filename part
      baseUrl.pathname = urlParts.join('/') + '/';
      
      // Rewrite URLs in the m3u8 file
      const rewrittenText = text
        .split('\n')
        .map(line => {
          // Skip comments and empty lines
          if (line.startsWith('#') || line.trim() === '') {
            return line;
          }
          
          // Handle absolute URLs
          if (line.startsWith('http://') || line.startsWith('https://')) {
            return `/api/stream-proxy?url=${encodeURIComponent(line)}`;
          }
          
          // Handle relative URLs
          let fullUrl;
          if (line.includes('?') && shouldPreserveQuery) {
            // For Google DAI, preserve the query parameters
            fullUrl = new URL(line, baseUrl.toString()).toString();
          } else {
            // For normal streams, just resolve normally
            fullUrl = new URL(line, baseUrl.toString()).toString();
          }
          
          return `/api/stream-proxy?url=${encodeURIComponent(fullUrl)}`;
        })
        .join('\n');
      
      // Create new response with the rewritten content
      const newResponse = new NextResponse(rewrittenText);
      newResponse.headers.set('Content-Type', 'application/vnd.apple.mpegurl');
      newResponse.headers.set('Access-Control-Allow-Origin', '*');
      
      // No caching for Google DAI streams to prevent session issues
      if (isGoogleStream) {
        newResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
      
      return newResponse;
    }
    
    // Get response body as arrayBuffer
    const buffer = await response.arrayBuffer();
    
    // Create new response
    const newResponse = new NextResponse(buffer);
    
    // Set content type if available
    if (contentType) {
      newResponse.headers.set('Content-Type', contentType);
    }
    
    // Set CORS headers
    newResponse.headers.set('Access-Control-Allow-Origin', '*');
    newResponse.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    newResponse.headers.set('Access-Control-Allow-Headers', '*');
    newResponse.headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
    
    // Add no-cache headers for Google DAI streams
    if (isGoogleStream) {
      newResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      newResponse.headers.set('Pragma', 'no-cache');
      newResponse.headers.set('Expires', '0');
    }
    
    return newResponse;
  } catch (error) {
    console.error('Stream proxy error:', error);
    return NextResponse.json({ 
      error: 'Failed to proxy stream resource', 
      details: String(error) 
    }, { status: 500 });
  }
}

// Handle CORS preflight requests
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Max-Age': '86400',
    },
  });
} 