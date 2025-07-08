"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader } from "@/components/ui/loader";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, X, Check, Heart, MessageCircleHeart } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface UserProfile {
  user_id: number;
  name: string;
  dob: string;
  gender: string;
  profile_picture?: string;
  completed_onboarding: boolean;
  daily_swipe_count?: number;
}

interface Movie {
  _id: string;
  title: string;
  poster_url?: string;
  genres: string[];
}

interface Match {
  user_id: number;
  name: string;
  age: number;
  gender: string;
  profile_picture?: string;
  match_percentage: number;
  shared_movies: string[];
  shared_genres: string[];
}

export default function VibeMatch() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [currentMovieIndex, setCurrentMovieIndex] = useState(0);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [likedMovies, setLikedMovies] = useState<string[]>([]);
  const [dislikedMovies, setDislikedMovies] = useState<string[]>([]);
  const [swiped, setSwiped] = useState(0);
  const [hasMatches, setHasMatches] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [showMatches, setShowMatches] = useState(false);
  const [dailySwipeCount, setDailySwipeCount] = useState(0);
  const [swipeLimitReached, setSwipeLimitReached] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [activeTab, setActiveTab] = useState("swipe");
  const [swipeDirection, setSwipeDirection] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const touchStartXRef = useRef<number>(0);
  const touchStartYRef = useRef<number>(0);
  
  const router = useRouter();
  const { toast } = useToast();

  // Fetch user data and profile
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/auth/user');
        if (response.ok) {
          const userData = await response.json();
          if (userData.success) {
            setUser(userData);
            
            // Now fetch the user's vibe match profile
            const profileResponse = await fetch('/api/vibe-match/profile');
            if (profileResponse.ok) {
              const profileData = await profileResponse.json();
              
              if (profileData.success && profileData.profile) {
                setProfile(profileData.profile);
                setNeedsOnboarding(false);
                
                // If the profile has a daily swipe count, set it
                if (profileData.profile.daily_swipe_count) {
                  setDailySwipeCount(profileData.profile.daily_swipe_count);
                  
                  // Check if daily limit reached
                  if (profileData.profile.daily_swipe_count >= 100) {
                    setSwipeLimitReached(true);
                  }
                }
                
                // Check for pending requests
                try {
                  const requestsResponse = await fetch('/api/vibe-match/requests?status=pending&type=incoming');
                  if (requestsResponse.ok) {
                    const requestsData = await requestsResponse.json();
                    if (requestsData.success && requestsData.requests) {
                      setPendingRequestsCount(requestsData.requests.length);
                    }
                  }
                } catch (err) {
                  console.error('Error fetching requests:', err);
                }
              } else {
                // No profile exists, needs onboarding
                setNeedsOnboarding(true);
              }
            } else {
              setNeedsOnboarding(true);
            }
          }
        } else {
          // Redirect to login if not authenticated
          router.push('/');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast({
          title: "Error",
          description: "Failed to load user data. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router, toast]);

  // Fetch movies for swiping if user has completed onboarding
  useEffect(() => {
    if (profile && profile.completed_onboarding && movies.length === 0 && !swipeLimitReached) {
      fetchMoviesToSwipe();
    }
  }, [profile, swipeLimitReached]);

  const fetchMoviesToSwipe = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/vibe-match/movies?limit=20');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.movies) {
          setMovies(data.movies);
        }
      }
    } catch (error) {
      console.error('Error fetching movies:', error);
      toast({
        title: "Error",
        description: "Failed to load movies. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePicture(file);
      
      // Create a preview
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === 'string') {
          setProfilePicturePreview(event.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !dob || !gender) {
      toast({
        title: "Missing Information",
        description: "Please fill out all required fields.",
        variant: "destructive"
      });
      return;
    }
    
    if (!profilePicture) {
      toast({
        title: "Profile Picture Required",
        description: "Please upload a profile picture.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setUploading(true);
      
      // Create form data for file upload
      const formData = new FormData();
      formData.append('name', name);
      formData.append('dob', dob);
      formData.append('gender', gender);
      if (profilePicture) {
        formData.append('profile_picture', profilePicture);
      }
      
      const response = await fetch('/api/vibe-match/profile', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProfile(data.profile);
          setNeedsOnboarding(false);
          
          // Fetch movies for swiping
          fetchMoviesToSwipe();
          
          toast({
            title: "Profile Created",
            description: "Your Vibe Match profile has been created successfully!",
          });
        } else {
          throw new Error(data.message || 'Failed to create profile');
        }
      } else {
        throw new Error('Server error');
      }
    } catch (error) {
      console.error('Error creating profile:', error);
      toast({
        title: "Error",
        description: "Failed to create your profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSwipe = async (movieId: string, liked: boolean) => {
    try {
      // Optimistically update UI to show next movie
      setSwiped(prev => prev + 1);
      setDailySwipeCount(prev => prev + 1);
      
      // Store the liked/disliked movie
    if (liked) {
        setLikedMovies(prev => [...prev, movieId]);
    } else {
        setDislikedMovies(prev => [...prev, movieId]);
      }
      
      // Move to next movie
      if (currentMovieIndex < movies.length - 1) {
        setCurrentMovieIndex(prevIndex => prevIndex + 1);
      } else if (movies.length > 0) {
        // Last movie was swiped, fetch new batch
        fetchMoviesToSwipe();
        setCurrentMovieIndex(0);
      }
      
      // Send preference to backend
      const response = await fetch('/api/vibe-match/movies/swipe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          movie_id: movieId,
          liked,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
          
        if (data.success) {
          // Check if we've reached the daily limit
          if (data.daily_limit_reached) {
            setSwipeLimitReached(true);
          }
          
          // Check if we have new matches
          if (data.new_match) {
            setHasMatches(true);
            setMatches(prev => [...prev, data.match]);
            
            toast({
              title: "New Match!",
              description: `You matched with ${data.match.name}!`,
            });
          }
            }
          }
        } catch (error) {
      console.error('Error swiping movie:', error);
          toast({
            title: "Error",
        description: "Failed to save your preference. Please try again.",
            variant: "destructive"
          });
    }
  };

  const handleMatchAction = async (matchId: number, action: 'rizz' | 'skip') => {
    // Record the action
    try {
      const currentMatch = matches[currentMatchIndex];
      const response = await fetch('/api/vibe-match/matches/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          match_user_id: matchId,
          action,
          match_percentage: currentMatch.match_percentage,
          shared_movies: currentMatch.shared_movies
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // If it's a mutual match, show a notification
        if (data.mutualMatch) {
          toast({
            title: "It's a match!",
            description: "You both want to chat. Check your matches to start the conversation!",
            variant: "default"
          });
        } else if (data.requestSent) {
          toast({
            title: "Vibe Request Sent",
            description: "We'll notify you if they accept your request!",
            variant: "default"
          });
        } else if (data.alreadySent) {
          toast({
            title: "Already Sent",
            description: "You've already sent a vibe request to this person.",
            variant: "default"
          });
        }
      }
    } catch (error) {
      console.error('Error recording match action:', error);
    }
    
    // Move to the next match
    if (currentMatchIndex < matches.length - 1) {
      setCurrentMatchIndex(currentMatchIndex + 1);
    } else {
      // No more matches, go back to swiping
      setShowMatches(false);
      setCurrentMovieIndex(0);
      fetchMoviesToSwipe();
    }
  };

  const calculateAge = (dob: string): number => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  // Manual swipe handlers for buttons
  const handleManualSwipe = (liked: boolean) => {
    setSwipeDirection(liked ? 'right' : 'left');
    setTimeout(() => {
      handleSwipe(movies[currentMovieIndex]._id, liked);
      setSwipeDirection(null);
      setSwipeOffset({ x: 0, y: 0 });
    }, 300);
  };

  // Touch event handlers for mobile swipe
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!movies.length) return;
    
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    setIsDragging(true);
  }, [movies.length]);
  
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || !movies.length) return;
    
    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;
    const diffX = touchX - touchStartXRef.current;
    const diffY = touchY - touchStartYRef.current;
    
    // Check if horizontal swipe is more dominant than vertical scroll
    if (Math.abs(diffX) > Math.abs(diffY)) {
      e.preventDefault(); // Prevent page scroll during horizontal swipe
      
      // Limit the drag distance
      const maxOffset = 150;
      let xOffset = diffX;
      
      if (Math.abs(xOffset) > maxOffset) {
        xOffset = Math.sign(xOffset) * maxOffset;
      }
      
      setSwipeOffset({ 
        x: xOffset, 
        y: -Math.abs(xOffset) * 0.1 // Slight up/down movement based on horizontal swipe
      });
    }
  }, [isDragging, movies.length]);
  
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isDragging || !movies.length) return;
    
    setIsDragging(false);
    
    const diffX = swipeOffset.x;
    
    // If swiped far enough, trigger the swipe action
    if (Math.abs(diffX) > 80) {
      if (diffX > 0) {
        // Swiped right - like
        setSwipeDirection('right');
        setTimeout(() => {
          handleSwipe(movies[currentMovieIndex]._id, true);
          setSwipeDirection(null);
          setSwipeOffset({ x: 0, y: 0 });
        }, 300); // Wait for animation
      } else {
        // Swiped left - dislike
        setSwipeDirection('left');
        setTimeout(() => {
          handleSwipe(movies[currentMovieIndex]._id, false);
          setSwipeDirection(null);
          setSwipeOffset({ x: 0, y: 0 });
        }, 300); // Wait for animation
      }
    } else {
      // Not swiped far enough, reset position
      setSwipeOffset({ x: 0, y: 0 });
    }
  }, [isDragging, movies, currentMovieIndex, swipeOffset.x, handleSwipe]);

  // Setup body overflow control to prevent background scrolling during swipe
  useEffect(() => {
    if (isDragging) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isDragging]);

  // Calculate card rotation and opacity based on swipe
  const getCardStyle = () => {
    if (swipeDirection) {
      // Exit animation
      const translateX = swipeDirection === 'left' ? '-120%' : '120%';
      const rotate = swipeDirection === 'left' ? '-30deg' : '30deg';
      
      return {
        transform: `translate3d(${translateX}, 0, 0) rotate(${rotate})`,
        opacity: 0,
        transition: 'transform 0.3s ease, opacity 0.3s ease',
      };
    }
    
    if (isDragging || swipeOffset.x !== 0) {
      // While dragging
      const rotate = swipeOffset.x * 0.1; // Rotation based on swipe distance
      return {
        transform: `translate3d(${swipeOffset.x}px, ${swipeOffset.y}px, 0) rotate(${rotate}deg)`,
        transition: isDragging ? 'none' : 'transform 0.5s ease',
      };
    }
    
    return {};
  };
  
  // Calculate like/dislike indicator opacity based on swipe
  const getLikeOpacity = () => {
    if (swipeDirection === 'right') return 1;
    return swipeOffset.x > 30 ? Math.min(swipeOffset.x / 100, 1) : 0;
  };
  
  const getDislikeOpacity = () => {
    if (swipeDirection === 'left') return 1;
    return swipeOffset.x < -30 ? Math.min(Math.abs(swipeOffset.x) / 100, 1) : 0;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <Loader size="lg" />
      </div>
    );
  }

  if (needsOnboarding) {
    return (
      <div className="flex min-h-screen flex-col bg-black text-white">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <h1 className="mb-8 text-3xl font-bold text-center">Complete Your Vibe Match Profile</h1>
          
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="non-binary">Non-binary</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="profile-picture">Profile Picture</Label>
                  <div className="flex flex-col items-center space-y-4">
                    {profilePicturePreview ? (
                      <Avatar className="h-32 w-32">
                        <AvatarImage src={profilePicturePreview} alt="Profile preview" />
                        <AvatarFallback>{name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="h-32 w-32 rounded-full bg-gray-800 flex items-center justify-center">
                        <span className="text-4xl text-gray-400">+</span>
                      </div>
                    )}
                    <Input
                      id="profile-picture"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="max-w-xs"
                    />
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-red-600 hover:bg-red-700"
                  disabled={uploading}
                >
                  {uploading ? <Loader size="sm" /> : "Create Profile"}
                </Button>
                
                <p className="text-center text-sm text-gray-400 mt-4">
                  After setting up your profile, you'll swipe on movies to find your perfect vibe match.
                  You can always access your matches and requests from the Matches tab.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (swipeLimitReached) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white p-4">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold mb-4">Daily Limit Reached</h1>
          <p className="text-gray-400 mb-8">
            You've reached your daily limit of 100 movie swipes. Come back tomorrow to discover more matches!
          </p>
          <div className="flex flex-col gap-4 items-center">
            <Link href="/vibe-match/matches" className="w-full">
              <Button 
                className="w-full bg-red-600 hover:bg-red-700 flex items-center justify-center gap-2"
              >
                <MessageCircleHeart className="h-5 w-5" />
                View Your Matches
                {pendingRequestsCount > 0 && (
                  <Badge className="bg-white text-red-600 ml-2">
                    {pendingRequestsCount} new
                  </Badge>
                )}
              </Button>
            </Link>
            <Button 
              onClick={() => router.push('/dashboard')}
              className="w-full bg-gray-800 hover:bg-gray-700"
              variant="outline"
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (showMatches && matches.length > 0) {
    const currentMatch = matches[currentMatchIndex];
    const matchPercentageBg = 
      currentMatch.match_percentage >= 80 ? "bg-green-500" : 
      currentMatch.match_percentage >= 60 ? "bg-lime-500" : 
      currentMatch.match_percentage >= 40 ? "bg-yellow-500" : "bg-orange-500";

    return (
      <div className="flex min-h-screen flex-col bg-black text-white">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-3xl font-bold">Vibe Match</h1>
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm text-gray-400">
                Match {currentMatchIndex + 1} of {matches.length}
              </div>
              <Link href="/vibe-match/matches">
                <Button 
                  variant="default" 
                  size="sm" 
                  className="bg-red-600 hover:bg-red-700 flex items-center gap-1 rounded-full px-4"
                >
                  <MessageCircleHeart className="h-5 w-5" />
                  <span>All Matches</span>
                  {pendingRequestsCount > 0 && (
                    <Badge className="bg-white text-red-600 ml-1">
                      {pendingRequestsCount}
                    </Badge>
                  )}
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="relative">
            <Card className="bg-gray-900 border-gray-800 overflow-hidden">
              <CardContent className="p-0">
                <div className="relative h-[70vh]">
                  {/* Profile background */}
                  <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-black flex flex-col items-center pt-12">
                    {/* Profile picture */}
                    <div className="relative">
                      <Avatar className="h-40 w-40 border-4 border-red-600">
                        <AvatarImage src={`/api/thumbnail/${currentMatch.profile_picture}?direct=true`} alt={currentMatch.name} />
                        <AvatarFallback className="text-4xl">{currentMatch.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      
                      {/* Match percentage badge */}
                      <Badge className={`absolute -right-2 -top-2 ${matchPercentageBg} text-white font-bold px-2 py-1 rounded-full`}>
                        {currentMatch.match_percentage}% Match
                      </Badge>
                    </div>
                    
                    {/* User info */}
                    <div className="mt-6 text-center">
                      <h2 className="text-3xl font-bold">{currentMatch.name}, {currentMatch.age}</h2>
                      <p className="text-gray-400 mt-2">{currentMatch.gender}</p>
                      
                      {/* Shared interests */}
                      <div className="mt-8">
                        <h3 className="text-xl font-semibold mb-3">Shared Movie Taste</h3>
                        <div className="flex flex-wrap justify-center gap-2 mb-4">
                          {currentMatch.shared_genres.map((genre, idx) => (
                            <span key={idx} className="text-sm bg-gray-800/80 px-3 py-1 rounded-full">
                              {genre}
                            </span>
                          ))}
                        </div>
                        
                        <p className="text-gray-300 mt-4">
                          <span className="font-semibold">{currentMatch.shared_movies.length}</span> movies in common
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Action buttons */}
            <div className="mt-6 flex justify-center gap-6">
              <Button 
                onClick={() => handleMatchAction(currentMatch.user_id, 'skip')}
                className="h-16 w-16 rounded-full bg-gray-800 hover:bg-red-900"
              >
                <X className="h-8 w-8" />
              </Button>
              <Button 
                onClick={() => handleMatchAction(currentMatch.user_id, 'rizz')}
                className="h-16 w-16 rounded-full bg-gray-800 hover:bg-pink-900"
              >
                <MessageCircleHeart className="h-8 w-8" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Movie swiping interface
  return (
    <div className="min-h-screen bg-[#141414] text-white">
      {/* Netflix inspired header with gradient */}
      <div className="bg-gradient-to-b from-black/80 to-transparent pt-4 pb-6 px-4 sticky top-0 z-10">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-bold text-red-600">Vibe Match</h1>
            {profile && (
          <div className="flex items-center">
                {pendingRequestsCount > 0 && (
                  <Link href="/vibe-match/matches">
                    <Button variant="ghost" className="relative">
                      <MessageCircleHeart className="h-6 w-6" />
                      <Badge className="absolute -top-2 -right-2 bg-red-600">{pendingRequestsCount}</Badge>
                    </Button>
                  </Link>
                )}
                <Link href="/vibe-match/profile">
                  <Button variant="ghost" className="ml-2 rounded-full p-0 w-10 h-10 overflow-hidden">
                    {profile.profile_picture ? (
                      <img 
                        src={`/api/vibe-match/profile-picture/${profile.profile_picture}`} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-700">
                        {profile.name?.substring(0, 1).toUpperCase() || "U"}
            </div>
                )}
              </Button>
            </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader size="lg" />
          </div>
        ) : needsOnboarding ? (
          <Card className="bg-[#1a1a1a] border border-gray-800">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-6">Complete Your Vibe Match Profile</h2>
              <form onSubmit={handleProfileSubmit}>
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Your Name</Label>
                        <Input
                          id="name"
                          type="text"
                          placeholder="Enter your name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="bg-gray-800 border-gray-700"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="dob">Date of Birth</Label>
                        <Input
                          id="dob"
                          type="date"
                          value={dob}
                          onChange={(e) => setDob(e.target.value)}
                          className="bg-gray-800 border-gray-700"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="gender">Gender</Label>
                        <Select value={gender} onValueChange={setGender}>
                          <SelectTrigger className="bg-gray-800 border-gray-700">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
          </div>
        </div>
        
                    <div className="md:w-1/3 flex flex-col items-center space-y-4">
                      <div className="relative w-40 h-40 rounded-md overflow-hidden border-2 border-gray-700 bg-gray-800">
                        {profilePicturePreview ? (
                          <img 
                            src={profilePicturePreview} 
                            alt="Profile Preview" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full text-gray-400">
                            <div className="text-center">
                              <div className="mb-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                              <p className="text-sm">Profile Picture</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="profile-picture" className="cursor-pointer">
                          <Button type="button" variant="outline" size="sm">
                            Upload Photo
                          </Button>
                          <Input
                            id="profile-picture"
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </Label>
                      </div>
                    </div>
                  </div>
                  
              <Button 
                    type="submit"
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                    disabled={uploading}
                  >
                    {uploading ? <Loader size="sm" className="mr-2" /> : null}
                    {uploading ? "Creating Profile..." : "Create Profile"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <div>
            {/* Enhanced UI tabs for the main sections */}
            <div className="mb-8">
              <div className="flex space-x-2 border-b border-gray-800">
                <button
                  onClick={() => setActiveTab("swipe")}
                  className={`px-4 py-3 font-medium text-lg transition-colors ${
                    activeTab === "swipe"
                      ? "text-white border-b-2 border-red-600"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Discover Movies
                </button>
                <button
                  onClick={() => router.push('/vibe-match/matches')}
                  className="px-4 py-3 font-medium text-lg text-gray-400 hover:text-white transition-colors relative"
                >
                  Matches
                {pendingRequestsCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 bg-red-600 text-xs">{pendingRequestsCount}</Badge>
                )}
                </button>
          </div>
        </div>
        
            {movies.length === 0 ? (
              <div className="text-center py-20">
                {swipeLimitReached ? (
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Daily Limit Reached</h3>
                    <p className="text-gray-400 max-w-md mx-auto">
                      You've reached your daily swiping limit. Come back tomorrow for more matches!
                    </p>
                  </div>
                ) : (
                  <div>
                    <Loader size="lg" className="mx-auto mb-4" />
                    <p className="text-gray-400">Loading movies for you to match with...</p>
                  </div>
                )}
              </div>
            ) : (
          <div className="relative">
                {/* Movie Card Container */}
                <div className="relative max-w-md mx-auto h-[450px]">
                  {/* Card that can be swiped */}
                  <div 
                    ref={cardRef}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onTouchCancel={handleTouchEnd}
                    className="absolute inset-0 rounded-lg overflow-hidden shadow-xl cursor-grab active:cursor-grabbing select-none"
                    style={{...getCardStyle(), touchAction: 'pan-y'}}
                  >
                    <img
                      src={movies[currentMovieIndex]?.poster_url || '/placeholder-movie.jpg'}
                      alt={movies[currentMovieIndex]?.title}
                      className="w-full h-full object-cover"
                      draggable="false"
                    />
                    
                    {/* Like indicator */}
                    <div 
                      className="absolute top-6 right-6 transform rotate-12 border-4 border-green-500 text-green-500 font-bold text-3xl px-2 py-1 rounded"
                      style={{ 
                        opacity: getLikeOpacity(),
                        transition: 'opacity 0.2s ease',
                        pointerEvents: 'none'
                      }}
                    >
                      LIKE
                    </div>
                    
                    {/* Dislike indicator */}
                    <div 
                      className="absolute top-6 left-6 transform -rotate-12 border-4 border-red-500 text-red-500 font-bold text-3xl px-2 py-1 rounded"
                      style={{ 
                        opacity: getDislikeOpacity(),
                        transition: 'opacity 0.2s ease',
                        pointerEvents: 'none'
                      }}
                    >
                      NOPE
                    </div>
                    
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/70 to-transparent p-4 pointer-events-none">
                      <h3 className="text-xl font-bold mb-1">{movies[currentMovieIndex]?.title}</h3>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {movies[currentMovieIndex]?.genres.map((genre, index) => (
                          <Badge key={index} className="bg-red-600/80">{genre}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Show next movie in queue (if available) */}
                  {movies.length > currentMovieIndex + 1 && (
                    <div className="absolute inset-0 rounded-lg overflow-hidden shadow-lg -z-10">
                      <img
                        src={movies[currentMovieIndex + 1]?.poster_url || '/placeholder-movie.jpg'}
                        alt="Next movie"
                        className="w-full h-full object-cover"
                        draggable="false"
                      />
                    </div>
                  )}
                </div>
                
                {/* Swipe action buttons */}
                <div className="absolute -bottom-16 left-0 right-0 flex justify-center space-x-6 z-10">
                  <Button 
                    onClick={() => handleManualSwipe(false)}
                    className="rounded-full w-14 h-14 bg-white/10 hover:bg-white/20 backdrop-blur-sm"
                  >
                    <X className="h-7 w-7 text-red-500" />
                  </Button>
                  <Button 
                    onClick={() => handleManualSwipe(true)}
                    className="rounded-full w-14 h-14 bg-white/10 hover:bg-white/20 backdrop-blur-sm"
                  >
                    <Heart className="h-7 w-7 text-green-500" />
                  </Button>
                </div>
                
                {/* Swiped counter */}
                <div className="mt-24 text-center">
                  <p className="text-sm text-gray-400">
                    Swiped today: {dailySwipeCount} / 100
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 