"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader } from "@/components/ui/loader";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Edit2, Save } from "lucide-react";

interface UserProfile {
  _id: string;
  user_id: number;
  name: string;
  dob: string;
  gender: string;
  profile_picture?: string;
  bio?: string;
  favorite_genres?: string[];
  completed_onboarding: boolean;
  daily_swipe_count?: number;
}

export default function VibeMatchProfile() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState(false);
  
  // Form states
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [bio, setBio] = useState("");
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const router = useRouter();
  const { toast } = useToast();
  
  // Fetch user data and profile
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Get user data
        const userResponse = await fetch('/api/auth/user');
        if (userResponse.ok) {
          const userData = await userResponse.json();
          if (userData.success) {
            setUser(userData);
            
            // Fetch the user's vibe match profile
            const profileResponse = await fetch('/api/vibe-match/profile');
            if (profileResponse.ok) {
              const profileData = await profileResponse.json();
              
              if (profileData.success && profileData.profile) {
                const userProfile = profileData.profile;
                setProfile(userProfile);
                
                // Populate form fields
                setName(userProfile.name || "");
                setDob(userProfile.dob || "");
                setGender(userProfile.gender || "");
                setBio(userProfile.bio || "");
              } else {
                // No profile exists, redirect to vibe-match home for onboarding
                router.push('/vibe-match');
              }
            } else {
              router.push('/vibe-match');
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
          description: "Failed to load profile data. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router, toast]);

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

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !dob || !gender) {
      toast({
        title: "Missing Information",
        description: "Please fill out all required fields.",
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
      formData.append('bio', bio || "");
      
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
          setEditing(false);
          
          toast({
            title: "Profile Updated",
            description: "Your Vibe Match profile has been updated successfully!",
          });
        } else {
          throw new Error(data.message || 'Failed to update profile');
        }
      } else {
        throw new Error('Server error');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update your profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
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
  
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#141414]">
        <Loader size="lg" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#141414] text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Profile Not Found</h2>
          <p className="text-gray-400 mb-6">Complete your onboarding to create a profile.</p>
          <Link href="/vibe-match">
            <Button className="bg-red-600 hover:bg-red-700">Go to Vibe Match</Button>
          </Link>
        </div>
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
            <h1 className="text-2xl md:text-3xl font-bold">Your Profile</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 py-6">
        <Card className="bg-[#1a1a1a] border border-gray-800 overflow-hidden">
          {/* Profile header with cover image */}
          <div className="h-32 bg-gradient-to-r from-red-700 to-red-900"></div>
          
          <CardContent className="p-0">
            <div className="px-6 pb-6">
              {/* Profile picture */}
              <div className="relative -mt-12 mb-4">
                <div className="w-24 h-24 rounded-full border-4 border-[#1a1a1a] overflow-hidden">
                  {editing && profilePicturePreview ? (
                    <img 
                      src={profilePicturePreview} 
                      alt="Profile Preview" 
                      className="w-full h-full object-cover"
                    />
                  ) : profile.profile_picture ? (
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
                </div>
                
                {!editing && (
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="absolute bottom-0 right-0 rounded-full"
                    onClick={() => setEditing(true)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              {editing ? (
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          type="text"
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
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <textarea
                          id="bio"
                          rows={4}
                          placeholder="Tell others about yourself..."
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="profile-picture">Profile Picture</Label>
                        <Input
                          id="profile-picture"
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="bg-gray-800 border-gray-700"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEditing(false)}
                      className="flex-1"
                      disabled={uploading}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-red-600 hover:bg-red-700"
                      disabled={uploading}
                    >
                      {uploading ? <Loader size="sm" className="mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                      Save Changes
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold">{profile.name}</h2>
                    <p className="text-gray-400">
                      {calculateAge(profile.dob)} years old • {profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)}
                    </p>
                  </div>
                  
                  {profile.bio && (
                    <div>
                      <h3 className="text-lg font-medium mb-2">About</h3>
                      <p className="text-gray-300">{profile.bio}</p>
                    </div>
                  )}
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Stats</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="bg-[#232323] p-4 rounded-md">
                        <div className="text-2xl font-bold text-red-500">{profile.daily_swipe_count || 0}</div>
                        <div className="text-sm text-gray-400">Daily Swipes</div>
                      </div>
                      <div className="bg-[#232323] p-4 rounded-md">
                        <div className="text-2xl font-bold text-red-500">--</div>
                        <div className="text-sm text-gray-400">Matches</div>
                      </div>
                      <div className="bg-[#232323] p-4 rounded-md">
                        <div className="text-2xl font-bold text-red-500">--</div>
                        <div className="text-sm text-gray-400">Movies Rated</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <Button 
                      onClick={() => setEditing(true)}
                      className="w-full md:w-auto bg-red-600 hover:bg-red-700"
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 