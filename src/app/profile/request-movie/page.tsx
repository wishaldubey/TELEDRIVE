"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function RequestMovie() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [movieName, setMovieName] = useState("");
  const [releaseYear, setReleaseYear] = useState("");
  const [language, setLanguage] = useState("");
  
  // Fetch user data to ensure user is logged in
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/auth/user');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setUser(data);
          } else {
            // Redirect to login if not authenticated
            router.push('/login');
          }
        } else {
          // Redirect to login if not authenticated
          router.push('/login');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!movieName.trim()) {
      toast.error("Please enter a movie name", {
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
    
    setSubmitting(true);
    try {
      const response = await fetch('/api/movies/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          movieName,
          releaseYear: releaseYear.trim() || undefined,
          language: language.trim() || undefined
        })
      });
      
      if (!response.ok) {
        throw new Error(`Error submitting request: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Clear form
        setMovieName("");
        setReleaseYear("");
        setLanguage("");
        
        toast.success("Your movie request has been received. We'll try to add it within 24 hours.", {
          style: {
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            borderLeft: '4px solid #e50914',
            backdropFilter: 'blur(8px)',
          },
          duration: 5000,
        });
      } else {
        throw new Error(data.error || 'Failed to submit movie request');
      }
    } catch (error: any) {
      console.error('Error submitting movie request:', error);
      toast.error(error.message || "Failed to submit movie request", {
        style: {
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          borderLeft: '4px solid #e50914',
          backdropFilter: 'blur(8px)',
        },
        duration: 3000,
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Netflix-style header with back button */}
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
                <Link href="/profile/request-movie" className="text-white transition-colors">
                  Request Movie
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-xl">
          <div className="bg-gray-900/80 backdrop-blur-md rounded-lg p-6 shadow-xl border border-gray-800">
            <h1 className="text-2xl font-bold mb-6 text-center">🎬 Request a Movie</h1>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-red-600" />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="movieName" className="text-sm font-medium">
                    Movie Name *
                  </Label>
                  <Input
                    id="movieName"
                    value={movieName}
                    onChange={(e) => setMovieName(e.target.value)}
                    className="bg-gray-800 border-gray-700"
                    placeholder="Enter movie name (e.g., Inception)"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="releaseYear" className="text-sm font-medium">
                    Release Year (optional)
                  </Label>
                  <Input
                    id="releaseYear"
                    value={releaseYear}
                    onChange={(e) => setReleaseYear(e.target.value)}
                    className="bg-gray-800 border-gray-700"
                    placeholder="e.g., 2010"
                    type="number"
                    min="1900"
                    max={new Date().getFullYear() + 5}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="language" className="text-sm font-medium">
                    Language (optional)
                  </Label>
                  <Input
                    id="language"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="bg-gray-800 border-gray-700"
                    placeholder="e.g., English, Hindi, etc."
                  />
                </div>
                
                <Button
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-2"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Request'
                  )}
                </Button>
                
                <p className="text-xs text-gray-400 text-center mt-4">
                  Note: We'll try to add your requested movie within 24 hours.
                  You'll be able to access it from the Cinema home page once added.
                </p>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 