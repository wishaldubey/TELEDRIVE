import { NextResponse } from 'next/server';

// Process POST requests (from Telegram widget)
export async function POST() {
  // We no longer support Telegram login, redirect to the username/password login
  return NextResponse.json(
    { 
      success: false, 
      error: 'Telegram login is no longer supported. Please use username/password login.',
      redirect: '/login'
    }, 
    { status: 308 } // Permanent Redirect
  );
}

// Generate the Telegram login URL
export async function GET() {
  const botName = process.env.TELEGRAM_BOT_USERNAME;
  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/telegram-callback`;
  
  // Create the authentication URL for Telegram login
  const telegramAuthUrl = `https://oauth.telegram.org/auth?bot_id=${botName}&origin=${encodeURIComponent(process.env.NEXT_PUBLIC_APP_URL || '')}&return_to=${encodeURIComponent(callbackUrl)}`;
  
  return NextResponse.json({ url: telegramAuthUrl });
} 