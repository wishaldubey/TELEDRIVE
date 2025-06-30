'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, CheckCircle, FilmIcon, FileIcon, GlobeIcon, Download } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAndroid, setIsAndroid] = useState(false);
  
  // Check if the user is already logged in
  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch('/api/auth/check');
        const data = await response.json();
        
        // If authenticated, redirect based on user type
        if (data.authenticated) {
          if (data.user.channel_id) {
            router.replace('/dashboard');
          } else {
            router.replace('/cinema');
          }
          return;
        }
      } catch (error) {
        console.error('Auth check error:', error);
      }
      
      // If not authenticated or error occurred, show the home page
      setIsLoading(false);
    }
    
    checkAuth();

    // Detect if the user is on Android device
    if (typeof window !== 'undefined') {
      const userAgent = window.navigator.userAgent.toLowerCase();
      if (userAgent.indexOf('android') > -1 && userAgent.indexOf('mobile') > -1) {
        setIsAndroid(true);
      }
    }
  }, [router]);
  
  // Show loading state until authentication check completes
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-pulse">
          <Image
            src="/logo.webp"
            alt="TeleDrive Logo"
            width={100}
            height={100}
            className="text-primary"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      {/* Header/Navigation */}
      <header className="py-6 px-4 sm:px-6 lg:px-8 fixed w-full z-50 bg-gradient-to-b from-black via-black/80 to-transparent">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex-1 flex items-center space-x-2">
            <Image
              src="/logo.webp"
              alt="TeleDrive Logo"
              width={40}
              height={40}
              className="text-primary"
            />
            <span className="text-2xl font-bold text-red-600">
              TELEDRIVE
            </span>
          </div>
          
          <nav className="flex space-x-4">
            <Link href="/login">
              <Button variant="outline" className="border-gray-600 hover:bg-gray-800 hover:border-gray-500 text-white transition-colors">
                Sign In
              </Button>
            </Link>
          </nav>
        </div>
      </header>
      
      {/* Hero Section */}
      <section className="h-screen flex items-center relative overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 bg-black">
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-50"
            style={{ 
              backgroundImage: `url('https://assets.nflxext.com/ffe/siteui/vlv3/93da5c27-be66-427c-8b72-5cb39d275279/94eb5ad7-10d8-4cca-bf45-ac52e0a052c0/US-en-20240226-popsignuptwoweeks-perspective_alpha_website_large.jpg')`,
              filter: 'brightness(0.5) contrast(1.1)'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Your files. Your movies.<br /> All in one place.
          </h1>
          
          <p className="text-xl md:text-2xl mb-8">
            Watch anywhere. Download anything.
          </p>
          
          <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Ready to get started? Create an account or sign in to access your files and movies.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/login?mode=drive" className="flex-1 sm:flex-none">
              <Button size="lg" className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white text-lg px-8 py-6 rounded flex items-center justify-center gap-2">
                Get Started with Drive
                <ChevronRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login?mode=cinema" className="flex-1 sm:flex-none">
              <Button size="lg" className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white text-lg px-8 py-6 rounded flex items-center justify-center gap-2">
                Explore Cinema
                <ChevronRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-20 bg-black border-t-8 border-gray-800">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6 order-2 md:order-1">
              <h2 className="text-3xl md:text-5xl font-bold">Organize your Telegram files</h2>
              <p className="text-lg md:text-xl text-gray-300">
                Access, browse, and download all your Telegram channel files in one place. 
                TeleDrive makes file management simple and secure.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-red-600" />
                  <span className="text-lg">Preview and download any file type</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-red-600" />
                  <span className="text-lg">Secure access with Telegram authentication</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-red-600" />
                  <span className="text-lg">Automatic file metadata extraction</span>
                </li>
              </ul>
            </div>
            <div className="relative order-1 md:order-2">
              <div className="relative z-10 shadow-2xl rounded-lg overflow-hidden border-4 border-gray-800">
                <Image 
                  src="https://posterspy.com/wp-content/uploads/2022/02/The-Batman_4x5.png" 
                  alt="THE BATMAN" 
                  width={600} 
                  height={400}
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                  <FileIcon className="h-20 w-20 text-red-600" />
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 h-40 w-40 bg-red-600/20 blur-3xl rounded-full z-0"></div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Cinema Feature Section */}
      <section className="py-20 bg-black border-t-8 border-gray-800">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="relative">
              <div className="relative z-10 shadow-2xl rounded-lg overflow-hidden border-4 border-gray-800">
                <Image 
                  src="https://m.media-amazon.com/images/M/MV5BZTg1Mjg5NjktZTc5Yi00ODc1LTg1N2EtMDhjZmYzYzYwY2ZiXkEyXkFqcGc@._V1_QL75_UX1197_.jpg" 
                  alt="BHAVESH JOSHI SUPERHERO" 
                  width={600} 
                  height={400}
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                  <FilmIcon className="h-20 w-20 text-red-600" />
                </div>
              </div>
              <div className="absolute -bottom-4 -left-4 h-40 w-40 bg-red-600/20 blur-3xl rounded-full z-0"></div>
            </div>
            <div className="space-y-6">
              <h2 className="text-3xl md:text-5xl font-bold">Enjoy movies and TV shows</h2>
              <p className="text-lg md:text-xl text-gray-300">
                Browse, discover, and download your favorite movies and TV shows.
                The Cinema mode offers a Netflix-like experience for your entertainment.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-red-600" />
                  <span className="text-lg">Browse movies by genre and year</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-red-600" />
                  <span className="text-lg">Create your personal watchlist</span>
                </li>
               
              </ul>
            </div>
          </div>
        </div>
      </section>
      
      {/* How to Get Started Section */}
      <section className="py-20 bg-black border-t-8 border-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-16">How to Get Started</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-900 rounded-lg p-8 border border-gray-800 relative">
              <div className="absolute -top-5 -left-5 w-10 h-10 rounded-full flex items-center justify-center bg-red-600 text-white font-bold text-lg">
                1
              </div>
              <h3 className="text-2xl font-bold mb-4">Find our Telegram Bot</h3>
              <p className="text-gray-300 mb-4">
                Search for <span className="text-red-600 font-semibold">@TeloBoxBot</span> on Telegram 
                and start the bot with the <span className="bg-gray-800 px-2 py-1 rounded font-mono text-sm">/start</span> command.
              </p>
              <div className="flex justify-center mt-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                  <path d="m22 2-7 20-4-9-9-4Z" />
                  <path d="M22 2 11 13" />
                </svg>
              </div>
            </div>
            
            <div className="bg-gray-900 rounded-lg p-8 border border-gray-800 relative">
              <div className="absolute -top-5 -left-5 w-10 h-10 rounded-full flex items-center justify-center bg-red-600 text-white font-bold text-lg">
                2
              </div>
              <h3 className="text-2xl font-bold mb-4">Connect Your Account</h3>
              <p className="text-gray-300 mb-4">
                Follow the instructions to authorize the bot. For Drive access, add the bot to your channel as an admin to enable file indexing.
              </p>
              <div className="flex justify-center mt-6">
                <FileIcon className="h-12 w-12 text-red-600" />
              </div>
            </div>
            
            <div className="bg-gray-900 rounded-lg p-8 border border-gray-800 relative">
              <div className="absolute -top-5 -left-5 w-10 h-10 rounded-full flex items-center justify-center bg-red-600 text-white font-bold text-lg">
                3
              </div>
              <h3 className="text-2xl font-bold mb-4">Enjoy Your Content</h3>
              <p className="text-gray-300 mb-4">
                Log in to TeleDrive using your Telegram credentials. Browse your indexed files or explore movies in the Cinema section.
              </p>
              <div className="flex justify-center mt-6">
                <GlobeIcon className="h-12 w-12 text-red-600" />
              </div>
            </div>
          </div>
          
          <div className="mt-16 text-center">
            <Link href="/login">
              <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white text-lg px-10 py-6 rounded">
                Get Started Now
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      {/* FAQ Section */}
      <section className="py-20 bg-black border-t-8 border-gray-800">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-16">Frequently Asked Questions</h2>
          
          <div className="space-y-4">
            <div className="bg-gray-900 rounded p-6 border border-gray-800">
              <h3 className="text-xl font-bold mb-2">Is TeleDrive free to use?</h3>
              <p className="text-gray-300">Yes, TeleDrive is completely free. All you need is a Telegram account.</p>
            </div>
            
            <div className="bg-gray-900 rounded p-6 border border-gray-800">
              <h3 className="text-xl font-bold mb-2">How secure are my files?</h3>
              <p className="text-gray-300">Your files are as secure as your Telegram account. TeleDrive uses Telegram's own security protocols and doesn't store your files on external servers.</p>
            </div>
            
            <div className="bg-gray-900 rounded p-6 border border-gray-800">
              <h3 className="text-xl font-bold mb-2">Can I download large files?</h3>
              <p className="text-gray-300">Yes! Files up to 20MB can be downloaded directly through the web interface. For larger files, TeleDrive will send them to your Telegram chat.</p>
            </div>
            
            <div className="bg-gray-900 rounded p-6 border border-gray-800">
              <h3 className="text-xl font-bold mb-2">What file types are supported?</h3>
              <p className="text-gray-300">TeleDrive supports all file types that Telegram supports, including documents, images, videos, audio files, and more.</p>
            </div>
            
            <div className="bg-gray-900 rounded p-6 border border-gray-800">
              <h3 className="text-xl font-bold mb-2">How do I access the Cinema feature?</h3>
              <p className="text-gray-300">Sign in using the Cinema mode option at the login screen. You'll have access to our entire movie catalog without needing to add the bot to a channel.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-red-900/50 to-black border-t-8 border-gray-800">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to browse your files and movies?
          </h2>
          <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-3xl mx-auto">
            Start organizing your Telegram files or enjoy downloading your favorite movies today.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Link href="/login?mode=drive">
              <Button size="lg" className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white text-lg px-10 py-6 rounded flex items-center justify-center gap-2">
                Start with Drive
                <ChevronRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login?mode=cinema">
              <Button size="lg" className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white text-lg px-10 py-6 rounded flex items-center justify-center gap-2">
                Go to Cinema
                <ChevronRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-12 px-4 bg-black border-t border-gray-800">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Image
                src="/logo.webp"
                alt="TeleDrive Logo"
                width={30}
                height={30}
                className="text-primary"
              />
              <span className="font-bold text-red-600">TELEDRIVE</span>
            </div>
            
            <div className="text-gray-400 text-sm">
              <a
                href="https://instagram.com/lipstickeraservishal"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-red-600 hover:underline"
              >
                @lipstickeraservishal
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Download Button - Only visible on Android devices */}
      {isAndroid && (
        <div className="fixed bottom-8 right-8 z-50">
          <a 
            href="/TELEDRIVE.apk" 
            download
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-full shadow-lg transition-all hover:shadow-xl"
          >
            <Download className="h-5 w-5" />
            <span>Download our Android app</span>
          </a>
        </div>
      )}
    </div>
  );
}
