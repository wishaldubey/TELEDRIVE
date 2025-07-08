"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, Film, MoreHorizontal, Star, Info } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import { listenToMessages, sendMessage, ChatMessage } from "@/services/firebase";

interface VibeMatch {
  _id: string;
  user1: number;
  user2: number;
  otherUserName?: string;
  otherUserProfilePic?: string;
  matchScore: number;
  sharedMovies: string[];
  createdAt: string;
  status: "active" | "inactive";
}

interface SharedMovie {
  _id: string;
  title: string;
  poster_url?: string;
}

// Update ChatMessage interface to include timestamp
interface ExtendedChatMessage extends ChatMessage {
  timestamp: string;
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const messageEndRef = useRef<HTMLDivElement>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [match, setMatch] = useState<VibeMatch | null>(null);
  const [messages, setMessages] = useState<ExtendedChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sharedMovies, setSharedMovies] = useState<SharedMovie[]>([]);
  const [showMovies, setShowMovies] = useState(false);
  const [selectedMovieIndex, setSelectedMovieIndex] = useState(0);
  
  const matchId = params.matchId as string;
  
  // Scroll to bottom of messages
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  
  // Fetch user data and match
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get user data
        const userResponse = await fetch('/api/auth/user');
        if (userResponse.ok) {
          const userData = await userResponse.json();
          if (userData.success) {
            setUser(userData);
            
            // Fetch match details
            const matchResponse = await fetch(`/api/vibe-match/matches/${matchId}`);
            if (matchResponse.ok) {
              const matchData = await matchResponse.json();
              if (matchData.success) {
                setMatch(matchData.match);
                
                // Fetch shared movies details
                if (matchData.match.sharedMovies.length > 0) {
                  const moviesResponse = await fetch('/api/vibe-match/movies/details', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      movieIds: matchData.match.sharedMovies
                    }),
                  });
                  
                  if (moviesResponse.ok) {
                    const moviesData = await moviesResponse.json();
                    if (moviesData.success) {
                      setSharedMovies(moviesData.movies);
                    }
                  }
                }
                
                // Listen to messages
                listenToMessages(matchId, (chatMessages) => {
                  // Convert to ExtendedChatMessage with timestamp
                  const extendedMessages = chatMessages.map(msg => ({
                    ...msg,
                    timestamp: msg.createdAt?.toDate?.() ? 
                      msg.createdAt.toDate().toISOString() : 
                      new Date().toISOString()
                  }));
                  setMessages(extendedMessages);
                });
              }
            }
          }
        } else {
          // Redirect to login if not authenticated
          router.push('/');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to load chat data. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    if (matchId) {
      fetchData();
    }
    
    // Cleanup listener
    return () => {
      // This would normally be where we unsubscribe, but Firebase handles that internally
    };
  }, [matchId, router, toast]);
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !user || !match) return;
    
    try {
      setSending(true);
      
      // Determine the recipient user ID
      const toUserId = match.user1 === user.user_id ? match.user2 : match.user1;
      
      // Send message via Firebase
      await sendMessage(matchId, user.user_id, toUserId, newMessage);
      
      // Clear input field
      setNewMessage("");
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };
  
  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatMessageDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: today.getFullYear() !== date.getFullYear() ? 'numeric' : undefined
      });
    }
  };
  
  // Group messages by date
  const groupedMessages = messages.reduce((groups: Record<string, ExtendedChatMessage[]>, message: ExtendedChatMessage) => {
    const date = formatMessageDate(message.timestamp);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});
  
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#141414]">
        <Loader size="lg" />
      </div>
    );
  }
  
  if (!match) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#141414] text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Match not found</h2>
          <p className="text-gray-400 mb-6">This match may have been removed or doesn't exist.</p>
          <Link href="/vibe-match/matches">
            <Button className="bg-red-600 hover:bg-red-700">Back to Matches</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  const isCurrentUserMessage = (message: ExtendedChatMessage) => message.fromUserId === user.user_id;
  const selectedMovie = sharedMovies[selectedMovieIndex];
  
  return (
    <div className="flex flex-col min-h-screen bg-[#141414] text-white">
      {/* Chat header with profile info */}
      <div className="bg-[#1a1a1a] border-b border-gray-800 p-4 sticky top-0 z-10 shadow-md">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/vibe-match/matches" className="mr-3">
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-800">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              
              <Avatar className="h-10 w-10 mr-3">
                {match.otherUserProfilePic ? (
                  <AvatarImage src={`/api/vibe-match/profile-picture/${match.otherUserProfilePic}`} alt={match.otherUserName || 'Match'} />
                ) : (
                  <AvatarFallback className="bg-red-700 text-white">
                    {match.otherUserName ? match.otherUserName.substring(0, 2).toUpperCase() : '?'}
                  </AvatarFallback>
                )}
              </Avatar>
              
              <div>
                <h2 className="font-semibold">{match.otherUserName}</h2>
                <div className="flex items-center">
                  <Badge className="text-xs bg-red-600 text-white">
                    {match.matchScore}% Match
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full hover:bg-gray-800"
                onClick={() => setShowMovies(!showMovies)}
              >
                <Film className={`h-5 w-5 ${showMovies ? 'text-red-500' : 'text-white'}`} />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full hover:bg-gray-800"
              >
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main chat area */}
        <div className="flex-1 flex flex-col">
          {/* Messages container */}
          <div className="flex-1 overflow-y-auto p-4" ref={messageListRef}>
            <div className="container mx-auto max-w-4xl">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-20 text-center">
                  <div className="bg-red-600/20 rounded-full p-4 mb-4">
                    <Star className="h-6 w-6 text-red-500" />
                  </div>
                  <h3 className="text-xl font-medium mb-2">Start a Conversation</h3>
                  <p className="text-gray-400 max-w-sm">
                    You and {match.otherUserName} both like similar movies. Say hello!
                  </p>
                  
                  {sharedMovies.length > 0 && (
                    <div className="mt-8 bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 max-w-sm">
                      <h4 className="font-medium text-center mb-3">Movies You Both Like</h4>
                      <div className="flex overflow-x-auto gap-2 pb-2">
                        {sharedMovies.slice(0, 4).map((movie) => (
                          <div key={movie._id} className="flex-shrink-0 w-16 rounded overflow-hidden">
                            <img 
                              src={movie.poster_url || '/placeholder-movie.jpg'} 
                              alt={movie.title}
                              className="w-full aspect-[2/3] object-cover"
                              title={movie.title}
                            />
                          </div>
                        ))}
                        {sharedMovies.length > 4 && (
                          <div className="flex-shrink-0 w-16 aspect-[2/3] bg-gray-800 flex items-center justify-center rounded">
                            <span className="text-sm font-medium">+{sharedMovies.length - 4}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-8 pb-4">
                  {Object.entries(groupedMessages).map(([date, dateMessages]) => (
                    <div key={date}>
                      <div className="flex justify-center mb-4">
                        <div className="bg-gray-800 rounded-full px-3 py-1 text-xs text-gray-300">
                          {date}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {dateMessages.map((message) => {
                          const isCurrentUser = isCurrentUserMessage(message);
                          
                          return (
                            <div 
                              key={message.id} 
                              className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                            >
                              <div className="flex items-end gap-2 max-w-[80%]">
                                {!isCurrentUser && (
                                  <Avatar className="h-8 w-8">
                                    {match.otherUserProfilePic ? (
                                      <AvatarImage 
                                        src={`/api/vibe-match/profile-picture/${match.otherUserProfilePic}`} 
                                        alt={match.otherUserName || 'Match'} 
                                      />
                                    ) : (
                                      <AvatarFallback className="bg-red-700 text-white text-xs">
                                        {match.otherUserName ? match.otherUserName.substring(0, 2).toUpperCase() : '?'}
                                      </AvatarFallback>
                                    )}
                                  </Avatar>
                                )}
                                
                                <div 
                                  className={`rounded-2xl px-4 py-2 ${
                                    isCurrentUser 
                                      ? 'bg-red-600 text-white rounded-tr-none' 
                                      : 'bg-[#232323] text-white rounded-tl-none'
                                  }`}
                                >
                                  <p className="text-sm">{message.text}</p>
                                  <p className="text-xs text-right mt-1 opacity-70">
                                    {formatMessageTime(message.timestamp)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  <div ref={messageEndRef} />
                </div>
              )}
            </div>
          </div>
          
          {/* Message input */}
          <div className="bg-[#1a1a1a] border-t border-gray-800 p-4">
            <div className="container mx-auto max-w-4xl">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="bg-[#232323] border-gray-700 text-white"
                />
                <Button 
                  type="submit" 
                  disabled={!newMessage.trim() || sending}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {sending ? <Loader size="sm" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
            </div>
          </div>
        </div>
        
        {/* Shared movies sidebar */}
        {showMovies && (
          <div className="w-64 bg-[#1a1a1a] border-l border-gray-800 overflow-y-auto">
            <div className="p-4">
              <h3 className="font-medium mb-4 flex items-center">
                <Film className="h-4 w-4 mr-2" />
                Shared Movies
              </h3>
              
              {sharedMovies.length === 0 ? (
                <div className="text-center py-4 text-gray-400">
                  <p>No shared movies found</p>
                </div>
              ) : (
                <div>
                  {/* Selected movie details */}
                  <div className="mb-4">
                    <div className="rounded overflow-hidden mb-2">
                      <img 
                        src={selectedMovie?.poster_url || '/placeholder-movie.jpg'} 
                        alt={selectedMovie?.title || 'Movie poster'} 
                        className="w-full aspect-[2/3] object-cover"
                      />
                    </div>
                    <h4 className="font-medium text-sm">{selectedMovie?.title}</h4>
                  </div>
                  
                  {/* Movie list */}
                  <div className="grid grid-cols-3 gap-2">
                    {sharedMovies.map((movie, index) => (
                      <div 
                        key={movie._id} 
                        className={`cursor-pointer rounded overflow-hidden ${selectedMovieIndex === index ? 'ring-2 ring-red-600' : ''}`}
                        onClick={() => setSelectedMovieIndex(index)}
                      >
                        <img 
                          src={movie.poster_url || '/placeholder-movie.jpg'} 
                          alt={movie.title} 
                          className="w-full aspect-[2/3] object-cover"
                          title={movie.title}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 