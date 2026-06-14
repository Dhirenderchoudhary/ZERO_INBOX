import { cn } from '@/lib/utils';
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />;
}

export function EmailRowSkeleton() {
  return (
    <div className="flex items-start gap-2.5 px-4 py-3 border-b"
         style={{ borderColor: 'var(--border-0)' }}>
      <Skeleton className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" />
      <div className="flex-1 flex flex-col gap-1.5">
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
