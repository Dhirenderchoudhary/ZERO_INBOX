"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-3xl">
        <Card className="border-border/70 rounded-2xl shadow-sm">
          <CardHeader>
            <div className="bg-destructive/10 text-destructive mb-4 flex size-12 items-center justify-center rounded-2xl">
              <AlertTriangle size={24} />
            </div>
            <CardTitle>Dashboard unavailable</CardTitle>
            <CardDescription>
              We couldn’t load the command brief right now. Try again, or return
              after the underlying data source recovers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-border/70 bg-muted/40 text-muted-foreground rounded-xl border p-4 text-sm">
              <p className="text-foreground font-medium">Error details</p>
              <p className="mt-1 break-words">
                {error.message || "Unknown dashboard error"}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={reset} className="rounded-xl">
                <RotateCcw size={16} /> Try again
              </Button>
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => {
                  window.location.href = "/inbox";
                }}
              >
                Go to inbox
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
