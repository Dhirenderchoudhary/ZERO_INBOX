import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} />;
}

export function EmailRowSkeleton() {
  return (
    <div className="border-border/60 bg-card/60 mx-3 my-2 rounded-xl border p-4">
      <div className="flex items-start gap-3">
        <Skeleton className="size-9 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex justify-between gap-4">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-12" />
          </div>
          <Skeleton className="h-3 w-44" />
          <Skeleton className="h-3 w-full" />
        </div>
      </div>
    </div>
  );
}
