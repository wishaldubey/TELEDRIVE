"use client";

import React, { useState } from 'react';
import { getProxyUrl } from '@/lib/utils';

interface FallbackPlayerProps {
  streamUrl: string;
  title: string;
}

export default function FallbackPlayer({ streamUrl, title }: FallbackPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [playerIndex, setPlayerIndex] = useState(0);
  
  // Detect stream types for special handling
  const isGoogleDai = streamUrl.includes('dai.google.com');
  const isAkamai = streamUrl.includes('akamaized.net') || streamUrl.includes('akamaicdn');
  const needsProxy = isGoogleDai || isAkamai || streamUrl.includes('token=');
  
  // Use our proxy for protected streams
  const proxyStreamUrl = needsProxy ? getProxyUrl(streamUrl, true) : streamUrl;
  
  // For public HLS players that support direct URL embedding
  const getPlayerUrl = () => {
    // Get the current absolute proxy URL (including domain)
    const absoluteProxyUrl = new URL(proxyStreamUrl, window.location.origin).toString();
    
    // List of external players to try
    const players = [
      // HLS.js demo player
      `https://hls-js.netlify.app/demo/?src=${encodeURIComponent(absoluteProxyUrl)}`,
      
      // VideoJS player
      `https://videojs.github.io/videojs-contrib-hls/?src=${encodeURIComponent(absoluteProxyUrl)}`,
      
      // JW Player demo
      `https://developer.jwplayer.com/tools/stream-tester/?stream_url=${encodeURIComponent(absoluteProxyUrl)}`,
      
      // Clappr player
      `https://clappr.io/demo/?source=${encodeURIComponent(absoluteProxyUrl)}&poster=${encodeURIComponent('/live.jpg')}&muted=true&autoPlay=true`
    ];
    
    // Return the currently selected player
    return players[playerIndex % players.length];
  };
  
  // Handle player errors by trying the next one
  const handlePlayerError = () => {
    setIsLoading(true);
    setPlayerIndex(prev => prev + 1);
  };

  return (
    <div className="relative w-full aspect-video bg-black">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-2"></div>
            <p className="text-gray-400 text-sm">Loading external player...</p>
            {playerIndex > 0 && (
              <p className="text-gray-500 text-xs mt-1">Trying alternative player ({playerIndex + 1}/4)</p>
            )}
          </div>
        </div>
      )}
      
      <iframe 
        src={getPlayerUrl()} 
        title={`${title} - Stream Player`}
        className="w-full h-full border-0"
        allowFullScreen
        allow="autoplay; encrypted-media; picture-in-picture"
        onLoad={() => setIsLoading(false)}
        onError={handlePlayerError}
      />
      
      <div className="absolute top-4 left-4 flex items-center z-20 pointer-events-none">
        <span className="bg-red-600 rounded-full h-3 w-3 animate-pulse mr-2"></span>
        <span className="text-white font-semibold text-sm">LIVE</span>
      </div>
      
      {!isLoading && (
        <div className="absolute bottom-4 right-4 z-20">
          <button 
            onClick={handlePlayerError}
            className="bg-black/60 hover:bg-black/80 text-white text-xs px-3 py-1 rounded backdrop-blur-sm"
          >
            Try another player
          </button>
        </div>
      )}
    </div>
  );
} 