import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';

export default async function Home() {
  const cookieStore = await cookies();
  const hasAuthToken = cookieStore.has('auth_token');
  
  // If user is already logged in, redirect to dashboard
  if (hasAuthToken) {
    redirect('/dashboard');
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header/Navigation */}
      <header className="py-6 px-4 sm:px-6 lg:px-8 border-b border-border/40">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Image
              src="/file.svg"
              alt="TeleDrive Logo"
              width={32}
              height={32}
              className="text-primary"
            />
            <span className="text-xl font-bold text-foreground">TeleDrive</span>
          </div>
          <nav>
          <Link href="/login">
              <Button variant="outline" className="hover:text-primary hover:border-primary transition-colors">
              Login
            </Button>
          </Link>
          </nav>
        </div>
      </header>
      
      {/* Hero Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-10">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/25 rounded-full filter blur-3xl" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-primary/20 rounded-full filter blur-3xl" />
        </div>
        
        <div className="container mx-auto relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-r from-white to-primary bg-clip-text text-transparent leading-tight">
              Your Telegram Files,<br className="hidden sm:block" /> Organized
            </h1>
            
            <p className="text-xl text-gray-300 mb-10 leading-relaxed">
              Access, browse, and download all your Telegram channel files in one place.
              TeleDrive makes file management simple and secure.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/login">
                <Button size="lg" className="text-lg px-8 w-full sm:w-auto bg-primary hover:bg-primary/90">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-card/30">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-card rounded-lg border border-border/40 hover:border-primary/30 transition-colors">
              <div className="bg-primary/10 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-4">
                <Image src="/window.svg" alt="Access" width={24} height={24} />
              </div>
              <h3 className="text-xl font-semibold mb-3">Secure Access</h3>
              <p className="text-gray-400">
                Login with Telegram to securely access your files with end-to-end encryption. Your data remains private.
              </p>
            </div>
            
            <div className="p-6 bg-card rounded-lg border border-border/40 hover:border-primary/30 transition-colors">
              <div className="bg-primary/10 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-4">
                <Image src="/globe.svg" alt="Search" width={24} height={24} />
              </div>
              <h3 className="text-xl font-semibold mb-3">Search & Filter</h3>
              <p className="text-gray-400">
                Easily find files with powerful search and filtering options. Sort by file type, date, or name.
              </p>
            </div>
            
            <div className="p-6 bg-card rounded-lg border border-border/40 hover:border-primary/30 transition-colors">
              <div className="bg-primary/10 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-4">
                <Image src="/file.svg" alt="Download" width={24} height={24} />
              </div>
              <h3 className="text-xl font-semibold mb-3">View & Download</h3>
              <p className="text-gray-400">
                Preview files directly in browser or download them to your device. Large files are handled seamlessly.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* How to Get Started Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How to Get Started</h2>
          
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <h3 className="text-2xl font-semibold mb-6 flex items-center">
                  <span className="bg-primary/20 text-primary px-3 py-1 rounded-full mr-3 text-sm">Step 1</span>
                  Set Up the Bot
                </h3>
                
                <div className="space-y-4 text-gray-300">
<p>
  1. Find{" "}
  <a
    href="https://t.me/TeloBoxBot"
    target="_blank"
    rel="noopener noreferrer"
    className="text-primary font-semibold underline"
  >
    @TeloBoxBot
  </a>{" "}
  on Telegram
</p>
                  <p>2. Start the bot with the <span className="bg-card px-2 py-1 rounded font-mono text-sm">/start</span> command</p>
                  <p>3. Follow the instructions to authorize the bot</p>
                  <p>4. Add the bot to your channels as an admin to enable file indexing</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-2xl font-semibold mb-6 flex items-center">
                  <span className="bg-primary/20 text-primary px-3 py-1 rounded-full mr-3 text-sm">Step 2</span>
                  Access Your Files
                </h3>
                
                <div className="space-y-4 text-gray-300">
                  <p>1. <Link href="/login" className="text-primary underline">Log in</Link> to TeleDrive using your Telegram account</p>
                  <p>2. Browse your indexed files in the dashboard</p>
                  <p>3. Search, filter, and download your files</p>
                  <p>4. For files larger than 20MB, the bot will send them directly to your Telegram chat</p>
                </div>
              </div>
            </div>
            
            <div className="mt-12 p-6 rounded-lg bg-card border border-border/40">
              <h4 className="text-lg font-semibold mb-2">Pro Tips</h4>
              <ul className="list-disc list-inside space-y-2 text-gray-300">
                <li>Add descriptive captions to your files in Telegram for better searchability</li>
                <li>Organize files into different channels based on categories</li>
                <li>Use the Telegram bot commands to manage your files directly from Telegram</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
      
      
      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-border/40">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <Image
              src="/file.svg"
              alt="TeleDrive Logo"
              width={24}
              height={24}
              className="text-primary"
            />
            <span className="font-bold text-foreground">TeleDrive</span>
          </div>
          
          <div className="text-gray-400 text-sm">
          
  <a
    href="https://instagram.com/lipstickeraservishal"
    target="_blank"
    rel="noopener noreferrer"
    className="text-blue-400 hover:underline"
  >
    @lipstickeraservishal
  </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
