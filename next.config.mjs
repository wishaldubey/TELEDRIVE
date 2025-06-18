/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable TypeScript checking during build
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  // Disable ESLint checking during build
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  // Enable image optimization for external sources
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.telegram.org',
        pathname: '/file/**',
      },
      {
        protocol: 'https',
        hostname: 't.me',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'telegram.org',
        pathname: '/**',
      },
    ],
  },
  // Output standalone build for better optimization
  output: 'standalone',
  // Set environment variables with defaults
  env: {
    MONGODB_URI: process.env.MONGODB_URI,
    JWT_SECRET: process.env.JWT_SECRET || 'secure-jwt-secret-for-teledrive-project',
    TELEGRAM_BOT_USERNAME: process.env.TELEGRAM_BOT_USERNAME || 'TeloBoxBot',
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '8069923631:AAFuNciS0sd8WzCCH-Zx-acdd9l3rt5O3FA',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://telegramdrive.vercel.app'
  },
};

export default nextConfig; 