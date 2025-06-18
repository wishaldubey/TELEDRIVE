export default function CinemaLoading() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header Skeleton */}
      <header className="fixed top-0 w-full z-50 px-4 py-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="w-32 h-8 bg-gray-800 rounded-md animate-pulse" />
          <div className="flex space-x-4">
            <div className="w-24 h-8 bg-gray-800 rounded-md animate-pulse" />
          </div>
        </div>
      </header>

      {/* Hero Skeleton */}
      <div className="relative h-screen w-full mt-16">
        <div className="w-full h-full bg-gradient-to-b from-gray-900 to-black animate-pulse" />
        <div className="absolute bottom-20 left-0 px-4 md:px-12 w-full">
          <div className="container mx-auto">
            <div className="w-3/4 md:w-1/2 h-12 bg-gray-800 rounded-md animate-pulse mb-4" />
            <div className="w-full md:w-3/4 h-6 bg-gray-800 rounded-md animate-pulse mb-2" />
            <div className="w-2/3 md:w-1/2 h-6 bg-gray-800 rounded-md animate-pulse mb-8" />
            <div className="flex space-x-4">
              <div className="w-32 h-10 bg-gray-800 rounded-md animate-pulse" />
              <div className="w-32 h-10 bg-gray-800 rounded-md animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Movie Categories Skeleton */}
      <div className="px-4 md:px-12 py-8">
        <div className="container mx-auto">
          {[1, 2, 3].map((i) => (
            <div key={i} className="mb-12">
              <div className="w-48 h-8 bg-gray-800 rounded-md animate-pulse mb-6" />
              <div className="grid grid-flow-col auto-cols-max gap-4 overflow-x-auto no-scrollbar">
                {Array.from({ length: 6 }).map((_, j) => (
                  <div key={j} className="w-60">
                    <div className="w-full aspect-[2/3] bg-gray-800 rounded-md animate-pulse mb-2" />
                    <div className="w-3/4 h-6 bg-gray-800 rounded-md animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 