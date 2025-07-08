"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { LogOut, Film, ArrowLeft, Download, Calendar, Star, Tag, Flag, Clock, Loader2, Edit, AlertTriangle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import type { ToastT } from 'sonner';
import { use } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SUPER_ADMINS, isSuperAdmin } from "@/lib/client-auth";

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
  updatedAt?: string;
}

// Simple multi-select component for genres
const MultiSelect = ({ 
  options, 
  selected, 
  onChange 
}: { 
  options: string[], 
  selected: string[], 
  onChange: (selected: string[]) => void 
}) => {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {options.map(option => (
        <button
          key={option}
          type="button"
          onClick={() => {
            if (selected.includes(option)) {
              onChange(selected.filter(item => item !== option));
            } else {
              onChange([...selected, option]);
            }
          }}
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            selected.includes(option) 
              ? 'bg-red-700 text-white' 
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
};

export default function MovieDetail({ params }: { params: { movieId: string } }) {
  const router = useRouter();
  
  // Get movieId directly from params
  const { movieId } = params;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [user, setUser] = useState<any>(null);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [loadingWatchlist, setLoadingWatchlist] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [flagDialogOpen, setFlagDialogOpen] = useState(false);
  const [flagReason, setFlagReason] = useState("");
  const [flagSubmitting, setFlagSubmitting] = useState(false);
  
  // State for edit form
  const [editForm, setEditForm] = useState({
    title: '',
    overview: '',
    genres: [] as string[],
    poster_url: '',
    release_year: '',
    vote_average: '',
    runtime: ''
  });
  const [availableGenres, setAvailableGenres] = useState<string[]>([
    'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary', 
    'Drama', 'Family', 'Fantasy', 'History', 'Horror', 'Music', 'Mystery',
    'Romance', 'Science Fiction', 'TV Movie', 'Thriller', 'War', 'Western'
  ]);
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/auth/user');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setUser(data);
            // Check if user is a super admin
            setIsSuperAdmin(SUPER_ADMINS.includes(data.user_id));
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
      toast.error("Please log in to add movies to your watchlist", {
        style: {
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          borderLeft: '4px solid #e50914',
          backdropFilter: 'blur(8px)',
        },
        duration: 3000,
      });
      router.push('/login');
      return;
    }
    
    const isInWatchlist = watchlist.includes(movie._id);
    const movieTitle = movie.title; // Store the movie title to avoid null checks
    
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
      
      if (isInWatchlist) {
        toast(`"${movieTitle}" removed from your watchlist`, {
          style: {
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            borderLeft: '4px solid #e50914',
            backdropFilter: 'blur(8px)',
            padding: '16px',
            fontSize: '14px',
            fontWeight: 500,
          },
          duration: 3000,
          icon: '✓',
        });
      } else {
        toast(`"${movieTitle}" added to your watchlist`, {
          style: {
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            borderLeft: '4px solid #e50914',
            backdropFilter: 'blur(8px)',
            padding: '16px',
            fontSize: '14px', 
            fontWeight: 500,
          },
          duration: 3000,
          icon: '★',
        });
      }
      
    } catch (error) {
      console.error('Error updating watchlist:', error);
      toast.error("Failed to update your watchlist", {
        style: {
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          borderLeft: '4px solid #e50914',
          backdropFilter: 'blur(8px)',
        },
        duration: 3000,
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
        
        // Populate edit form with movie data
        setEditForm({
          title: data.title || '',
          overview: data.overview || '',
          genres: data.genres || [],
          poster_url: data.poster_url || '',
          release_year: data.release_year ? data.release_year.toString() : '',
          vote_average: data.vote_average ? data.vote_average.toString() : '',
          runtime: data.runtime ? data.runtime.toString() : ''
        });
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
      toast.error("Please log in to download movies", {
        style: {
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          borderLeft: '4px solid #e50914',
          backdropFilter: 'blur(8px)',
        },
        duration: 3000,
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
        toast.success(`"${movie.title}" has been sent to your Telegram account`, {
          style: {
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            borderLeft: '4px solid #e50914',
            backdropFilter: 'blur(8px)',
            padding: '16px',
            fontSize: '14px',
            fontWeight: 500,
          },
          duration: 3000,
          icon: '✓',
        });
      } else {
        throw new Error('Failed to send movie');
      }
    } catch (error) {
      console.error("Error forwarding movie:", error);
      toast.error("Failed to send movie to Telegram. Please try again.", {
        style: {
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          borderLeft: '4px solid #e50914',
          backdropFilter: 'blur(8px)',
        },
        duration: 3000,
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

  // Handle edit form submission
  const handleEditSubmit = async () => {
    if (!movie || !isSuperAdmin) return;
    
    setEditSubmitting(true);
    try {
      // Format data for submission
      const formData = {
        title: editForm.title,
        overview: editForm.overview,
        genres: editForm.genres,
        poster_url: editForm.poster_url,
        release_year: editForm.release_year ? parseInt(editForm.release_year, 10) : undefined,
        vote_average: editForm.vote_average ? parseFloat(editForm.vote_average) : undefined,
        runtime: editForm.runtime ? parseInt(editForm.runtime, 10) : undefined
      };
      
      // Remove undefined values
      Object.keys(formData).forEach(key => {
        if (formData[key as keyof typeof formData] === undefined) {
          delete formData[key as keyof typeof formData];
        }
      });
      
      const response = await fetch(`/api/movies/${movieId}/edit`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        throw new Error(`Error updating movie: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Update local movie state with new data
        setMovie(data.movie);
        setEditDialogOpen(false);
        
        toast.success(`"${formData.title}" updated successfully`, {
          style: {
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            borderLeft: '4px solid #e50914',
            backdropFilter: 'blur(8px)',
          },
          duration: 3000,
        });
      } else {
        throw new Error(data.error || 'Failed to update movie');
      }
    } catch (error: any) {
      console.error('Error updating movie:', error);
      toast.error(error.message || "Failed to update movie", {
        style: {
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          borderLeft: '4px solid #e50914',
          backdropFilter: 'blur(8px)',
        },
        duration: 3000,
      });
    } finally {
      setEditSubmitting(false);
    }
  };
  
  // Handle flagging a movie
  const handleFlagMovie = async () => {
    if (!movie || !user) {
      toast.error("Please log in to flag movies", {
        style: {
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          borderLeft: '4px solid #e50914',
          backdropFilter: 'blur(8px)',
        },
        duration: 3000,
      });
      router.push('/login');
      return;
    }
    
    if (!flagReason.trim()) {
      toast.error("Please provide a reason for flagging this movie", {
        style: {
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          borderLeft: '4px solid #e50914',
          backdropFilter: 'blur(8px)',
        },
        duration: 3000,
      });
      return;
    }
    
    setFlagSubmitting(true);
    try {
      const response = await fetch(`/api/movies/${movieId}/flag`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          reason: flagReason,
          movieTitle: movie.title
        })
      });
      
      if (!response.ok) {
        throw new Error(`Error flagging movie: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setFlagDialogOpen(false);
        setFlagReason('');
        
        toast.success("Movie flagged successfully. Our team will review it.", {
          style: {
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            borderLeft: '4px solid #e50914',
            backdropFilter: 'blur(8px)',
          },
          duration: 3000,
        });
      } else {
        throw new Error(data.error || 'Failed to flag movie');
      }
    } catch (error: any) {
      console.error('Error flagging movie:', error);
      toast.error(error.message || "Failed to flag movie", {
        style: {
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          borderLeft: '4px solid #e50914',
          backdropFilter: 'blur(8px)',
        },
        duration: 3000,
      });
    } finally {
      setFlagSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Netflix-style header with user info */}
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
              
              <Link
                href="/cinema"
                className="text-2xl font-bold text-red-600 cinema-text mr-10"
              >
                CINEMA
              </Link>

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
          <div className="min-h-screen">
            {/* Movie Details Skeleton */}
            <div className="container mx-auto px-4 mb-4">
              <div className="w-24 h-10 bg-gray-800 rounded-md animate-pulse"></div>
            </div>
            
            <div className="relative h-[70vh] w-full mt-4">
              {/* Backdrop skeleton */}
              <div className="absolute inset-0 bg-gray-900 animate-pulse"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent"></div>
              
              {/* Movie details skeleton */}
              <div className="container mx-auto px-4 relative h-full flex flex-col justify-end pb-16">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  {/* Movie poster skeleton */}
                  <div className="w-48 h-72 rounded-md bg-gray-800 animate-pulse flex-shrink-0 hidden md:block"></div>
                  
                  {/* Movie information skeleton */}
                  <div className="flex-1">
                    <div className="w-3/4 h-10 bg-gray-800 rounded-md animate-pulse mb-4"></div>
                    
                    <div className="flex flex-wrap gap-3 mb-4">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="w-20 h-6 bg-gray-800 rounded-md animate-pulse"></div>
                      ))}
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-6">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="w-24 h-8 bg-gray-800 rounded-full animate-pulse"></div>
                      ))}
                    </div>
                    
                    <div className="space-y-2 mb-8">
                      <div className="w-full h-4 bg-gray-800 rounded animate-pulse"></div>
                      <div className="w-full h-4 bg-gray-800 rounded animate-pulse"></div>
                      <div className="w-2/3 h-4 bg-gray-800 rounded animate-pulse"></div>
                    </div>
                    
                    <div className="flex flex-wrap gap-3">
                      <div className="w-40 h-10 bg-gray-800 rounded-md animate-pulse"></div>
                      <div className="w-40 h-10 bg-gray-800 rounded-md animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
                  backgroundColor: '#111',
                  backgroundImage: movie.backdrop_url 
                    ? `url(${movie.backdrop_url})` 
                    : movie.poster_url 
                      ? `url(${movie.poster_url})` 
                      : `url(/api/movies/poster/${movie._id})`,
                  filter: 'brightness(0.4) saturate(1.2)'
                }}
              ></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black"></div>
              
              <div className="container mx-auto relative h-full z-10 px-4">
                <div className="flex flex-col md:flex-row gap-8 items-start absolute bottom-12 left-4 right-4">
                  {/* Movie poster - hidden on mobile */}
                  <div className="hidden md:block w-48 h-72 rounded-md overflow-hidden shadow-xl flex-shrink-0">
                    <img 
                      src={`/api/movies/poster/${movie._id}?t=${movie.updatedAt ? new Date(movie.updatedAt).getTime() : Date.now()}`}
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
                    <div className="flex flex-wrap gap-3 mb-10">
                      {/* Download/Forward button */}
                      <Button 
                        variant="default" 
                        className="bg-red-600 hover:bg-red-700 text-white"
                        onClick={handleDownload}
                        disabled={downloadLoading}
                      >
                        {downloadLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Download className="mr-2 h-4 w-4" />
                            Send to Telegram
                          </>
                        )}
                      </Button>
                      
                      {/* Watchlist button */}
                      <Button 
                        variant="outline" 
                        className="text-white border-white hover:bg-gray-800"
                        onClick={toggleWatchlist}
                        disabled={loadingWatchlist}
                      >
                        <Star className={`mr-2 h-4 w-4 ${isInWatchlist ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                        {isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
                      </Button>
                      
                      {/* Edit button (only for super admins) */}
                      {isSuperAdmin && (
                        <Button 
                          variant="outline" 
                          className="text-white border-white hover:bg-gray-800"
                          onClick={() => setEditDialogOpen(true)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Movie
                        </Button>
                      )}
                      
                      {/* Flag button (for all users) */}
                      <Button 
                        variant="outline" 
                        className="text-white border-white hover:bg-gray-800"
                        onClick={() => setFlagDialogOpen(true)}
                      >
                        <AlertTriangle className="mr-2 h-4 w-4" />
                        Flag Movie
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
        
        {/* Edit Movie Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="bg-gray-900 text-white border-gray-800 max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">Edit Movie</DialogTitle>
              <DialogDescription className="text-gray-400">
                Update movie information. Changes will be reflected immediately.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Title
                </Label>
                <Input
                  id="title"
                  value={editForm.title}
                  onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                  className="col-span-3 bg-gray-800 border-gray-700"
                  required
                />
              </div>
              
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="overview" className="text-right mt-2">
                  Overview
                </Label>
                <div className="col-span-3">
                  <textarea
                    id="overview"
                    value={editForm.overview}
                    onChange={(e) => setEditForm({...editForm, overview: e.target.value})}
                    className="w-full h-24 bg-gray-800 border-gray-700 rounded-md p-2 text-sm"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right mt-2">
                  Genres
                </Label>
                <div className="col-span-3">
                  <MultiSelect
                    options={availableGenres}
                    selected={editForm.genres}
                    onChange={(selected) => setEditForm({...editForm, genres: selected})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="poster_url" className="text-right">
                  Poster URL
                </Label>
                <Input
                  id="poster_url"
                  value={editForm.poster_url}
                  onChange={(e) => setEditForm({...editForm, poster_url: e.target.value})}
                  className="col-span-3 bg-gray-800 border-gray-700"
                  placeholder="https://example.com/poster.jpg"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="release_year" className="text-right">
                  Release Year
                </Label>
                <Input
                  id="release_year"
                  value={editForm.release_year}
                  onChange={(e) => setEditForm({...editForm, release_year: e.target.value})}
                  className="col-span-3 bg-gray-800 border-gray-700"
                  placeholder="2023"
                  type="number"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="vote_average" className="text-right">
                  Rating
                </Label>
                <Input
                  id="vote_average"
                  value={editForm.vote_average}
                  onChange={(e) => setEditForm({...editForm, vote_average: e.target.value})}
                  className="col-span-3 bg-gray-800 border-gray-700"
                  placeholder="7.5"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="runtime" className="text-right">
                  Runtime (min)
                </Label>
                <Input
                  id="runtime"
                  value={editForm.runtime}
                  onChange={(e) => setEditForm({...editForm, runtime: e.target.value})}
                  className="col-span-3 bg-gray-800 border-gray-700"
                  placeholder="120"
                  type="number"
                />
              </div>
            </div>
            
            <DialogFooter className="mt-6 pt-4 border-t border-gray-800 flex flex-col sm:flex-row gap-2">
              <Button 
                variant="outline" 
                className="text-white bg-transparent border-white hover:bg-gray-800 sm:w-auto w-full"
                onClick={() => setEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-red-600 hover:bg-red-700 text-white sm:w-auto w-full"
                onClick={handleEditSubmit}
                disabled={editSubmitting}
              >
                {editSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Flag Movie Dialog */}
        <Dialog open={flagDialogOpen} onOpenChange={setFlagDialogOpen}>
          <DialogContent className="bg-gray-900 text-white border-gray-800">
            <DialogHeader>
              <DialogTitle className="text-xl">Flag Movie</DialogTitle>
              <DialogDescription className="text-gray-400">
                Report an issue with this movie. Our team will review it.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="reason" className="text-right mt-2">
                  Reason
                </Label>
                <div className="col-span-3">
                  <textarea
                    id="reason"
                    value={flagReason}
                    onChange={(e) => setFlagReason(e.target.value)}
                    className="w-full h-24 bg-gray-800 border-gray-700 rounded-md p-2 text-sm"
                    placeholder="Please describe the issue (e.g., incorrect title, broken file, wrong poster)"
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                className="text-white bg-transparent border-white hover:bg-gray-800"
                onClick={() => setFlagDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={handleFlagMovie}
                disabled={flagSubmitting}
              >
                {flagSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Report'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
} 