import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // Get the URL from the query parameters
  const url = req.nextUrl.searchParams.get('url');
  
  if (!url) {
    return NextResponse.json(
      { error: 'URL parameter is required' },
      { status: 400 }
    );
  }
  
  try {
    // Decode the URL if it's encoded
    const decodedUrl = decodeURIComponent(url);
    
    // Special handling for different stream providers
    const isGoogleStream = decodedUrl.includes('dai.google.com');
    const isAkamaiStream = decodedUrl.includes('akamaized.net') || decodedUrl.includes('akamaicdn');
    
    console.log(`Proxying request for: ${decodedUrl.substring(0, 100)}...`);
    
    // Forward any cookies or params that might be in the request
    const reqHeaders = new Headers();
    const forwardedCookies = req.headers.get('cookie');
    
    // Base headers for all requests
    reqHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36');
    reqHeaders.set('Accept', '*/*');
    reqHeaders.set('Origin', 'https://telegramdrive.vercel.app');
    reqHeaders.set('Referer', 'https://telegramdrive.vercel.app/');
    
    // Add cookies if they exist (important for authenticated streams)
    if (forwardedCookies) {
      reqHeaders.set('Cookie', forwardedCookies);
    }
    
    // Provider-specific headers
    if (isGoogleStream) {
      reqHeaders.set('Sec-Fetch-Mode', 'cors');
      reqHeaders.set('Sec-Fetch-Site', 'cross-site');
      reqHeaders.set('Sec-Fetch-Dest', 'empty');
      reqHeaders.set('Accept-Language', 'en-US,en;q=0.9');
    } else if (isAkamaiStream) {
      reqHeaders.set('Accept-Encoding', 'gzip, deflate, br');
      reqHeaders.set('Accept-Language', 'en-US,en;q=0.9');
      reqHeaders.set('Sec-Fetch-Mode', 'cors');
      reqHeaders.set('Sec-Fetch-Site', 'cross-site');
      reqHeaders.set('Sec-Fetch-Dest', 'empty');
      
      // Check for Akamai token parameters and forward them
      const urlObj = new URL(decodedUrl);
      const hdntl = req.nextUrl.searchParams.get('hdntl') || urlObj.searchParams.get('hdntl');
      if (hdntl) {
        reqHeaders.set('Cookie', `hdntl=${hdntl}${forwardedCookies ? '; ' + forwardedCookies : ''}`);
      }
    }
    
    // Fetch with timeout to avoid hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    // Fetch the content
    const response = await fetch(decodedUrl, { 
      headers: reqHeaders,
      signal: controller.signal
    }).finally(() => clearTimeout(timeoutId));
    
    // If the response is not ok, return an error
    if (!response.ok) {
      console.error(`Error fetching ${decodedUrl.substring(0, 100)}...: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { 
          error: `Failed to fetch the resource: ${response.status} ${response.statusText}`,
          url: decodedUrl
        },
        { status: response.status }
      );
    }
    
    // Check content type and URL to determine file type
    const contentType = response.headers.get('content-type');
    const isM3u8 = decodedUrl.endsWith('.m3u8') || 
                   decodedUrl.includes('.m3u8?') || 
                   contentType?.includes('application/vnd.apple.mpegurl') ||
                   contentType?.includes('application/x-mpegurl');
    
    const isTs = decodedUrl.endsWith('.ts') || 
                 decodedUrl.includes('.ts?') || 
                 contentType?.includes('video/mp2t');
                 
    const isKey = decodedUrl.endsWith('.key') || 
                  decodedUrl.includes('.key?');

    // For m3u8 files, we need to process and rewrite URLs
    if (isM3u8) {
      const text = await response.text();
      
      // Base URL for resolving relative URLs
      let baseUrl = new URL(decodedUrl);
      
      // Should we preserve query parameters?
      // Always preserve for Google DAI and Akamai, and for any URL with authentication tokens
      const shouldPreserveQuery = isGoogleStream || 
                                 isAkamaiStream || 
                                 decodedUrl.includes('token=') || 
                                 decodedUrl.includes('auth=');
      
      // Get the directory part of the URL (without filename)
      let basePath = baseUrl.pathname;
      const pathParts = basePath.split('/');
      const fileName = pathParts.pop(); // Remove filename
      basePath = pathParts.join('/') + '/';
      
      // Function to resolve URLs in the playlist
      const resolveUrl = (line: string) => {
        if (line.startsWith('#') || line.trim() === '') {
          return line; // Comments and empty lines unchanged
        }
        
        // Handle absolute URLs
        if (line.startsWith('http://') || line.startsWith('https://')) {
          // Add timestamp for cache busting if it's a playlist
          const needsCacheBusting = line.includes('.m3u8') && (isGoogleStream || isAkamaiStream);
          const cacheBuster = needsCacheBusting ? `&t=${Date.now()}` : '';
          return `/api/stream-proxy?url=${encodeURIComponent(line)}${cacheBuster}`;
        }
        
        // Handle relative URLs - need to properly construct complete URL
        let fullUrl: string;
        
        if (line.startsWith('/')) {
          // Absolute path relative to domain
          fullUrl = `${baseUrl.protocol}//${baseUrl.host}${line}`;
        } else {
          // Relative to current directory
          fullUrl = `${baseUrl.protocol}//${baseUrl.host}${basePath}${line}`;
        }
        
        // Preserve original query params if needed
        if (shouldPreserveQuery && baseUrl.search && !line.includes('?')) {
          fullUrl += baseUrl.search;
        }
        
        // Add timestamp for cache busting if it's a playlist
        const needsCacheBusting = line.includes('.m3u8') && (isGoogleStream || isAkamaiStream);
        const cacheBuster = needsCacheBusting ? `&t=${Date.now()}` : '';
        
        return `/api/stream-proxy?url=${encodeURIComponent(fullUrl)}${cacheBuster}`;
      };
      
      // Rewrite URLs in the m3u8 file
      const rewrittenText = text
        .split('\n')
        .map(line => {
          // Special handling for EXT-X-KEY lines that contain URI attribute
          if (line.includes('#EXT-X-KEY') && line.includes('URI="')) {
            return line.replace(/URI="([^"]+)"/g, (match, uri) => {
              // Absolute URL
              if (uri.startsWith('http://') || uri.startsWith('https://')) {
                return `URI="/api/stream-proxy?url=${encodeURIComponent(uri)}"`;
              }
              
              // Relative URL
              let fullUrl;
              if (uri.startsWith('/')) {
                fullUrl = `${baseUrl.protocol}//${baseUrl.host}${uri}`;
              } else {
                fullUrl = `${baseUrl.protocol}//${baseUrl.host}${basePath}${uri}`;
              }
              
              return `URI="/api/stream-proxy?url=${encodeURIComponent(fullUrl)}"`;
            });
          }
          
          // Process normal lines (media segments or nested playlists)
          return resolveUrl(line);
        })
        .join('\n');
      
      // Create a new response with the rewritten content
      const newResponse = new NextResponse(rewrittenText);
      
      // Set content type
      newResponse.headers.set('Content-Type', 'application/vnd.apple.mpegurl');
      
      // Set CORS headers
      newResponse.headers.set('Access-Control-Allow-Origin', '*');
      newResponse.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
      newResponse.headers.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range');
      newResponse.headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
      
      // No caching for m3u8 files
      newResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      newResponse.headers.set('Pragma', 'no-cache');
      newResponse.headers.set('Expires', '0');
      
      return newResponse;
    }
    
    // For non-m3u8 files (segments, keys, etc.), pass through the content
    const arrayBuffer = await response.arrayBuffer();
    const newResponse = new NextResponse(arrayBuffer);
    
    // Copy important headers from original response
    response.headers.forEach((value, key) => {
      // Avoid setting problematic headers
      if (!['content-encoding', 'content-length', 'connection', 'transfer-encoding'].includes(key.toLowerCase())) {
        newResponse.headers.set(key, value);
      }
    });
    
    // Set correct content type based on file extension
    if (isTs) {
      newResponse.headers.set('Content-Type', 'video/mp2t');
    } else if (isKey) {
      newResponse.headers.set('Content-Type', 'application/octet-stream');
    }
    
    // Caching strategy: cache segments but not playlists
    if (isTs) {
      // TS segments can be cached for a short time
      newResponse.headers.set('Cache-Control', 'public, max-age=60'); // 1 minute
    } else {
      // Other files (like keys) shouldn't be cached
      newResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      newResponse.headers.set('Pragma', 'no-cache');
      newResponse.headers.set('Expires', '0');
    }
    
    // Set CORS headers
    newResponse.headers.set('Access-Control-Allow-Origin', '*');
    newResponse.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    newResponse.headers.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range');
    newResponse.headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
    
    return newResponse;
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch the resource', details: String(error) },
      { status: 500 }
    );
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Range',
      'Access-Control-Max-Age': '86400',
      'Cross-Origin-Resource-Policy': 'cross-origin'
    },
  });
} 