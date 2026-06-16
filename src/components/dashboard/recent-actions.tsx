import { CheckCircle2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/Skeleton";

import { formatDistanceToNow } from "date-fns";

export function RecentActions({
  data,
}: {
  data?: { id: number; content: string; createdAt: Date | null }[];
}) {
  const actions =
    data && data.length > 0
      ? data
      : [{ id: 1, content: "No recent AI actions", createdAt: new Date() }];

  return (
    <Card className="bg-card/80 rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Recent actions</CardTitle>
        <CardDescription>Transparent automation trail</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action) => (
          <div
            key={action.id}
            className="border-border/60 bg-background/55 hover:bg-muted/40 flex gap-3 rounded-2xl border p-3 transition-colors"
          >
            <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 size={15} />
            </div>
            <div className="min-w-0">
              <p className="line-clamp-2 text-sm leading-5 font-medium">
                {action.content}
              </p>
              <p className="text-muted-foreground mt-0.5 text-xs">
                {action.createdAt
                  ? formatDistanceToNow(action.createdAt, { addSuffix: true })
                  : "Just now"}{" "}
                · reversible
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function RecentActionsSkeleton() {
  return (
    <Card className="bg-card/80 rounded-2xl">
      <CardHeader>
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-4 w-52" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="border-border/60 bg-background/55 flex gap-3 rounded-2xl border p-3"
          >
            <Skeleton className="size-7 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
