"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Stream } from '@/lib/streams';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play } from 'lucide-react';

interface StreamCardProps {
  stream: Stream;
}

export default function StreamCard({ stream }: StreamCardProps) {
  return (
    <Card className="bg-black border-gray-800 hover:border-gray-700 transition-all duration-300 overflow-hidden h-full flex flex-col group">
      <div className="relative aspect-video overflow-hidden">
        <Image
          src={stream.poster || '/live.jpg'}
          alt={stream.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-60 group-hover:opacity-50 transition-opacity" />
        
        <div className="absolute top-2 left-2">
          <div className="flex items-center">
            <span className="bg-red-600 rounded-full h-2 w-2 animate-pulse mr-1.5"></span>
            <span className="text-xs font-semibold text-white bg-black/50 px-1.5 py-0.5 rounded-sm backdrop-blur-sm">
              LIVE
            </span>
          </div>
        </div>
      </div>
      
      <CardContent className="p-4 flex-1 flex flex-col">
        <h3 className="font-semibold text-lg text-white mb-1 line-clamp-1">
          {stream.title}
        </h3>
        
        <p className="text-gray-400 text-sm mb-4 line-clamp-2 flex-1">
          {stream.description}
        </p>
        
        <Link href={`/streams/${stream.id}`} className="mt-auto">
          <Button className="w-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2">
            <Play size={16} /> Watch Now
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
} 