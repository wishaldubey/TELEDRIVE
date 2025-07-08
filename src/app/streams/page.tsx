"use client";

import React from 'react';
import Link from 'next/link';
import { streams } from '@/lib/streams';
import StreamCard from '@/components/StreamCard';

export default function StreamsPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header with navigation and title */}
      <header className="fixed top-0 w-full bg-gradient-to-b from-black/80 via-black/60 to-transparent z-50 backdrop-blur-sm">
        <div className="container mx-auto py-4 px-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Link href="/cinema" className="text-2xl font-bold text-red-600 mr-10 cinema-text">
                CINEMA
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center">
                <Link href="/cinema" className="text-gray-400 hover:text-white transition-colors mr-8">
                  Home
                </Link>
                <Link href="/streams" className="text-white mr-8 font-medium">
                  Live Streams
                </Link>
                <Link href="/profile/request-movie" className="text-gray-400 hover:text-white transition-colors">
                  Request Movie
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-16 container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Live Streams</h1>
          <div className="flex items-center">
            <div className="flex items-center">
              <span className="bg-red-600 rounded-full h-2 w-2 animate-pulse mr-2"></span>
              <span className="text-sm text-gray-400">Live Now</span>
            </div>
          </div>
        </div>

        {/* Streams Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {streams.map((stream) => (
            <div key={stream.id}>
              <StreamCard stream={stream} />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
} 