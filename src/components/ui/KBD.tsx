import { cn } from "@/lib/utils";

export function KBD({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <kbd
      className={cn(
        "bg-muted border-border text-muted-foreground inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[10px] shadow-[0_1px_0_var(--color-border)]",
        className,
      )}
    >
      {children}
    </kbd>
  );
}
