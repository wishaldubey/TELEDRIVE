"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Stream } from '@/lib/streams';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { getProxyUrl } from '@/lib/utils';
import FallbackPlayer from './streams/FallbackPlayer';

interface StreamPlayerProps {
  stream: Stream;
}

export default function StreamPlayer({ stream }: StreamPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPipSupported, setIsPipSupported] = useState(false);
  
  // Check if this is a Google DAI stream and set proper flags
  const isGoogleStream = stream.streamUrl.includes('dai.google.com');
  const isAkamaiStream = stream.streamUrl.includes('akamaized.net') || stream.streamUrl.includes('akamaicdn');
  
  // Add timestamp to force cache busting for Google DAI and similar streams
  const forceCacheBusting = isGoogleStream || isAkamaiStream;
  
  // Use proxy URL to avoid CORS issues - with cache busting for protected streams
  const proxyStreamUrl = getProxyUrl(stream.streamUrl, forceCacheBusting);
  
  // Track if we're using the fallback player
  const [useFallback, setUseFallback] = useState(false);
  
  // Track recovery attempts
  const recoveryAttempts = useRef(0);

  // Handle fallback switch
  const switchToFallback = () => {
    console.log('Switching to fallback player');
    setUseFallback(true);
    setError(null);
    setLoading(false);
  };

  useEffect(() => {
    // If already using fallback, don't initialize HLS
    if (useFallback) return;
    
    let hlsInstance: any = null;
    let errorTimeout: NodeJS.Timeout | null = null;
    
    // Check if Picture-in-Picture is supported
    setIsPipSupported(
      document.pictureInPictureEnabled && 
      !!(document.createElement('video').requestPictureInPicture)
    );

    // Initialize the video player
    const initializePlayer = async () => {
      if (!videoRef.current) return;
      
      console.log(`Initializing player for stream: ${stream.title}`);
      console.log(`Using proxy URL: ${proxyStreamUrl}`);

      try {
        const video = videoRef.current;
        video.volume = 0.5; // Set initial volume
        
        // Check if native HLS playback is supported (Safari)
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          console.log('Using native HLS playback (Safari)');
          video.src = proxyStreamUrl;
          video.addEventListener('loadedmetadata', () => {
            setLoading(false);
            video.play().catch(e => {
              console.error('Error playing video:', e);
              setError('Error auto-playing video. Please click play.');
            });
          });
          
          // Add error listener
          video.addEventListener('error', (e) => {
            console.error('Video error:', video.error);
            setError('Error loading video. Try using external player.');
            
            if (recoveryAttempts.current < 2) {
              // Try one more time with a new cache-busted URL
              recoveryAttempts.current++;
              const freshProxyUrl = getProxyUrl(stream.streamUrl, true);
              console.log(`Retry attempt ${recoveryAttempts.current} with fresh URL: ${freshProxyUrl}`);
              video.src = freshProxyUrl;
            } else {
              // After retries, switch to fallback
              switchToFallback();
            }
          });
          
          return;
        }

        // For browsers that don't support HLS natively, use hls.js
        try {
          // Dynamically import hls.js
          const Hls = (await import('hls.js')).default;
          
          if (Hls.isSupported()) {
            console.log('Using HLS.js for playback');
            
            // Configure HLS.js with optimized settings
            const hlsConfig = {
              enableWorker: true,
              lowLatencyMode: isGoogleStream, // Enable low latency for Google streams
              backBufferLength: isGoogleStream ? 30 : 90, // Smaller buffer for Google DAI streams
              liveSyncDuration: isGoogleStream ? 1 : 3,
              liveMaxLatencyDuration: isGoogleStream ? 10 : 30,
              maxBufferLength: isGoogleStream ? 15 : 30,
              fragLoadingMaxRetry: 8,
              manifestLoadingMaxRetry: 8,
              levelLoadingMaxRetry: 8,
              appendErrorMaxRetry: 5,
              maxMaxBufferLength: isGoogleStream ? 30 : 60,
              startLevel: -1, // Auto start with best quality
              abrEwmaDefaultEstimate: 500000, // 500kbps default
              abrEwmaSlowVoD: 0.9,
              abrBandWidthFactor: 0.95,
              xhrSetup: (xhr: XMLHttpRequest, url: string) => {
                // Log XHR requests for debugging
                console.log(`HLS.js XHR request: ${url.substring(0, 100)}...`);
              },
              debug: false
            };
            
            // Create and configure HLS instance
            const hls = new Hls(hlsConfig);
            hlsInstance = hls;
            
            let recoverDecodingErrorDate = 0;
            let recoverSwapAudioCodecDate = 0;
            
            // Add event listeners before loading source
            hls.on(Hls.Events.ERROR, (event, data) => {
              console.warn('HLS.js error:', data);
              
              if (data.fatal) {
                console.error('Fatal HLS.js error:', data);
                
                switch(data.type) {
                  case Hls.ErrorTypes.NETWORK_ERROR:
                    // Handle network errors
                    console.log('Fatal network error encountered, trying to recover');
                    if (recoveryAttempts.current < 5) {
                      recoveryAttempts.current++;
                      
                      // Generate a fresh URL with cache busting
                      const freshProxyUrl = getProxyUrl(stream.streamUrl, true);
                      console.log(`Recovery attempt ${recoveryAttempts.current} with fresh URL: ${freshProxyUrl}`);
                      
                      hls.loadSource(freshProxyUrl);
                      hls.startLoad();
                    } else {
                      console.error('Too many recovery attempts, switching to fallback');
                      setError(`Stream loading failed after multiple attempts.`);
                      
                      // Set timeout to switch to fallback player
                      if (errorTimeout) clearTimeout(errorTimeout);
                      errorTimeout = setTimeout(() => {
                        switchToFallback();
                      }, 3000);
                    }
                    break;
                    
                  case Hls.ErrorTypes.MEDIA_ERROR:
                    console.log('Fatal media error encountered, trying to recover');
                    const now = Date.now();
                    
                    if (now - recoverDecodingErrorDate > 3000) {
                      recoverDecodingErrorDate = now;
                      console.log('Trying to recover media error');
                      hls.recoverMediaError();
                    } else if (now - recoverSwapAudioCodecDate > 3000) {
                      recoverSwapAudioCodecDate = now;
                      console.log('Trying to swap audio codec and recover');
                      hls.swapAudioCodec();
                      hls.recoverMediaError();
                    } else {
                      console.error('Cannot recover, switching to fallback');
                      setError(`Media error couldn't be recovered.`);
                      
                      // Set timeout to switch to fallback player
                      if (errorTimeout) clearTimeout(errorTimeout);
                      errorTimeout = setTimeout(() => {
                        switchToFallback();
                      }, 3000);
                    }
                    break;
                    
                  default:
                    // Cannot recover
                    console.error('Fatal error, cannot recover:', data);
                    hls.destroy();
                    setError(`Stream loading error. Try external player.`);
                    
                    // Set timeout to switch to fallback player
                    if (errorTimeout) clearTimeout(errorTimeout);
                    errorTimeout = setTimeout(() => {
                      switchToFallback();
                    }, 3000);
                    break;
                }
              }
              // For non-fatal errors, just log them
              else if (data.details === Hls.ErrorDetails.LEVEL_LOAD_ERROR && isGoogleStream) {
                console.warn('Level load error for Google DAI stream:', data);
                // For Google DAI streams, these errors can be common, try to recover
                if (recoveryAttempts.current < 10) {
                  recoveryAttempts.current++;
                  // Try reinitializing with a fresh URL
                  const freshProxyUrl = getProxyUrl(stream.streamUrl, true);
                  console.log(`Level load retry ${recoveryAttempts.current} with fresh URL: ${freshProxyUrl}`);
                  
                  setTimeout(() => {
                    hls.loadSource(freshProxyUrl);
                  }, 1000);
                } else {
                  // If too many attempts, switch to fallback
                  console.error('Too many segment load errors, switching to fallback');
                  switchToFallback();
                }
              }
            });
            // Handle successful events
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              console.log('HLS manifest parsed successfully');
              setLoading(false);
              video.play().catch(e => {
                console.error('Error auto-playing video:', e);
                setError('Error auto-playing video. Please click play.');
              });
            });
            
            // Handle media attached
            hls.on(Hls.Events.MEDIA_ATTACHED, () => {
              console.log('HLS media attached successfully');
            });
            
            // Handle level loading
            hls.on(Hls.Events.LEVEL_LOADING, (event, data) => {
              console.log(`Loading level: ${data.level}`);
            });
            
            // Handle level loaded
            hls.on(Hls.Events.LEVEL_LOADED, (event, data) => {
              console.log(`Level loaded: ${data.level}`);
              // Reset recovery attempts on successful level load
              recoveryAttempts.current = 0;
            });
            
            // Handle stream loading
            console.log(`Loading HLS source: ${proxyStreamUrl}`);
            hls.loadSource(proxyStreamUrl);
            hls.attachMedia(video);
            
            // Handle cleanup
            return () => {
              if (hls) {
                hls.destroy();
              }
              if (errorTimeout) {
                clearTimeout(errorTimeout);
              }
            };
          } else {
            setError('HLS is not supported in your browser');
            // Automatically switch to fallback player
            switchToFallback();
          }
        } catch (error) {
          console.error('Error initializing HLS.js:', error);
          setError('Error loading video player');
          // Automatically switch to fallback after 3 seconds
          setTimeout(() => {
            switchToFallback();
          }, 3000);
        }
      } catch (error) {
        console.error('Error setting up video player:', error);
        setError('Error setting up video player');
      }
    };

    initializePlayer();
    
    // Clean up function
    return () => {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
      if (errorTimeout) {
        clearTimeout(errorTimeout);
      }
    };
  }, [proxyStreamUrl, useFallback, isGoogleStream, isAkamaiStream, stream.title, stream.streamUrl, forceCacheBusting]);

  // Handle Picture-in-Picture
  const togglePictureInPicture = async () => {
    if (!videoRef.current) return;
    
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (error) {
      console.error('PiP error:', error);
    }
  };

  // If using fallback player, render it instead
  if (useFallback) {
    return <FallbackPlayer streamUrl={stream.streamUrl} title={stream.title} />;
  }

  return (
    <div className="relative w-full h-full bg-black">
      {/* Video Player */}
      <div className="relative w-full aspect-video bg-black">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
            <Loader size="lg" />
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10 p-4">
            <p className="text-red-500 mb-2">{error}</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={() => window.location.reload()}
                variant="destructive"
                size="sm"
              >
                Try Again
              </Button>
              <Button
                onClick={switchToFallback}
                variant="outline"
                size="sm"
              >
                Use External Player
              </Button>
            </div>
          </div>
        )}
        
        <video
          ref={videoRef}
          muted
          controls
          autoPlay
          playsInline
          className="w-full h-full"
        ></video>
        
        {/* Live indicator overlay */}
        <div className="absolute top-4 left-4 flex items-center z-20 pointer-events-none">
          <span className="bg-red-600 rounded-full h-3 w-3 animate-pulse mr-2"></span>
          <span className="text-white font-semibold text-sm">LIVE</span>
        </div>

        {/* PiP button */}
        {isPipSupported && !loading && !error && (
          <Button
            onClick={togglePictureInPicture}
            className="absolute bottom-20 right-4 z-20 bg-black/50 hover:bg-black/70 backdrop-blur-sm"
            size="sm"
            variant="outline"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <rect width="14" height="10" x="5" y="7" rx="1" />
              <rect width="7" height="5" x="12" y="12" rx="1" />
            </svg>
            <span className="ml-2">PiP</span>
          </Button>
        )}
      </div>
    </div>
  );
} 