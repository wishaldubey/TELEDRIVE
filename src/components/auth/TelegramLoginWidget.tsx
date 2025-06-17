'use client';

import { useEffect, useRef } from 'react';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

interface TelegramLoginWidgetProps {
  botName: string;
  buttonSize?: 'large' | 'medium' | 'small';
  cornerRadius?: number;
  requestAccess?: boolean;
  usePic?: boolean;
  lang?: string;
  widgetVersion?: number;
  className?: string;
  onAuth: (user: TelegramUser) => void;
}

export default function TelegramLoginWidget({
  botName,
  buttonSize = 'large',
  cornerRadius = 4,
  requestAccess = true,
  usePic = true,
  lang = 'en',
  widgetVersion = 21,
  className = '',
  onAuth,
}: TelegramLoginWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const telegramLoginWidgetId = `telegram-login-${botName}`;

  useEffect(() => {
    // Load the Telegram script
    const script = document.createElement('script');
    script.src = `https://telegram.org/js/telegram-widget.js?${widgetVersion}`;
    script.setAttribute('data-telegram-login', botName);
    script.setAttribute('data-size', buttonSize);
    script.setAttribute('data-radius', cornerRadius.toString());
    script.setAttribute('data-request-access', requestAccess ? 'write' : 'read');
    script.setAttribute('data-userpic', usePic.toString());
    script.setAttribute('data-lang', lang);
    
    // Save a reference to the container element
    const currentContainer = containerRef.current;

    // Define the callback function
    const handleTelegramAuth = (user: TelegramUser) => {
      onAuth(user);
    };

    // Assign the callback to window
    window.TelegramLoginWidget = {
      dataOnauth: handleTelegramAuth
    };

    script.setAttribute('data-onauth', 'TelegramLoginWidget.dataOnauth(user)');
    
    // Add the script to the container
    if (currentContainer) {
      currentContainer.appendChild(script);
    }

    // Cleanup function
    return () => {
      if (currentContainer && script.parentNode === currentContainer) {
        currentContainer.removeChild(script);
      }
      // Clean up the global callback
      if (window.TelegramLoginWidget) {
        delete window.TelegramLoginWidget;
      }
    };
  }, [botName, buttonSize, cornerRadius, requestAccess, usePic, lang, widgetVersion, onAuth]);

  return <div id={telegramLoginWidgetId} ref={containerRef} className={className} />;
}

// Add this type declaration for the global window object
declare global {
  interface Window {
    TelegramLoginWidget?: {
      dataOnauth: (user: TelegramUser) => void;
    };
  }
} 