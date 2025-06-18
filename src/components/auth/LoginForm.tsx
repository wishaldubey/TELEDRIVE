'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'drive' | 'cinema'>('drive');

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
        router.push('/dashboard');
      } else {
        // Cinema mode works for all users
        router.push('/cinema');
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
    <div className="flex items-center justify-center min-h-screen bg-background relative overflow-hidden">
      {/* Colorful background elements */}
      <div className="absolute top-0 left-0 right-0 bottom-0 opacity-10 overflow-hidden">
        <div className="absolute top-0 -left-20 w-96 h-96 bg-primary/40 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-0 -right-20 w-96 h-96 bg-cyan-500/30 rounded-full filter blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/20 rounded-full filter blur-3xl"></div>
      </div>
      
      <div className="w-full max-w-md px-4 relative z-10">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-gradient-to-r from-primary/20 to-primary/40 p-4 rounded-full mb-4">
            <FileIcon size={32} className="text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary via-cyan-400 to-purple-500 bg-clip-text text-transparent">
            TeleDrive
          </h1>
        </div>
        
        <Card className="w-full border-border/40 bg-card/80 backdrop-blur-sm shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl text-center bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              Login to access your files
            </CardDescription>
          </CardHeader>
          
          {/* Mode Toggle */}
          <div className="flex justify-center px-6 pb-4">
            <div className="flex p-1 bg-muted rounded-full w-full max-w-xs">
              <button
                className={`flex-1 py-2 px-4 rounded-full text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                  mode === 'drive'
                    ? 'bg-primary text-white shadow-md'
                    : 'text-muted-foreground hover:text-foreground'
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
                    ? 'bg-primary text-white shadow-md'
                    : 'text-muted-foreground hover:text-foreground'
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
                      <FormLabel className="text-foreground">Username</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            placeholder="Enter your Telegram ID" 
                            className="bg-card pl-10 border-border/40" 
                            {...field} 
                          />
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>
                      </FormControl>
                      <p className="text-xs text-muted-foreground mt-1">
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
                      <FormLabel className="text-foreground">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type="password" 
                            placeholder="Enter your password" 
                            className="bg-card pl-10 border-border/40" 
                            {...field} 
                          />
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>
                      </FormControl>
                      <p className="text-xs text-muted-foreground mt-1">
                        The password was sent to you in Telegram when you added the bot
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-3 rounded-md">
                    {error}
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 text-white shadow-md" 
                  disabled={isLoading}
                >
                  {isLoading ? 'Logging in...' : 'Login'}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col items-center space-y-3 pt-2 pb-4">
            {mode === 'cinema' && (
              <Button 
                onClick={openTelegramBot}
                className="w-full mb-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white flex items-center justify-center gap-2 shadow-md"
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
              className="text-sm text-primary hover:text-primary/90 hover:underline transition-colors"
            >
              Go back to home page
            </Link>
            <p className="text-xs text-muted-foreground max-w-xs text-center bg-card/50 p-2 rounded-md">
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