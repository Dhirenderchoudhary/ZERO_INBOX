import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/Skeleton";

const rows = [
  { label: "Urgent", value: 18, color: "bg-red-500" },
  { label: "Needs reply", value: 32, color: "bg-blue-500" },
  { label: "FYI", value: 24, color: "bg-violet-500" },
  { label: "Archived noise", value: 76, color: "bg-slate-500" },
];

export function InboxIntelligence() {
  return (
    <Card className="bg-card/80 rounded-2xl shadow-sm">
      <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="text-xl font-semibold">
            Inbox intelligence
          </CardTitle>
          <CardDescription>
            Volume, priority mix, and automation impact
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="bg-background/60 rounded-xl"
        >
          View report <ArrowUpRight size={14} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-5">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium">{row.label}</span>
              <span className="text-muted-foreground">{row.value}%</span>
            </div>
            <div className="bg-muted h-2.5 overflow-hidden rounded-full">
              <div
                className={`h-full rounded-full ${row.color} shadow-[0_0_20px_rgba(255,255,255,0.08)]`}
                style={{ width: `${row.value}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function InboxIntelligenceSkeleton() {
  return (
    <Card className="bg-card/80 rounded-2xl">
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-72" />
      </CardHeader>
      <CardContent className="space-y-5">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index}>
            <div className="mb-2 flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-10" />
            </div>
            <Skeleton className="h-2.5 w-full rounded-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
