'use client';

import { Button } from '@/components/ui/button';

interface SimpleTelegramLoginProps {
  botName: string;
}

export default function SimpleTelegramLogin({ botName }: SimpleTelegramLoginProps) {
  const handleLogin = () => {
    // Open Telegram directly to the bot
    window.open(`https://t.me/${botName}`, '_blank');
  };

  return (
    <div className="flex flex-col items-center">
      <Button 
        onClick={handleLogin}
        className="bg-[#54a9eb] hover:bg-[#4095d6] text-white font-medium py-2 px-4 rounded"
      >
        Open Telegram Bot
      </Button>
      <div className="mt-2 text-xs text-gray-500">
        This will open the Telegram bot in a new window
      </div>
    </div>
  );
} 