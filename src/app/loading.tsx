import { Loader2 } from "lucide-react";

export default function GlobalLoading() {
  return (
    <div className="bg-background/50 flex h-full min-h-screen w-full items-center justify-center backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500 shadow-sm">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
        <p className="text-muted-foreground animate-pulse text-sm font-medium">
          Loading platform...
        </p>
      </div>
    </div>
  );
}
