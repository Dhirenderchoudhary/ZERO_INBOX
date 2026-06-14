import { type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/Skeleton";

export function KpiCard({
  label,
  value,
  trend,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  trend: string;
  icon: LucideIcon;
  tone: string;
}) {
  return (
    <Card className="group bg-card/80 hover:border-border hover:shadow-primary/5 overflow-hidden rounded-2xl shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl">
      <CardContent className="p-5">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="border-border/70 bg-muted/70 flex size-10 items-center justify-center rounded-xl border">
            <Icon className={tone} size={19} />
          </div>
          <Badge
            variant="outline"
            className="bg-background/60 rounded-full text-xs"
          >
            {trend}
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm">{label}</p>
        <p className="mt-1 text-3xl font-bold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}

export function KpiCardSkeleton() {
  return (
    <Card className="bg-card/80 rounded-2xl">
      <CardContent className="p-5">
        <div className="mb-5 flex items-center justify-between">
          <Skeleton className="size-10 rounded-xl" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-3 h-8 w-14" />
      </CardContent>
    </Card>
  );
}
