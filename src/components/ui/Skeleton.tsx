import { cn } from "@/lib/utils";
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} />;
}

export function EmailRowSkeleton() {
  return (
    <div
      className="flex items-start gap-2.5 border-b px-4 py-3"
      style={{ borderColor: "var(--border-0)" }}
    >
      <Skeleton className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full" />
      <div className="flex flex-1 flex-col gap-1.5">
        <div className="flex justify-between">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-12" />
        </div>
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-2.5 w-52" />
      </div>
    </div>
  );
}
