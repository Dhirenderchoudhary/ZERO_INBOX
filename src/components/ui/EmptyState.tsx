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
    <div className="flex h-full flex-col items-center justify-center px-8 py-12 text-center">
      <div className="border-border/70 bg-muted text-muted-foreground mb-4 flex size-12 items-center justify-center rounded-2xl border shadow-sm">
        <Icon size={22} />
      </div>
      <h3 className="text-base font-semibold tracking-tight">{title}</h3>
      <p className="text-muted-foreground mt-1 max-w-sm text-sm leading-6">
        {description}
      </p>
      {action && (
        <Button
          onClick={action.onClick}
          variant="outline"
          className="mt-5 rounded-xl"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
