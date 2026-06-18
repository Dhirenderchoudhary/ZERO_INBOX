"use client";

import { useEffect, useState } from "react";
import { X, Command } from "lucide-react";

const shortcuts = [
  { keys: ["⌘", "K"], description: "Global command menu & search" },
  { keys: ["C"], description: "Compose new email" },
  { keys: ["G", "I"], description: "Go to Inbox" },
  { keys: ["G", "C"], description: "Go to Calendar" },
  { keys: ["G", "A"], description: "Go to AI Agent" },
  { keys: ["Esc"], description: "Close modals" },
];

export function ShortcutsModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    window.addEventListener("open-shortcuts", handleOpen);
    window.addEventListener("close-modals", handleClose);

    return () => {
      window.removeEventListener("open-shortcuts", handleOpen);
      window.removeEventListener("close-modals", handleClose);
    };
  }, []);

  if (!open) return null;

  return (
    <div className="bg-background/80 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="border-border bg-card w-full max-w-md overflow-hidden rounded-xl border shadow-2xl">
        <div className="border-border flex items-center justify-between border-b px-5 py-4">
          <div className="flex items-center gap-2">
            <Command size={16} className="text-muted-foreground" />
            <h3 className="text-foreground font-semibold">
              Keyboard Shortcuts
            </h3>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-2 p-5">
          {shortcuts.map((shortcut, idx) => (
            <div
              key={idx}
              className="hover:bg-muted/50 flex items-center justify-between rounded-lg px-2 py-2"
            >
              <span className="text-muted-foreground text-sm">
                {shortcut.description}
              </span>
              <div className="flex items-center gap-1">
                {shortcut.keys.map((k, i) => (
                  <kbd
                    key={i}
                    className="bg-muted text-muted-foreground rounded border px-2 py-1 font-mono text-[11px] font-semibold"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
