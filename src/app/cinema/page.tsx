"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent
} from "@/components/ui/card";
import { Loader } from "@/components/ui/loader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Film, Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
}

interface MovieApiResponse {
  movies: Movie[];
  genres: string[];
  years: number[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Hardcoded TMDB API key as requested
const TMDB_API_KEY = '4df8ee28bee18d23050955334c22877e';

// Custom debounce hook to replace lodash/debounce
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function Cinema() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [featuredMovie, setFeaturedMovie] = useState<Movie | null>(null);
  const [moviesByGenre, setMoviesByGenre] = useState<Record<string, Movie[]>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [user, setUser] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get search parameters
  const search = searchParams.get("search") || "";
  const genre = searchParams.get("genre") || "";
  const year = searchParams.get("year") || "";
  const sort = searchParams.get("sort") || "date";
  
  // Use our custom debounce hook
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/auth/user');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setUser(data);
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

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
  
  // Handle search input changes
  useEffect(() => {
    if (debouncedSearchTerm !== search) {
      const params = new URLSearchParams(searchParams);
      if (debouncedSearchTerm) {
        params.set("search", debouncedSearchTerm);
      } else {
        params.delete("search");
      }
      router.push(`/cinema?${params.toString()}`);
    }
  }, [debouncedSearchTerm, router, searchParams, search]);
  
  // Handle search change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  // Handle genre selection
  const handleGenreChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === "all") {
      params.delete("genre");
    } else {
      params.set("genre", value);
    }
    router.push(`/cinema?${params.toString()}`);
  };

  // Handle year selection
  const handleYearChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === "all") {
      params.delete("year");
    } else {
      params.set("year", value);
    }
    router.push(`/cinema?${params.toString()}`);
  };
  
  // Handle sort selection
  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("sort", value);
    router.push(`/cinema?${params.toString()}`);
  };
  
  // Fetch movies
  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (genre) params.set("genre", genre);
        if (year) params.set("year", year);
        if (sort) params.set("sort", sort);
        params.set("page", currentPage.toString());
        
        const response = await fetch(`/api/movies?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error(`Error fetching movies: ${response.status}`);
        }
        
        const data: MovieApiResponse = await response.json();
        setMovies(data.movies);
        setGenres(data.genres || []);
        setYears(data.years || []);
        setSelectedGenre(genre);
        setSelectedYear(year);
        setTotalPages(data.pagination.totalPages);
        
        // Set featured movie (random from top results)
        if (data.movies.length > 0 && !search && !genre && !year) {
          setFeaturedMovie(data.movies[Math.floor(Math.random() * Math.min(5, data.movies.length))]);
        } else {
          setFeaturedMovie(null);
        }
        
        // Group movies by genre
        const groupedByGenre: Record<string, Movie[]> = {};
        if (!search && !genre && !year) {
          data.movies.forEach((movie: Movie) => {
            if (movie.genres && movie.genres.length) {
              movie.genres.forEach((g: string) => {
                if (!g) return;
                if (!groupedByGenre[g]) {
                  groupedByGenre[g] = [];
                }
                groupedByGenre[g].push(movie);
              });
            }
          });
        }
        setMoviesByGenre(groupedByGenre);
        
      } catch (err: any) {
        setError(err.message || "An error occurred");
        console.error("Error fetching movies:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMovies();
  }, [search, genre, year, sort, currentPage]);

  // Initialize search term from URL
  useEffect(() => {
    setSearchTerm(search);
  }, [search]);

  // Handle search input
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to page 1 when search changes
  };

  // Handle pagination
  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0); // Scroll to top when changing page
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Netflix-style header with user info */}
      <header className="fixed top-0 w-full bg-gradient-to-b from-black/80 via-black/60 to-transparent z-50 backdrop-blur-sm">
        <div className="container mx-auto py-4 px-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/cinema" className="text-2xl font-bold text-red-600">
                CINEMA
              </Link>

              <nav className="hidden md:flex space-x-6">
                <Link href="/cinema" className={`hover:text-gray-300 transition-colors ${!search && !genre && !year ? 'text-white' : 'text-gray-400'}`}>
                  Home
                </Link>
                {genres.slice(0, 5).map((g) => (
                  <Link
                    key={g}
                    href={`/cinema?genre=${encodeURIComponent(g)}`}
                    className={`hover:text-gray-300 transition-colors ${genre === g ? 'text-white' : 'text-gray-400'}`}
                  >
                    {g}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              {/* Search form */}
              <form onSubmit={handleSearch} className="flex items-center">
                <Input 
                  type="search"
                  placeholder="Search titles..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="bg-black/30 border-gray-700 text-white w-32 md:w-64 h-9"
                />
                <Button 
                  type="submit" 
                  variant="ghost"
                  size="icon"
                  className="ml-1 text-gray-400 hover:text-white"
                >
                  <Search size={18} />
                </Button>
              </form>
              
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

      <main className="pt-24 pb-10">
        {/* Filters - Only shown when search/filter is active */}
        {(search || genre || year) && (
          <div className="bg-gray-900 py-4 mb-8">
            <div className="container mx-auto px-4">
              {/* Mobile Filter Button */}
              <div className="md:hidden mb-4">
                <Button
                  variant="outline"
                  className="w-full bg-gray-800 border-gray-700 text-white flex justify-between items-center"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <span>Filters & Sort</span>
                  <span>{showFilters ? '▲' : '▼'}</span>
                </Button>
              </div>
              
              {/* Filter Controls - Always visible on desktop, toggleable on mobile */}
              <div className={`${showFilters ? 'block' : 'hidden'} md:block`}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Select value={selectedGenre || "all"} onValueChange={handleGenreChange}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white w-full">
                      <SelectValue placeholder="Genre" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700 text-white">
                      <SelectItem value="all">All Genres</SelectItem>
                      {genres.map((g) => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={selectedYear || "all"} onValueChange={handleYearChange}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white w-full">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700 text-white">
                      <SelectItem value="all">All Years</SelectItem>
                      {years.map((y: number) => (
                        <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={sortBy} onValueChange={handleSortChange}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white w-full">
                      <SelectValue placeholder="Sort" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700 text-white">
                      <SelectItem value="date">Newest</SelectItem>
                      <SelectItem value="title">A-Z</SelectItem>
                      <SelectItem value="year">By Year</SelectItem>
                      <SelectItem value="popular">Popular</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="container mx-auto">
          {loading ? (
            <div className="flex justify-center items-center min-h-[50vh]">
              <img src="/loader.gif" alt="Loading..." className="w-22 h-22" />
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <h2 className="text-2xl font-bold mb-4">Error</h2>
              <p className="text-red-500">{error}</p>
            </div>
          ) : (
            <>
              {/* Hero Banner (only shown on main view) */}
              {featuredMovie && !search && !genre && !year && (
                <div className="relative h-[70vh] w-full mb-8">
                  {/* Banner Image with Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent z-10"></div>
                  <div 
                    className="absolute inset-0 bg-cover bg-center" 
                    style={{ 
                      backgroundImage: `url(/api/movies/thumbnail/${featuredMovie._id})`,
                      filter: 'brightness(0.5) saturate(1.2)'
                    }}
                  ></div>
                  
                  {/* Banner Content */}
                  <div className="absolute bottom-0 left-0 z-20 p-8 w-full md:w-2/3 lg:w-1/2">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 line-clamp-2 md:line-clamp-3" title={featuredMovie.title}>{featuredMovie.title}</h1>
                    
                    <div className="flex items-center space-x-4 mb-4">
                      {featuredMovie.release_year && (
                        <span className="text-sm">{featuredMovie.release_year}</span>
                      )}
                      {featuredMovie.vote_average && (
                        <span className="text-sm flex items-center">
                          ⭐ {featuredMovie.vote_average.toFixed(1)}
                        </span>
                      )}
                      {featuredMovie.genres && featuredMovie.genres.slice(0, 3).map((g) => (
                        <span key={g} className="text-sm bg-red-900/60 px-2 py-1 rounded">
                          {g}
                        </span>
                      ))}
                    </div>
                    
                    <Link 
                      href={`/cinema/${featuredMovie._id}`}
                      className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded transition-colors"
                    >
                      Pirate Now
                    </Link>
                  </div>
                </div>
              )}

              {/* Movie Grid (for search and genre filtered views) */}
              {(search || genre || year) && (
                <div className="px-4">
                  <h1 className="text-2xl font-bold mb-6">
                    {search ? `Results for "${search}"` : (genre ? `${genre} Movies` : `Movies from ${year}`)}
                  </h1>
                  
                  {movies.length === 0 ? (
                    <div className="text-center py-16">
                      <h2 className="text-xl mb-2">No movies found</h2>
                      <p className="text-gray-400">Try adjusting your search criteria</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {movies.map((movie) => (
                        <Link key={movie._id} href={`/cinema/${movie._id}`} className="group">
                          <div className="overflow-hidden rounded-md aspect-[2/3] relative">
                            <img 
                              src={`/api/movies/thumbnail/${movie._id}`} 
                              alt={movie.title}
                              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
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
                      ))}
                    </div>
                  )}

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
                </div>
              )}

              {/* Movie Categories */}
              {!search && !genre && !year && Object.keys(moviesByGenre).length > 0 && (
                <div className="relative z-10 px-4 md:px-12 pb-20">
                  <div className="container mx-auto">
                    {Object.entries(moviesByGenre).map(([category, categoryMovies]) => (
                      categoryMovies.length > 0 && (
                        <div key={category} className="mb-12">
                          <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold">{category}</h2>
                            <Link 
                              href={`/cinema?genre=${encodeURIComponent(category)}`}
                              className="text-sm text-gray-400 hover:text-white transition-colors"
                            >
                              View All
                            </Link>
                          </div>
                          <div className="relative">
                            <div className="flex space-x-4 overflow-x-auto pb-4 no-scrollbar">
                              {categoryMovies.slice(0, 8).map((movie) => (
                                <Link key={movie._id} href={`/cinema/${movie._id}`} className="flex-none w-[180px] group">
                                  <div className="overflow-hidden rounded-md aspect-[2/3] relative">
                                    <img 
                                      src={`/api/movies/thumbnail/${movie._id}`} 
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
                              ))}
                            </div>
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
