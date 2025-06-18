'use client';

import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AppUser } from '@/types';
import { LogOut, FileIcon, Film, Search, Bell, User as UserIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import Image from 'next/image';

interface DashboardHeaderProps {
  user: AppUser;
}

export default function DashboardHeader({ user }: DashboardHeaderProps) {
  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      
      if (response.ok) {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Get user's display name
  const getDisplayName = () => {
    if (user.first_name || user.last_name) {
      return [user.first_name, user.last_name].filter(Boolean).join(' ');
    }
    return user.username;
  };

  // Generate avatar initials from name or username
  const getInitials = () => {
    if (user.first_name && user.last_name) {
      return (user.first_name[0] + user.last_name[0]).toUpperCase();
    } else if (user.first_name) {
      return user.first_name.substring(0, 2).toUpperCase();
    }
    return (user.username || 'U').substring(0, 2).toUpperCase();
  };

  const displayName = getDisplayName();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 via-black/60 to-transparent backdrop-blur-sm">
      <div className="container mx-auto px-4 flex items-center justify-between h-16">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image
              src="/logo.webp"
              alt="TeleDrive Logo"
              width={40}
              height={40}
              className="hidden sm:block"
            />
            <span className="text-2xl font-bold text-red-600">TELEDRIVE</span>
          </Link>

          <nav className="hidden md:flex">
            <Link href="/dashboard" className="text-white hover:text-gray-300 transition-colors">
              Files
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {/* Search Bar - Only on larger screens */}
          <div className="relative hidden md:block">
            <Input 
              placeholder="Search files..." 
              className="w-48 lg:w-64 bg-gray-900/70 border-gray-700 text-white focus:ring-red-600 focus:border-red-600 pr-9"
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>

          <Link href="/cinema">
            <Button variant="ghost" size="sm" className="gap-2 hover:bg-red-600/10 text-gray-300 hover:text-white">
              <Film className="w-4 h-4" />
              <span className="hidden sm:inline">Cinema</span>
            </Button>
          </Link>
          
          <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white hover:bg-gray-800/60">
            <Bell className="h-5 w-5" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="rounded-full h-10 w-10 p-0 hover:bg-gray-800/60 relative">
                <Avatar className="h-8 w-8 border border-gray-700">
                  <AvatarImage 
                    src={user.profile_photo_url || ''} 
                    alt={displayName}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-red-700 to-red-900 text-white text-sm font-medium">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-green-500"></span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 bg-black/90 border-gray-800 text-white p-1 mt-1">
              <div className="flex items-center gap-3 p-3 border-b border-gray-800 mb-1">
                <Avatar className="h-10 w-10">
                  <AvatarImage 
                    src={user.profile_photo_url || ''} 
                    alt={displayName}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-red-700 to-red-900 text-white text-sm">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-medium text-sm truncate max-w-[180px]">{displayName}</span>
                  <span className="text-gray-400 text-xs">{user.username}</span>
                </div>
              </div>
              
           
               
              
              <div className="border-t border-gray-800 mt-1 pt-1 px-1">
                <DropdownMenuItem 
                  onClick={handleLogout} 
                  className="cursor-pointer hover:bg-gray-800 text-sm text-red-500 hover:text-red-400"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
} 