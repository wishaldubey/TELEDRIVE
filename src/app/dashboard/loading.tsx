import React from 'react';

export default function DashboardLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-background relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 -right-20 w-[500px] h-[500px] bg-cyan/10 rounded-full filter blur-[80px] opacity-40"></div>
        <div className="absolute bottom-0 -left-20 w-[500px] h-[500px] bg-primary/10 rounded-full filter blur-[80px] opacity-40"></div>
        <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 w-[300px] h-[300px] bg-pink/10 rounded-full filter blur-[80px] opacity-20"></div>
      </div>
      
      {/* Header skeleton */}
      <div className="border-b border-border/40 bg-card/30 sticky top-0 z-10 backdrop-blur-sm shadow-sm">
        <div className="container mx-auto px-4 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary/20 animate-pulse"></div>
            <div className="h-6 w-24 bg-primary/20 rounded-md animate-pulse"></div>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-8 w-32 bg-background/50 rounded-full animate-pulse"></div>
            <div className="h-10 w-10 rounded-full bg-primary/20 animate-pulse"></div>
          </div>
        </div>
      </div>
      
      {/* Main content skeleton */}
      <main className="flex-1 container mx-auto px-4 py-6 md:py-8 max-w-7xl relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div className="h-8 w-32 bg-primary/20 rounded-md animate-pulse"></div>
          <div className="h-8 w-40 bg-card/30 rounded-full animate-pulse"></div>
        </div>
        
        <div className="bg-card/20 backdrop-blur-sm rounded-xl border border-border/40 p-5 shadow-lg">
          {/* Grid skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className="bg-card/50 rounded-lg p-4 border border-border/30 animate-pulse">
                <div className="h-6 w-3/4 bg-primary/10 rounded-md mb-4"></div>
                <div className="h-32 w-full bg-primary/10 rounded-md mb-4"></div>
                <div className="h-4 w-1/2 bg-primary/10 rounded-md mb-4"></div>
                <div className="h-8 w-1/3 bg-primary/10 rounded-md ml-auto"></div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
} 