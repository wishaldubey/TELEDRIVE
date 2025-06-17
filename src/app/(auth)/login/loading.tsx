import { Loader } from "@/components/ui/loader";

export default function LoginLoading() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md px-4">
        <div className="flex flex-col items-center gap-6">
          {/* Logo skeleton */}
          <div className="animate-pulse bg-card h-16 w-16 rounded-full" />
          
          {/* Title skeleton */}
          <div className="animate-pulse bg-card h-8 w-48 rounded mb-2" />
          
          {/* Text skeleton */}
          <div className="space-y-2">
            <div className="animate-pulse bg-card h-4 w-64 rounded" />
            <div className="animate-pulse bg-card h-4 w-56 rounded" />
          </div>
          
          {/* Login box skeleton */}
          <div className="w-full border rounded-xl border-border/40 p-6 mt-4 bg-card/20 space-y-4">
            <div className="animate-pulse bg-card h-6 w-32 rounded" />
            <div className="animate-pulse bg-card h-10 w-full rounded mt-2" />
            <div className="animate-pulse bg-card h-10 w-full rounded mt-2" />
            <div className="animate-pulse bg-card h-12 w-full rounded mt-4" />
          </div>
          
          <div className="flex justify-center mt-4">
            <Loader size="md" text="Loading..." />
          </div>
        </div>
      </div>
    </div>
  );
} 