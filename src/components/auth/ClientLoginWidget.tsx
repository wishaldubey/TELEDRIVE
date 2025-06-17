'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the Telegram Login Widget with no SSR
const TelegramLoginWidget = dynamic(
  () => import('@/components/auth/TelegramLoginWidget'),
  { ssr: false }
);

interface ClientLoginWidgetProps {
  botName: string;
}

export default function ClientLoginWidget({ botName }: ClientLoginWidgetProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
    console.log('ClientLoginWidget mounted with bot name:', botName);
  }, [botName]);

  return (
    <div className="flex flex-col items-center">
      <TelegramLoginWidget botName={botName} />
      {!isLoaded && <p>Loading Telegram login button...</p>}
      <div className="mt-2 text-xs text-gray-500">
        Bot Name: {botName}
      </div>
    </div>
  );
} 