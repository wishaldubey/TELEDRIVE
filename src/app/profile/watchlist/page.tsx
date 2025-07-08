"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { Star } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// Define interface for movie data
interface Movie {
  _id: string;
  title: string;
  poster_url?: string;
  genres: string[];
  release_year?: number;
  vote_average?: number;
  file_id: string;
  file_name: string;
  message_id: number;
  uploaded_at: string;
  updatedAt?: string;
}

interface WatchlistResponse {
  success: boolean;
  movies: Movie[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function Watchlist() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [user, setUser] = useState<any>(null);
  
  const router = useRouter();
  const { toast } = useToast();
  
  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/auth/user');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setUser(data);
          } else {
            // User not logged in, redirect to login
            router.push('/login');
          }
        } else {
          // User not logged in, redirect to login
          router.push('/login');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Failed to authenticate. Please log in again.');
      }
    };

    fetchUserData();
  }, [router]);

  // Fetch watchlist
  useEffect(() => {
    const fetchWatchlist = async () => {
      if (!user) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/user/watchlist/get?page=${currentPage}`);
        
        if (!response.ok) {
          throw new Error(`Error fetching watchlist: ${response.status}`);
        }
        
        const data: WatchlistResponse = await response.json();
        
        if (data.success) {
          setMovies(data.movies);
          setTotalPages(data.pagination.totalPages);
        } else {
          throw new Error('Failed to load watchlist');
        }
      } catch (err: any) {
        setError(err.message || "An error occurred");
        console.error("Error fetching watchlist:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchWatchlist();
  }, [user, currentPage]);

  // Remove from watchlist
  const removeFromWatchlist = async (movieId: string) => {
    try {
      // Optimistic UI update
      setMovies(movies.filter(movie => movie._id !== movieId));
      
      const response = await fetch('/api/user/watchlist/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ movieId })
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove from watchlist');
      }
      
      toast({
        title: "Removed from Watchlist",
        description: "Movie removed from your watchlist"
      });
      
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      toast({
        title: "Error",
        description: "Failed to remove from watchlist",
        variant: "destructive"
      });
      
      // Refetch the watchlist to restore correct state
      const response = await fetch(`/api/user/watchlist/get?page=${currentPage}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMovies(data.movies);
        }
      }
    }
  };

  // Handle pagination
  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0); // Scroll to top when changing page
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="fixed top-0 w-full bg-gradient-to-b from-black/80 via-black/60 to-transparent z-50 backdrop-blur-sm">
        <div className="container mx-auto py-4 px-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              {/* Mobile Navigation - Moved to the left */}
              <nav className="md:hidden mr-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56 bg-black/95 border-gray-800 text-white">
                    <DropdownMenuItem 
                      className="cursor-pointer hover:bg-gray-800 text-sm"
                      onClick={() => router.push('/cinema')}
                    >
                      <span>Home</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="cursor-pointer hover:bg-gray-800 text-sm"
                      onClick={() => router.push('/cinema?genre=Action')}
                    >
                      <span>Action</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="cursor-pointer hover:bg-gray-800 text-sm"
                      onClick={() => router.push('/cinema?genre=Adventure')}
                    >
                      <span>Adventure</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="cursor-pointer hover:bg-gray-800 text-sm"
                      onClick={() => router.push('/cinema?genre=Animation')}
                    >
                      <span>Animation</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="cursor-pointer hover:bg-gray-800 text-sm"
                      onClick={() => router.push('/cinema?genre=Comedy')}
                    >
                      <span>Comedy</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="cursor-pointer hover:bg-gray-800 text-sm"
                      onClick={() => router.push('/cinema?genre=Crime')}
                    >
                      <span>Crime</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="cursor-pointer hover:bg-gray-800 text-sm"
                      onClick={() => router.push('/profile/watchlist')}
                    >
                      <span>My Watchlist</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="cursor-pointer hover:bg-gray-800 text-sm"
                      onClick={() => router.push('/profile/request-movie')}
                    >
                      <span>Request Movie</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </nav>
              
              <div className="flex items-center">
                <Link href="/cinema" className="text-2xl font-bold text-red-600 mr-10 cinema-text">
                  CINEMA
                </Link>
              </div>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center">
                <Link href="/cinema" className="text-gray-400 hover:text-white transition-colors mr-8">
                  Home
                </Link>
                <Link href={`/cinema?genre=Action`} className="text-gray-400 hover:text-white transition-colors mr-8">
                  Action
                </Link>
                <Link href={`/cinema?genre=Adventure`} className="text-gray-400 hover:text-white transition-colors mr-8">
                  Adventure
                </Link>
                <Link href={`/cinema?genre=Animation`} className="text-gray-400 hover:text-white transition-colors mr-8">
                  Animation
                </Link>
                <Link href={`/cinema?genre=Comedy`} className="text-gray-400 hover:text-white transition-colors mr-8">
                  Comedy
                </Link>
                <Link href={`/cinema?genre=Crime`} className="text-gray-400 hover:text-white transition-colors mr-8">
                  Crime
                </Link>
                <Link href="/profile/request-movie" className="text-gray-400 hover:text-white transition-colors">
                  Request Movie
                </Link>
              </nav>
            </div>

            <h1 className="text-xl font-medium ml-4">
              ⭐ My Watchlist
            </h1>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-10">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="min-h-[50vh]">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="overflow-hidden rounded-md aspect-[2/3]">
                    <div className="w-full h-full bg-gray-800 rounded-md animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <h2 className="text-2xl font-bold mb-4">Error</h2>
              <p className="text-red-500">{error}</p>
              <Button className="mt-4" onClick={() => router.push('/login')}>
                Go to Login
              </Button>
            </div>
          ) : (
            <>
              {movies.length === 0 ? (
                <div className="text-center py-16">
                  <h2 className="text-xl mb-2">Your watchlist is empty</h2>
                  <p className="text-gray-400 mb-6">Browse movies and add them to your watchlist</p>
                  <Button onClick={() => router.push('/cinema')}>
                    Browse Movies
                  </Button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                    {movies.map((movie) => (
                      <div key={movie._id} className="relative w-full">
                        <Link href={`/cinema/${movie._id}`} className="group block w-full">
                          <div className="overflow-hidden rounded-md aspect-[2/3] relative">
                            <img 
                              src={`/api/movies/thumbnail/${movie._id}?t=${movie.updatedAt ? new Date(movie.updatedAt).getTime() : Date.now()}`} 
                              alt={movie.title}
                              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                              <p className="font-medium line-clamp-2">{movie.title}</p>
                              <div className="flex items-center justify-between text-xs text-gray-300 mt-1">
                                <span>{movie.release_year}</span>
                                {movie.vote_average && (
                                  <span>⭐ {movie.vote_average.toFixed(1)}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </Link>
                        <button 
                          className="absolute top-2 right-2 z-20 p-1 rounded-full bg-black/50"
                          onClick={() => removeFromWatchlist(movie._id)}
                          aria-label="Remove from watchlist"
                        >
                          <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center mt-8 gap-2">
                      <Button
                        variant="outline"
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="bg-gray-800 border-gray-700 text-white"
                      >
                        Previous
                      </Button>
                      
                      {[...Array(totalPages)].map((_, index) => {
                        const pageNum = index + 1;
                        // Only show 5 pages at a time
                        if (
                          pageNum === 1 ||
                          pageNum === totalPages ||
                          (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                        ) {
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              onClick={() => goToPage(pageNum)}
                              className={currentPage === pageNum 
                                ? "bg-red-600 text-white" 
                                : "bg-gray-800 border-gray-700 text-white"
                              }
                            >
                              {pageNum}
                            </Button>
                          );
                        }
                        // Show ellipsis
                        else if (
                          pageNum === currentPage - 2 ||
                          pageNum === currentPage + 2
                        ) {
                          return (
                            <Button 
                              key={pageNum} 
                              variant="outline" 
                              disabled
                              className="bg-gray-800 border-gray-700 text-white"
                            >
                              ...
                            </Button>
                          );
                        }
                        return null;
                      })}
                      
                      <Button
                        variant="outline"
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="bg-gray-800 border-gray-700 text-white"
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
