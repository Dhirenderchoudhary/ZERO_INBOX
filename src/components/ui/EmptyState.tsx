import { type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <div className="bg-card/20 relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-2xl px-8 py-12 text-center backdrop-blur-sm">
      <div className="from-primary/5 pointer-events-none absolute inset-0 bg-gradient-to-b to-transparent" />
      <div className="relative z-10 flex flex-col items-center">
        <div className="bg-primary/10 text-primary border-primary/20 mb-5 flex size-14 items-center justify-center rounded-2xl border shadow-[0_0_15px_rgba(var(--primary),0.2)]">
          <Icon size={24} className="opacity-90" />
        </div>
        <h3 className="text-foreground text-lg font-bold tracking-tight">
          {title}
        </h3>
        <p className="text-muted-foreground mt-2 max-w-[280px] text-sm leading-6">
          {description}
        </p>
        {action && (
          <Button
            onClick={action.onClick}
            className="bg-primary text-primary-foreground hover:bg-primary/90 mt-6 rounded-xl shadow-md"
          >
            {action.label}
          </Button>
        )}
      </div>
    </div>
  );
}
