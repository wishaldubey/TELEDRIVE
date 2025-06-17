'use client';

import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AppUser } from '@/types';
import { LogOut, FileIcon } from 'lucide-react';

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
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Generate avatar initials from username
  const getInitials = (username: string) => {
    return username.substring(0, 2).toUpperCase();
  };

  return (
    <header className="border-b border-border/40 bg-card/30 sticky top-0 z-10 backdrop-blur-sm shadow-sm">
      <div className="container mx-auto px-4 flex items-center justify-between h-16">
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <div className="flex items-center justify-center bg-gradient-to-r from-primary/30 to-pink/30 w-10 h-10 rounded-full group-hover:shadow-md group-hover:shadow-primary/30 transition-all duration-300">
            <FileIcon className="h-5 w-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xl font-semibold bg-gradient-to-r from-white via-primary to-pink bg-clip-text text-transparent whitespace-nowrap">
              TeleDrive
            </h1>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          <div className="text-sm font-medium hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/50 border border-border/40 max-w-[200px]">
            <span className="h-2 w-2 rounded-full bg-green animate-pulse"></span>
            <span className="text-sm text-foreground truncate">{user.username}</span>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="rounded-full h-10 w-10 p-0 hover:bg-primary/20 relative group">
                <Avatar className="h-9 w-9 border-2 border-primary/20 group-hover:border-primary/60 transition-all duration-200">
                  <AvatarImage 
                    src={user.profile_photo_url || ''} 
                    alt={user.username || 'User'}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-primary/40 to-cyan/40 text-white text-sm font-medium">
                    {getInitials(user.username || 'U')}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-green"></span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 border-border/40 p-2 mr-2 shadow-xl bg-card/95 backdrop-blur-sm">
              <div className="flex items-center gap-3 p-3 border-b border-border/30 mb-1">
                <Avatar className="h-10 w-10">
                  <AvatarImage 
                    src={user.profile_photo_url || ''} 
                    alt={user.username || 'User'}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-primary/40 to-cyan/40 text-white text-sm">
                    {getInitials(user.username || 'U')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-medium text-sm truncate max-w-[180px]">{user.username}</span>
                  <span className="text-muted-foreground text-xs">Telegram User</span>
                </div>
              </div>
              
              <div className="border-t border-border/30 mt-1 pt-2 px-1">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleLogout} 
                  className="w-full justify-start text-sm text-red-500 hover:bg-red-500/10 hover:text-red-500"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
} 