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
    domains: ['t.me', 'telegram.org'],
  },
  // Output standalone build for better optimization
  output: 'standalone',
  // Set environment variables with defaults
  env: {
    MONGODB_URI: process.env.MONGODB_URI,
    JWT_SECRET: process.env.JWT_SECRET || 'secure-jwt-secret-for-teledrive-project',
    TELEGRAM_BOT_USERNAME: process.env.TELEGRAM_BOT_USERNAME || 'TeloBoxBot',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://telegramdrive.vercel.app'
  },
};

export default nextConfig; 