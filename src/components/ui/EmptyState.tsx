import { type LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="anim-fade-in flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-xl"
        style={{
          background: "var(--bg-3)",
          border: "1px solid var(--border-1)",
        }}
      >
        <Icon size={18} style={{ color: "var(--text-3)" }} />
      </div>
      <div>
        <p
          className="t-body mb-0.5 font-medium"
          style={{ color: "var(--text-1)" }}
        >
          {title}
        </p>
        <p className="t-small" style={{ color: "var(--text-3)" }}>
          {description}
        </p>
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="t-small mt-1 rounded-lg px-3 py-1.5 font-medium transition-opacity hover:opacity-80"
          style={{
            background: "var(--bg-4)",
            color: "var(--text-1)",
            border: "1px solid var(--border-2)",
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
