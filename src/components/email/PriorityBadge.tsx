import { cn } from "@/lib/utils";

const BADGE_CONFIG = {
  urgent: {
    label: "Urgent",
    className: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    dot: true,
  },
  needs_reply: {
    label: "Reply",
    className: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    dot: false,
  },
  fyi: {
    label: "FYI",
    className: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
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
