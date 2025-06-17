# TeleDrive Web Application

A web application for securely accessing and managing files from Telegram channels.

## Features

- **Telegram Login**: Secure authentication using Telegram's login widget
- **File Dashboard**: Browse, search, and filter files from your Telegram channels
- **Secure File Access**: View and download files securely
- **Modern UI**: Built with shadcn/ui components and Tailwind CSS

## Tech Stack

- **Next.js 14** (App Router)
- **Tailwind CSS**
- **shadcn/ui** components
- **MongoDB** with MongoDB Atlas
- **Telegram Login** for authentication

## Setup Instructions

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env.local` file with the following variables:
   ```
   # MongoDB Connection String 
   MONGODB_URI=mongodb+srv://your_mongodb_connection_string
   
   # Telegram Bot Token
   BOT_TOKEN=your_bot_token
   
   # Public Bot Username (without @ symbol)
   NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=YourBotUsername
   
   # JWT Secret
   JWT_SECRET=your-jwt-secret-key-change-me-in-production
   ```

4. Run the development server:
   ```
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

- `src/app`: Next.js App Router pages and API routes
- `src/components`: UI components
- `src/lib`: Utility functions and hooks
- `src/types`: TypeScript type definitions

## API Routes

- **POST /api/auth/telegram**: Telegram authentication endpoint
- **POST /api/auth/logout**: User logout
- **GET /api/files**: Fetch user's files
- **GET /api/download/[fileId]**: Download or view a file securely

## Environment Variables

- `MONGODB_URI`: MongoDB connection string
- `BOT_TOKEN`: Telegram Bot API token
- `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME`: The bot's username for login widget
- `JWT_SECRET`: Secret key for JWT token generation and validation

## Integration with TeleDrive Bot

This web application is designed to work seamlessly with the TeleDrive bot. The bot indexes files from Telegram channels and stores metadata in MongoDB, which this web application uses to display and provide access to files.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
