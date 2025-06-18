import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TeleDrive - Your Telegram Cloud Storage",
  description: "Unleash the power of unlimited storage! Access, manage, and share your Telegram files anywhere, anytime with blazing fast speed and ultimate security.",
  icons: {
    icon: '/logo.webp',
    apple: '/logo.webp',
  },
  openGraph: {
    images: '/logo.webp',
  },
  manifest: '/manifest.json',
  other: {
    "google": "notranslate", // Tells Google not to translate the page
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" translate="no">
      <head>
        <meta name="google" content="notranslate" />
        <meta name="theme-color" content="#000000" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/logo.webp" />
        <script src="/register-sw.js" defer></script>
      </head>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        <Toaster position="top-center" richColors />
        {children}
      </body>
    </html>
  );
}
