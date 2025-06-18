"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { LogOut, Film, ArrowLeft, Download, Calendar, Star, Tag, Flag, Clock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { use } from "react";

interface Movie {
  _id: string;
  title: string;
  poster_url?: string;
  backdrop_url?: string;
  overview?: string;
  genres: string[];
  release_year?: number;
  vote_average?: number;
  file_id: string;
  file_name: string;
  message_id: number;
  uploaded_at: string;
  runtime?: number;
  country?: string;
  downloads?: string[];
}

export default function MovieDetail({ params }: { params: { movieId: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  
  // Get movieId directly from params
  const { movieId } = params;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [user, setUser] = useState<any>(null);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [loadingWatchlist, setLoadingWatchlist] = useState(false);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/auth/user');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setUser(data);
            fetchWatchlist(); // Fetch watchlist after getting user data
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  // Fetch user's watchlist
  const fetchWatchlist = async () => {
    if (loadingWatchlist) return;
    
    setLoadingWatchlist(true);
    try {
      const response = await fetch('/api/user/watchlist/get');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.movies) {
          // Extract only the movie IDs for easy checking
          const watchlistIds = data.movies.map((movie: Movie) => movie._id);
          setWatchlist(watchlistIds);
        }
      }
    } catch (error) {
      console.error('Error fetching watchlist:', error);
    } finally {
      setLoadingWatchlist(false);
    }
  };
  
  // Toggle watchlist status for a movie
  const toggleWatchlist = async () => {
    if (!user || !movie) {
      toast({
        title: "Authentication Required",
        description: "Please log in to add movies to your watchlist",
        variant: "destructive"
      });
      router.push('/login');
      return;
    }
    
    const isInWatchlist = watchlist.includes(movie._id);
    
    // Optimistic UI update
    if (isInWatchlist) {
      setWatchlist(watchlist.filter(id => id !== movie._id));
    } else {
      setWatchlist([...watchlist, movie._id]);
    }
    
    try {
      const endpoint = isInWatchlist ? 'remove' : 'add';
      const response = await fetch(`/api/user/watchlist/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ movieId: movie._id })
      });
      
      if (!response.ok) {
        // Revert optimistic update on error
        if (isInWatchlist) {
          setWatchlist([...watchlist, movie._id]);
        } else {
          setWatchlist(watchlist.filter(id => id !== movie._id));
        }
        
        throw new Error('Failed to update watchlist');
      }
      
      toast({
        title: isInWatchlist ? "Removed from Watchlist" : "Added to Watchlist",
        description: isInWatchlist ? "Movie removed from your watchlist" : "Movie added to your watchlist",
      });
      
    } catch (error) {
      console.error('Error updating watchlist:', error);
      toast({
        title: "Error",
        description: "Failed to update your watchlist",
        variant: "destructive"
      });
    }
  };

  // Fetch movie details
  useEffect(() => {
    const fetchMovieDetails = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/movies/${movieId}`);
        
        if (!response.ok) {
          throw new Error(`Error fetching movie details: ${response.status}`);
        }
        
        const data = await response.json();
        setMovie(data);
      } catch (err: any) {
        setError(err.message || "Failed to load movie details");
        console.error("Error fetching movie details:", err);
      } finally {
        setLoading(false);
      }
    };
    
    if (movieId) {
      fetchMovieDetails();
    }
  }, [movieId]);

  // Handle download/forward to Telegram
  const handleDownload = async () => {
    if (!movie || !user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to download movies",
        variant: "destructive"
      });
      router.push('/login');
      return;
    }
    
    setDownloadLoading(true);
    try {
      // Log the download
      await fetch(`/api/movies/${movie._id}/log-download`, {
        method: 'POST'
      });
      
      // Download the movie
      const response = await fetch(`/api/movies/download/${movie._id}`, {
        method: 'POST',
      });
      
      if (response.ok) {
        toast({
          title: "Sent to Telegram",
          description: `"${movie.title}" has been sent to your Telegram account`,
          variant: "default",
          className: "border-l-4 border-red-600 bg-black/90 backdrop-blur-sm",
        });
      } else {
        throw new Error('Failed to send movie');
      }
    } catch (error) {
      console.error("Error forwarding movie:", error);
      toast({
        title: "Error",
        description: "Failed to send movie to Telegram. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDownloadLoading(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      router.push('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Generate avatar initials from name or username
  const getInitials = () => {
    if (!user) return 'U';
    
    if (user.first_name && user.last_name) {
      return (user.first_name[0] + user.last_name[0]).toUpperCase();
    } else if (user.first_name) {
      return user.first_name.substring(0, 2).toUpperCase();
    }
    return (user.username || 'U').substring(0, 2).toUpperCase();
  };

  const getDisplayName = () => {
    if (!user) return 'User';
    
    if (user.first_name || user.last_name) {
      return [user.first_name, user.last_name].filter(Boolean).join(' ');
    }
    return user.username;
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }).format(date);
  };

  // Format runtime
  const formatRuntime = (minutes?: number) => {
    if (!minutes) return "Unknown";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Check if movie is in watchlist
  const isInWatchlist = movie && watchlist.includes(movie._id);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Netflix-style header with user info */}
      <header className="fixed top-0 w-full bg-gradient-to-b from-black/80 via-black/60 to-transparent z-50 backdrop-blur-sm">
        <div className="container mx-auto py-4 px-4">
          <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
  <Link
    href="/cinema"
    className="text-2xl font-bold text-red-600"
    style={{ fontFamily: 'BebasNeue' }}
  >
    CINEMA
  </Link>

              <nav className="hidden md:flex space-x-6">
                <Link href="/cinema" className="text-gray-400 hover:text-white transition-colors">
                  Home
                </Link>
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              {/* User profile dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="rounded-full h-10 w-10 p-0 hover:bg-gray-800/50 relative">
                    <Avatar className="h-9 w-9 border-2 border-red-600/30 hover:border-red-600/60 transition-all duration-200">
                      <AvatarImage 
                        src={user?.profile_photo_url || ''} 
                        alt={getDisplayName()}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-red-800/50 to-red-500/30 text-white text-sm font-medium">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-black/95 border-gray-800 text-white">
                  <div className="flex items-center gap-3 p-3 border-b border-gray-800 mb-1">
                    <Avatar className="h-10 w-10">
                      <AvatarImage 
                        src={user?.profile_photo_url || ''} 
                        alt={getDisplayName()}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-red-800/50 to-red-500/30 text-white text-sm">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm truncate max-w-[180px]">
                        {getDisplayName()}
                      </span>
                      <span className="text-gray-400 text-xs">
                        {user?.username}
                      </span>
                    </div>
                  </div>
                  
                  {/* Link to Watchlist */}
                  <DropdownMenuItem 
                    className="cursor-pointer hover:bg-gray-800 text-sm"
                    onClick={() => router.push('/profile/watchlist')}
                  >
                    <Star className="mr-2 h-4 w-4" />
                    <span>My Watchlist</span>
                  </DropdownMenuItem>
                  
                  {/* If the user has Drive Mode access, show link to dashboard */}
                  {user?.channel_id && (
                    <DropdownMenuItem 
                      className="cursor-pointer hover:bg-gray-800 text-sm"
                      onClick={() => router.push('/dashboard')}
                    >
                      <Film className="mr-2 h-4 w-4" />
                      <span>Go to Drive</span>
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuItem 
                    className="cursor-pointer hover:bg-gray-800 text-sm text-red-500 hover:text-red-400"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main content - added pt-24 to ensure content doesn't get hidden under the fixed header */}
      <main className="pt-24">
        {loading ? (
          <div className="flex justify-center items-center min-h-screen">
            <img src="/loader.gif" alt="Loading..." className="w-16 h-16" />
          </div>
        ) : error ? (
          <div className="flex flex-col justify-center items-center min-h-screen p-4">
            <h1 className="text-2xl font-bold text-red-500 mb-4">Error Loading Movie</h1>
            <p className="text-gray-400 mb-8">{error}</p>
            <Button variant="outline" onClick={() => router.push('/cinema')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Cinema
            </Button>
          </div>
        ) : movie ? (
          <>
            {/* Back button - moved above the poster and below the header */}
            <div className="container mx-auto px-4 mb-4">
              <Button 
                variant="ghost" 
                className="text-white hover:bg-black/30"
                onClick={() => router.back()}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </div>
            
            {/* Backdrop with gradient overlay - adjusted top padding to account for fixed header */}
            <div className="relative h-[70vh] w-full mt-4">
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{ 
                  backgroundImage: `url('/api/movies/thumbnail/${movie._id}')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/90 to-transparent" />
              
              {/* Movie details container */}
              <div className="container mx-auto px-4 relative h-full flex flex-col justify-end pb-16">
                
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  {/* Movie poster */}
                  <div className="w-48 h-72 rounded-md overflow-hidden shadow-xl flex-shrink-0 hidden md:block">
                    <img 
                      src={`/api/movies/thumbnail/${movie._id}`}
                      alt={movie.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Movie information */}
                  <div className="flex-1">
                    <h1 className="text-4xl font-bold mb-2 line-clamp-2 md:line-clamp-none" title={movie.title}>{movie.title}</h1>
                    
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-300 mb-4">
                      {movie.release_year && (
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>{movie.release_year}</span>
                        </div>
                      )}
                      {movie.runtime && (
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>{formatRuntime(movie.runtime)}</span>
                        </div>
                      )}
                      {movie.vote_average && (
                        <div className="flex items-center">
                          <Star className="h-4 w-4 mr-1 text-yellow-500" />
                          <span>{movie.vote_average.toFixed(1)}</span>
                        </div>
                      )}
                      {movie.country && (
                        <div className="flex items-center">
                          <Flag className="h-4 w-4 mr-1" />
                          <span>{movie.country}</span>
                        </div>
                      )}
                      {movie.downloads && (
                        <div className="flex items-center">
                          <Download className="h-4 w-4 mr-1" />
                          <span>{movie.downloads.length} downloads</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Genres */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {movie.genres && movie.genres.map((genre) => (
                        <Link 
                          key={genre} 
                          href={`/cinema?genre=${encodeURIComponent(genre)}`}
                          className="bg-red-900/60 hover:bg-red-800 px-3 py-1 rounded-full text-xs font-medium flex items-center"
                        >
                          <Tag className="h-3 w-3 mr-1" />
                          {genre}
                        </Link>
                      ))}
                    </div>
                    
                    {/* Overview */}
                    {movie.overview && (
                      <p className="text-gray-300 mb-8 max-w-2xl">{movie.overview}</p>
                    )}
                    
                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-3">
                      {/* Watch/Download button */}
                      <Button 
                        onClick={handleDownload}
                        disabled={downloadLoading}
                        className="bg-red-600 hover:bg-red-700 text-white py-2 px-6 rounded-md flex items-center"
                      >
                        {downloadLoading ? (
                          <>
                            <img src="/loader.gif" alt="Loading..." className="mr-2 h-5 w-5" />
                            Sending to Telegram...
                          </>
                        ) : (
                          <>
                            <Download className="mr-2 h-5 w-5" />
                            Send to Telegram
                          </>
                        )}
                      </Button>
                      
                      {/* Watchlist button */}
                      <Button 
                        onClick={toggleWatchlist}
                        className="bg-gray-800 hover:bg-gray-700 text-white py-2 px-6 rounded-md flex items-center"
                      >
                        {isInWatchlist ? (
                          <>
                            <Star className="mr-2 h-5 w-5 fill-yellow-400 text-yellow-400" />
                            Remove from Watchlist
                          </>
                        ) : (
                          <>
                            <Star className="mr-2 h-5 w-5" />
                            Add to Watchlist
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Additional movie details */}
            <div className="container mx-auto px-4 py-12">
              <div className="bg-gray-900/50 rounded-lg p-6 backdrop-blur-sm">
                <h2 className="text-xl font-bold mb-4">File Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300">
                  <div>
                    <span className="block text-gray-400">File Name</span>
                    <span className="block truncate max-w-full hover:whitespace-normal hover:text-clip" title={movie.file_name}>{movie.file_name}</span>
                  </div>
                  <div>
                    <span className="block text-gray-400">Added On</span>
                    <span>{formatDate(movie.uploaded_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
} 