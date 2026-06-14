import { InboxIntelligenceSkeleton } from "@/components/dashboard/inbox-intelligence";
import { KpiCardSkeleton } from "@/components/dashboard/kpi-card";
import { RecentActionsSkeleton } from "@/components/dashboard/recent-actions";
import { Skeleton } from "@/components/ui/Skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="border-border/70 bg-card overflow-hidden rounded-2xl border shadow-sm">
          <div className="relative p-6 sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl space-y-4">
                <Skeleton className="h-6 w-40 rounded-full" />
                <Skeleton className="h-10 w-full max-w-2xl" />
                <Skeleton className="h-5 w-full max-w-3xl" />
              </div>
              <div className="flex flex-wrap gap-3">
                <Skeleton className="h-10 w-36 rounded-xl" />
                <Skeleton className="h-10 w-32 rounded-xl" />
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <KpiCardSkeleton key={index} />
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <InboxIntelligenceSkeleton />
          <RecentActionsSkeleton />
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="bg-card/80 rounded-2xl">
              <CardHeader>
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-56" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </div>
  );
}
