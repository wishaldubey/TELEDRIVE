import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format bytes to human readable string
 * @param bytes - The bytes value to format
 * @param decimals - Number of decimal places to show
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Get a proxied URL for external resources to avoid CORS issues
 * @param url - The original stream URL
 * @param forceCacheBusting - Force adding a timestamp to bust cache (default: false)
 * @returns The proxied URL with appropriate cache busting
 */
export function getProxyUrl(url: string, forceCacheBusting: boolean = false): string {
  // Check for stream types that need special handling
  const isGoogleStream = url.includes('dai.google.com');
  const isAkamaiStream = url.includes('akamaized.net') || url.includes('akamaicdn');
  const isM3u8 = url.includes('.m3u8');
  
  // Determine if we need cache busting
  const needsCacheBusting = forceCacheBusting || 
                           isM3u8 && (isGoogleStream || isAkamaiStream || url.includes('token='));
  
  // Add timestamp for cache busting
  const cacheBuster = needsCacheBusting ? `&t=${Date.now()}` : '';
  
  // Build the proxy URL
  return `/api/stream-proxy?url=${encodeURIComponent(url)}${cacheBuster}`;
}
