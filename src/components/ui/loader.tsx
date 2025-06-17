import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoaderProps {
  variant?: "default" | "page" | "card" | "button";
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

export function Loader({
  variant = "default",
  size = "md",
  text,
  className,
}: LoaderProps) {
  // Set size values
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  // Variant-specific containers
  if (variant === "page") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] w-full">
        <Loader2
          className={cn(
            "animate-spin text-primary",
            sizeClasses[size],
            className
          )}
        />
        {text && (
          <p className="mt-4 text-sm text-muted-foreground">{text}</p>
        )}
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 border border-border/40 rounded-lg bg-card/20">
        <Loader2
          className={cn(
            "animate-spin text-primary",
            sizeClasses[size],
            className
          )}
        />
        {text && (
          <p className="mt-2 text-sm text-muted-foreground">{text}</p>
        )}
      </div>
    );
  }

  if (variant === "button") {
    return (
      <Loader2
        className={cn(
          "animate-spin",
          sizeClasses.sm, // Always small for buttons
          className
        )}
      />
    );
  }

  // Default variant
  return (
    <div className="flex items-center gap-2">
      <Loader2
        className={cn(
          "animate-spin text-primary",
          sizeClasses[size],
          className
        )}
      />
      {text && <span className="text-muted-foreground">{text}</span>}
    </div>
  );
} 