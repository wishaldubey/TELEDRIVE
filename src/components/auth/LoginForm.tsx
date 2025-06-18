'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { FileIcon, Lock, User, Film } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

// Form validation schema
const formSchema = z.object({
  username: z.string().min(3, {
    message: 'Username must be at least 3 characters.',
  }),
  password: z.string().min(6, {
    message: 'Password must be at least 6 characters.',
  }),
});

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get('mode') as 'drive' | 'cinema' || 'cinema';
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'drive' | 'cinema'>(initialMode);

  // Check if user is already logged in on component mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch('/api/auth/check', {
          method: 'GET',
        });

        if (response.ok) {
          const data = await response.json();
          if (data.authenticated) {
            // Redirect based on user type
            if (data.user.channel_id) {
              router.push('/dashboard');
            } else {
              router.push('/cinema');
            }
          }
        }
      } catch (error) {
        // Silently fail - user will stay on login page
        console.error('Auth check failed', error);
      }
    };

    checkAuthStatus();
  }, [router]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...values, mode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Handle user type validation and redirection
      if (mode === 'drive') {
        // Drive mode requires channel_id
        if (!data.user.channel_id) {
          toast.error("You don't have a private Drive account. Please create one first by adding the bot to your channel.");
          setError("This account doesn't have Drive Mode access. Please add the bot to your Telegram channel first, or switch to Cinema Mode.");
          setIsLoading(false);
          return;
        }
        // Use direct window location for more reliable redirection
        window.location.href = '/dashboard';
      } else {
        // Cinema mode works for all users
        window.location.href = '/cinema';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  }

  const openTelegramBot = () => {
    window.open('https://t.me/TeloBoxBot', '_blank');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative">
      {/* Background image with overlay */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-25"
          style={{ 
            backgroundImage: `url('https://assets.nflxext.com/ffe/siteui/vlv3/93da5c27-be66-427c-8b72-5cb39d275279/94eb5ad7-10d8-4cca-bf45-ac52e0a052c0/US-en-20240226-popsignuptwoweeks-perspective_alpha_website_large.jpg')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/90 to-black/70"></div>
      </div>
      
      {/* Header */}
      <div className="fixed top-0 left-0 w-full p-6 z-10">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.webp"
            alt="TeleDrive Logo"
            width={40}
            height={40}
          />
          <span className="text-2xl font-bold text-red-600">TELEDRIVE</span>
        </Link>
      </div>
      
      <div className="w-full max-w-md px-4 relative z-10">
        <Card className="w-full bg-black/80 backdrop-blur-sm border border-gray-800 shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-3xl text-white">Sign In</CardTitle>
            <CardDescription className="text-gray-400">
              Welcome back to TeleDrive
            </CardDescription>
          </CardHeader>
          
          {/* Mode Toggle */}
          <div className="flex justify-center px-6 pb-4">
            <div className="flex p-1 bg-gray-900 rounded-full w-full">
              <button
                className={`flex-1 py-2 px-4 rounded-full text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                  mode === 'drive'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
                onClick={() => setMode('drive')}
                type="button"
              >
                <FileIcon size={16} />
                Drive Mode
              </button>
              <button
                className={`flex-1 py-2 px-4 rounded-full text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                  mode === 'cinema'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
                onClick={() => setMode('cinema')}
                type="button"
              >
                <Film size={16} />
                Cinema Mode
              </button>
            </div>
          </div>
          
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Username</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            placeholder="Enter your Telegram ID" 
                            className="bg-gray-800 border-gray-700 text-white pl-10" 
                            {...field} 
                          />
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        </div>
                      </FormControl>
                      <p className="text-xs text-gray-500 mt-1">
                        Your username is your Telegram ID, sent to you when you added the bot
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type="password" 
                            placeholder="Enter your password" 
                            className="bg-gray-800 border-gray-700 text-white pl-10" 
                            {...field} 
                          />
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        </div>
                      </FormControl>
                      <p className="text-xs text-gray-500 mt-1">
                        The password was sent to you in Telegram when you added the bot
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {error && (
                  <div className="bg-red-900/30 border border-red-800 text-red-400 text-sm p-3 rounded-md">
                    {error}
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-6 text-lg" 
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col items-center space-y-3 pt-2 pb-6">
            {mode === 'cinema' && (
              <Button 
                onClick={openTelegramBot}
                className="w-full mb-2 bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-send">
                  <path d="m22 2-7 20-4-9-9-4Z" />
                  <path d="M22 2 11 13" />
                </svg>
                Sign Up via Telegram
              </Button>
            )}
            <Link 
              href="/" 
              className="text-sm text-gray-400 hover:text-white hover:underline transition-colors"
            >
              Go back to home page
            </Link>
            <p className="text-xs text-gray-500 max-w-xs text-center bg-gray-900/50 p-2 rounded-md mt-4">
              {mode === 'drive' 
                ? "To get access, add our Telegram bot (@TeloBoxBot) as an admin to your channel"
                : "For Cinema Mode, sign up through our Telegram bot to get your credentials"
              }
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 