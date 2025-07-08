"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader } from "@/components/ui/loader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Heart, X, Check, ArrowLeft, Users, Clock, UserCheck } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";

interface VibeRequest {
  _id: string;
  fromUserId: number;
  toUserId: number;
  senderName: string;
  senderProfilePic?: string;
  matchScore: number;
  sharedMovies: string[];
  createdAt: string;
  status: "pending" | "accepted" | "rejected";
}

interface VibeMatch {
  _id: string;
  user1: number;
  user2: number;
  otherUserName?: string;
  otherUserProfilePic?: string;
  matchScore: number;
  sharedMovies: string[];
  lastMessage?: {
    text: string;
    timestamp: string;
  };
  createdAt: string;
  status: "active" | "inactive";
}

export default function VibeMatches() {
  const [loading, setLoading] = useState(true);
  const [pendingRequests, setPendingRequests] = useState<VibeRequest[]>([]);
  const [activeMatches, setActiveMatches] = useState<VibeMatch[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<VibeRequest[]>([]);
  const [archivedMatches, setArchivedMatches] = useState<VibeMatch[]>([]);
  const [user, setUser] = useState<any>(null);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);
  
  const router = useRouter();
  const { toast } = useToast();

  // Fetch user data and requests
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
            
            // Fetch incoming pending requests
            const incomingResponse = await fetch('/api/vibe-match/requests?status=pending&type=incoming');
            if (incomingResponse.ok) {
              const incomingData = await incomingResponse.json();
              if (incomingData.success) {
                setPendingRequests(incomingData.requests);
              }
            }
            
            // Fetch outgoing pending requests
            const outgoingResponse = await fetch('/api/vibe-match/requests?status=pending&type=outgoing');
            if (outgoingResponse.ok) {
              const outgoingData = await outgoingResponse.json();
              if (outgoingData.success) {
                setOutgoingRequests(outgoingData.requests);
              }
            }
            
            // Fetch active matches
            const matchesResponse = await fetch('/api/vibe-match/matches');
            if (matchesResponse.ok) {
              const matchesData = await matchesResponse.json();
              if (matchesData.success) {
                setActiveMatches(matchesData.matches.filter((m: VibeMatch) => m.status === 'active'));
                setArchivedMatches(matchesData.matches.filter((m: VibeMatch) => m.status === 'inactive'));
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
          description: "Failed to load data. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router, toast]);

  const handleRequestAction = async (requestId: string, action: 'accept' | 'reject') => {
    try {
      setProcessingRequestId(requestId);
      
      const response = await fetch('/api/vibe-match/requests/response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request_id: requestId,
          action
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          // Remove the request from the pending list
          setPendingRequests(prev => prev.filter(req => req._id !== requestId));
          
          if (action === 'accept') {
            toast({
              title: "Match Created!",
              description: "You have a new vibe match!",
              variant: "default"
            });
            
            // Refresh active matches
            const matchesResponse = await fetch('/api/vibe-match/matches');
            if (matchesResponse.ok) {
              const matchesData = await matchesResponse.json();
              if (matchesData.success) {
                setActiveMatches(matchesData.matches.filter((m: VibeMatch) => m.status === 'active'));
              }
            }
          } else {
            toast({
              title: "Request Rejected",
              description: "You've rejected the vibe request.",
              variant: "default"
            });
          }
        }
      } else {
        throw new Error('Failed to process request');
      }
    } catch (error) {
      console.error('Error processing request:', error);
      toast({
        title: "Error",
        description: "Failed to process the request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessingRequestId(null);
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };
  
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#141414]">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] text-white">
      {/* Netflix inspired header with gradient */}
      <div className="bg-gradient-to-b from-black/80 to-transparent pt-4 pb-6 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center">
          <Link href="/vibe-match" className="mr-4">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
            <h1 className="text-2xl md:text-3xl font-bold">Your Connections</h1>
          </div>
        </div>
        </div>
        
      <div className="container mx-auto max-w-4xl px-4 py-6">
        <Tabs defaultValue="matches" className="w-full">
          <TabsList className="w-full grid grid-cols-3 bg-[#232323] rounded-md mb-8 p-1">
            <TabsTrigger 
              value="matches" 
              className="data-[state=active]:bg-red-600 data-[state=active]:text-white"
            >
              <UserCheck className="h-4 w-4 mr-2" />
              Matches
              {activeMatches.length > 0 && (
                <Badge className="ml-2 bg-white/20 text-white">{activeMatches.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="requests" 
              className="data-[state=active]:bg-red-600 data-[state=active]:text-white"
            >
              <Users className="h-4 w-4 mr-2" />
              Requests
              {pendingRequests.length > 0 && (
                <Badge className="ml-2 bg-white/20 text-white">{pendingRequests.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="sent" 
              className="data-[state=active]:bg-red-600 data-[state=active]:text-white"
            >
              <Clock className="h-4 w-4 mr-2" />
              Sent
              {outgoingRequests.length > 0 && (
                <Badge className="ml-2 bg-white/20 text-white">{outgoingRequests.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="matches" className="mt-0">
            {activeMatches.length === 0 ? (
              <div className="bg-[#1a1a1a] rounded-md border border-gray-800 flex flex-col items-center justify-center py-16 text-center">
                <Heart className="h-16 w-16 text-gray-600 mb-4" />
                <h3 className="text-xl font-semibold">No Matches Yet</h3>
                <p className="text-gray-400 mt-2 max-w-sm">
                  Start swiping on movies to find your perfect vibe match!
                </p>
                <Link href="/vibe-match" className="mt-6">
                  <Button className="bg-red-600 hover:bg-red-700">
                    Discover Movies
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {activeMatches.map(match => (
                  <Link href={`/vibe-match/chat/${match._id}`} key={match._id}>
                    <Card className="bg-[#1a1a1a] border border-gray-800 hover:border-gray-700 transition-colors cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-center">
                          <Avatar className="h-12 w-12 mr-4">
                            {match.otherUserProfilePic ? (
                              <AvatarImage 
                                src={`/api/vibe-match/profile-picture/${match.otherUserProfilePic}`} 
                                alt={match.otherUserName || 'Match'} 
                              />
                            ) : null}
                            <AvatarFallback className="bg-red-700 text-white">
                              {match.otherUserName ? match.otherUserName.substring(0, 2).toUpperCase() : '?'}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <h3 className="font-semibold">{match.otherUserName}</h3>
                                <Badge className="ml-2 bg-blue-600/80 text-white">
                                  {match.matchScore}% Match
                                </Badge>
                              </div>
                              <span className="text-xs text-gray-500">
                                {formatDate(match.createdAt)}
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-sm text-gray-400 truncate max-w-[200px]">
                                {match.lastMessage ? match.lastMessage.text : `${match.sharedMovies.length} movies in common`}
                              </p>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                <MessageCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
                
                {archivedMatches.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-medium text-gray-400 mb-4">Archived Matches</h3>
                    <div className="space-y-3 opacity-70">
                      {archivedMatches.map(match => (
                        <Card key={match._id} className="bg-[#1a1a1a] border border-gray-800">
                          <CardContent className="p-4">
                            <div className="flex items-center">
                              <Avatar className="h-10 w-10 mr-4">
                                {match.otherUserProfilePic ? (
                                  <AvatarImage 
                                    src={`/api/thumbnail/${match.otherUserProfilePic}?direct=true`} 
                                    alt={match.otherUserName || 'Match'} 
                                  />
                                ) : null}
                                <AvatarFallback className="bg-gray-700 text-white">
                                  {match.otherUserName ? match.otherUserName.substring(0, 2).toUpperCase() : '?'}
                                </AvatarFallback>
                                </Avatar>
                                <div>
                                <h3 className="font-medium">{match.otherUserName}</h3>
                                <p className="text-xs text-gray-500">Archived • {formatDate(match.createdAt)}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="requests" className="mt-0">
            {pendingRequests.length === 0 ? (
              <div className="bg-[#1a1a1a] rounded-md border border-gray-800 flex flex-col items-center justify-center py-16 text-center">
                <Users className="h-16 w-16 text-gray-600 mb-4" />
                <h3 className="text-xl font-semibold">No Incoming Requests</h3>
                <p className="text-gray-400 mt-2 max-w-sm">
                  When someone wants to match with you, it will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map(request => (
                  <Card key={request._id} className="bg-[#1a1a1a] border border-gray-800">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                          <Avatar className="h-12 w-12 mr-4">
                            {request.senderProfilePic ? (
                              <AvatarImage 
                                src={`/api/thumbnail/${request.senderProfilePic}?direct=true`} 
                                alt={request.senderName} 
                              />
                            ) : null}
                            <AvatarFallback className="bg-red-700 text-white">
                              {request.senderName.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div>
                            <div className="flex items-center gap-2">
                                    <h3 className="font-semibold">{request.senderName}</h3>
                              <Badge className="bg-blue-600/80 text-white">
                                      {request.matchScore}% Match
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-400">
                              {request.sharedMovies.length} movies in common • {formatDate(request.createdAt)}
                                  </p>
                                </div>
                              </div>
                        
                              <div className="flex gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="rounded-full hover:bg-red-900/20 text-red-500"
                                  onClick={() => handleRequestAction(request._id, 'reject')}
                                  disabled={processingRequestId === request._id}
                                >
                                  {processingRequestId === request._id ? (
                                    <Loader size="sm" />
                                  ) : (
                                    <X className="h-5 w-5" />
                                  )}
                                </Button>
                          
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="rounded-full hover:bg-green-900/20 text-green-500"
                                  onClick={() => handleRequestAction(request._id, 'accept')}
                                  disabled={processingRequestId === request._id}
                                >
                                  {processingRequestId === request._id ? (
                                    <Loader size="sm" />
                                  ) : (
                                    <Check className="h-5 w-5" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="sent" className="mt-0">
            {outgoingRequests.length === 0 ? (
              <div className="bg-[#1a1a1a] rounded-md border border-gray-800 flex flex-col items-center justify-center py-16 text-center">
                <Clock className="h-16 w-16 text-gray-600 mb-4" />
                <h3 className="text-xl font-semibold">No Pending Requests</h3>
                <p className="text-gray-400 mt-2 max-w-sm">
                  You haven't sent any vibe match requests yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {outgoingRequests.map(request => (
                  <Card key={request._id} className="bg-[#1a1a1a] border border-gray-800">
                    <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <Avatar className="h-12 w-12 mr-4">
                            <AvatarFallback className="bg-gray-700">
                              {request.senderName.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                          
                              <div>
                            <h3 className="font-semibold">Request to {request.senderName}</h3>
                            <div className="flex items-center mt-1">
                              <Badge className="bg-yellow-600/80 text-white mr-2">
                                Pending
                                  </Badge>
                                <p className="text-sm text-gray-400">
                                Sent {formatDate(request.createdAt)}
                                </p>
                            </div>
                          </div>
                        </div>
                          </div>
                        </CardContent>
                      </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 