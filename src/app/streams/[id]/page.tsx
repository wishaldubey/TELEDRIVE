"use client";

import React from 'react';
import { useRouter, notFound } from 'next/navigation';
import { streams } from '@/lib/streams';
import StreamPlayer from '@/components/StreamPlayer';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

interface StreamPageProps {
  params: {
    id: string;
  };
}

export default function StreamPage({ params }: StreamPageProps) {
  const router = useRouter();
  const { id } = params;
  
  // Find the stream with the matching ID
  const stream = streams.find(s => s.id === id);
  
  // If the stream doesn't exist, return 404
  if (!stream) {
    notFound();
  }
  
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Back button header */}
      <header className="fixed top-0 left-0 w-full z-50 bg-gradient-to-b from-black/80 via-black/40 to-transparent p-4">
        <div className="container mx-auto">
          <div className="flex items-center">
            <Link href="/streams">
              <Button variant="ghost" className="text-white hover:bg-white/10" size="sm">
                <ChevronLeft className="h-5 w-5 mr-1" />
                Back to Streams
              </Button>
            </Link>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-1 pt-16 pb-8 container mx-auto px-4 max-w-screen-2xl">
        <div className="w-full mx-auto max-w-screen-2xl">
          {/* Stream Player */}
          <div className="rounded-lg overflow-hidden shadow-2xl mb-6">
            <StreamPlayer stream={stream} />
          </div>
          
          {/* Stream info */}
          <div className="mb-10">
            <h1 className="text-2xl font-bold mb-2 flex items-center">
              {stream.title}
              <span className="ml-3 inline-flex items-center bg-red-600/20 border border-red-600/50 rounded-full px-2 py-0.5">
                <span className="bg-red-600 rounded-full h-2 w-2 animate-pulse mr-1.5"></span>
                <span className="text-xs font-medium text-red-400">LIVE</span>
              </span>
            </h1>
            
            <p className="text-gray-400">{stream.description}</p>
          </div>
        </div>
      </main>
    </div>
  );
} 