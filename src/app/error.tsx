"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In production, this error would be sent to Sentry or Vercel Analytics
    console.error("Global Error Boundary caught:", error);
  }, [error]);

  return (
    <div className="bg-background flex h-screen w-full flex-col items-center justify-center p-6 text-center">
      <div className="border-border/50 bg-card flex max-w-md flex-col items-center space-y-6 rounded-2xl border p-8 shadow-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-500">
          <AlertCircle size={32} />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">
            Something went wrong
          </h1>
          <p className="text-muted-foreground text-sm">
            A critical error occurred in the application. Our systems have
            logged this issue for engineering.
          </p>
        </div>

        {process.env.NODE_ENV === "development" && (
          <div className="bg-muted text-muted-foreground max-h-32 w-full overflow-auto rounded-md p-4 text-left font-mono text-xs">
            {error.message}
          </div>
        )}

        <div className="flex w-full flex-col gap-3 sm:flex-row">
          <Button onClick={() => reset()} className="w-full gap-2">
            <RefreshCw size={16} />
            Try again
          </Button>
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/dashboard")}
            className="w-full"
          >
            Go Home
          </Button>
        </div>
      </div>
    </div>
  );
}
