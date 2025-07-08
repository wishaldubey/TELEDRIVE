import React from 'react';
import { Loader } from '@/components/ui/loader';

export default function LoadingPage() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="flex flex-col items-center">
        <Loader size="lg" />
        <p className="mt-4 text-gray-400">Loading stream...</p>
      </div>
    </div>
  );
} 