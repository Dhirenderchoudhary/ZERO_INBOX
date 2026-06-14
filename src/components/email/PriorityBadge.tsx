import { cn } from "@/lib/utils";

const BADGE_CONFIG = {
  urgent: {
    label: "Urgent",
    className: "text-destructive bg-destructive/10 border-destructive/20",
    dot: true,
  },
  needs_reply: {
    label: "Reply",
    className: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    dot: false,
  },
  fyi: {
    label: "FYI",
    className: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    dot: false,
  },
  newsletter: {
    label: "List",
    className: "text-muted-foreground bg-muted border-border",
    dot: false,
  },
} as const;

export function PriorityBadge({ priority }: { priority: string }) {
  const cfg = BADGE_CONFIG[priority as keyof typeof BADGE_CONFIG];
  if (!cfg) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[4px] border px-1.5 py-0.5 text-[10px] font-semibold tracking-wide whitespace-nowrap uppercase",
        cfg.className,
      )}
    >
      {cfg.dot && (
        <span className="h-1.5 w-1.5 flex-shrink-0 animate-pulse rounded-full bg-current" />
      )}
      {cfg.label}
    </span>
  );
}
