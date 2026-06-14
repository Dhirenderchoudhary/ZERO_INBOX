import { cn } from "@/lib/utils";

const BADGE_CONFIG = {
  urgent: {
    label: "Urgent",
    color: "var(--urgent)",
    bg: "var(--urgent-bg)",
    border: "var(--urgent-border)",
    dot: true,
  },
  needs_reply: {
    label: "Reply",
    color: "var(--reply)",
    bg: "var(--reply-bg)",
    border: "var(--reply-border)",
    dot: false,
  },
  fyi: {
    label: "FYI",
    color: "var(--fyi)",
    bg: "var(--fyi-bg)",
    border: "var(--fyi-border)",
    dot: false,
  },
  newsletter: {
    label: "List",
    color: "var(--newsletter)",
    bg: "var(--newsletter-bg)",
    border: "var(--newsletter-border)",
    dot: false,
  },
} as const;

export function PriorityBadge({ priority }: { priority: string }) {
  const cfg = BADGE_CONFIG[priority as keyof typeof BADGE_CONFIG];
  if (!cfg) return null;

  return (
    <span
      className="badge"
      style={{
        color: cfg.color,
        background: cfg.bg,
        borderColor: cfg.border,
      }}
    >
      {cfg.dot && (
        <span
          className="h-[5px] w-[5px] flex-shrink-0 rounded-full"
          style={{
            background: cfg.color,
            animation: "pulse-dot 2s ease-in-out infinite",
          }}
        />
      )}
      {cfg.label}
    </span>
  );
}
