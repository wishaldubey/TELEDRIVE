'use client';

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mx-auto flex max-w-[500px] flex-col items-center justify-center text-center">
        <div className="mb-4 h-14 w-14 rounded-full border border-border/40 bg-card/20 flex items-center justify-center text-primary">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="h-7 w-7"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        
        <h1 className="mb-2 text-2xl font-bold">Something went wrong!</h1>
        
        <p className="mb-8 text-muted-foreground">
          We apologize for the inconvenience. An unexpected error has occurred.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={reset} className="bg-primary hover:bg-primary/90">
            Try again
          </Button>
          <Link href="/">
            <Button variant="outline">Go to Home</Button>
          </Link>
        </div>
        
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 border border-border/40 bg-card/20 rounded-md text-left w-full overflow-auto">
            <p className="font-mono text-xs text-red-400">{error.message}</p>
            {error.stack && (
              <pre className="mt-2 max-h-[200px] overflow-auto font-mono text-xs text-muted-foreground">
                {error.stack}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 