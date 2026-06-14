"use client";
import { Clock } from "lucide-react";

interface SnoozeMenuProps {
  onSnooze: (until: string) => void;
  onClose: () => void;
}

export function SnoozeMenu({ onSnooze, onClose }: SnoozeMenuProps) {
  const options = [
    {
      label: "Later Today",
      get time() {
        const d = new Date();
        d.setHours(d.getHours() + 3);
        return d.toISOString();
      },
    },
    {
      label: "Tomorrow Morning",
      get time() {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        d.setHours(8, 0, 0, 0);
        return d.toISOString();
      },
    },
    {
      label: "This Weekend",
      get time() {
        const d = new Date();
        d.setDate(d.getDate() + (6 - d.getDay()));
        d.setHours(8, 0, 0, 0);
        return d.toISOString();
      },
    },
    {
      label: "Next Week",
      get time() {
        const d = new Date();
        d.setDate(d.getDate() + (8 - d.getDay()));
        d.setHours(8, 0, 0, 0);
        return d.toISOString();
      },
    },
  ];

  return (
    <div className="border-border bg-popover absolute top-10 right-0 z-50 w-48 overflow-hidden rounded-md border shadow-md">
      <div className="border-border text-muted-foreground border-b px-3 py-2 text-[11px] font-medium">
        Snooze until...
      </div>
      <div className="py-1">
        {options.map((opt) => (
          <button
            key={opt.label}
            onClick={() => {
              onSnooze(opt.time);
              onClose();
            }}
            className="hover:bg-muted text-foreground flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors"
          >
            <Clock size={12} className="text-muted-foreground" />
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
