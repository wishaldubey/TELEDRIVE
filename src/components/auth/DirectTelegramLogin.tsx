'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function DirectTelegramLogin() {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleTelegramLogin = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/telegram');
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('Failed to get Telegram login URL');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error initiating Telegram login:', error);
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleTelegramLogin}
      disabled={isLoading}
      className="w-full bg-[#0088cc] hover:bg-[#0088cc]/90 text-white"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          <svg 
            className="mr-2 h-4 w-4" 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="m22 2-7 20-4-9-9-4Z" />
            <path d="M22 2 11 13" />
          </svg>
          Continue with Telegram
        </>
      )}
    </Button>
  );
} 