"use client";
import { useEffect, useState, useCallback } from "react";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Mail,
  Calendar,
  Bot,
  Plus,
  Cpu,
  RefreshCw,
  Inbox,
  Star,
  ArrowRight,
  Hash,
  Search,
} from "lucide-react";

const COMMANDS = [
  {
    group: "Actions",
    items: [
      { icon: Mail, label: "Compose new email", hint: "C", event: "compose" },
      { icon: Plus, label: "New calendar event", hint: "", event: "new-event" },
      { icon: Cpu, label: "AI Triage inbox", hint: "", event: "triage" },
      { icon: RefreshCw, label: "Refresh inbox", hint: "", event: "refresh" },
    ],
  },
  {
    group: "Navigate",
    items: [
      { icon: Inbox, label: "Go to Inbox", hint: "G I", route: "/inbox" },
      {
        icon: Star,
        label: "Go to Starred",
        hint: "",
        route: "/inbox?f=starred",
      },
      {
        icon: Calendar,
        label: "Go to Calendar",
        hint: "G C",
        route: "/calendar",
      },
      { icon: Bot, label: "Go to Agent", hint: "G A", route: "/agent" },
    ],
  },
  {
    group: "Filter",
    items: [
      { icon: Hash, label: "Show Urgent", hint: "", route: "/inbox?p=urgent" },
      {
        icon: Hash,
        label: "Show Needs Reply",
        hint: "",
        route: "/inbox?p=needs_reply",
      },
      { icon: Hash, label: "Show FYI", hint: "", route: "/inbox?p=fyi" },
    ],
  },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();

  useEffect(() => {
    const onToggle = () => setOpen((o) => !o);
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("cmd-k", onToggle);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("cmd-k", onToggle);
    };
  }, []);

  const run = useCallback(
    (item: { route?: string; event?: string }) => {
      setOpen(false);
      setSearch("");
      setTimeout(() => {
        if (item.route) router.push(item.route);
        else if (item.event) window.dispatchEvent(new CustomEvent(item.event));
      }, 80);
    },
    [router],
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="bg-background/60 fixed inset-0 z-50 flex items-start justify-center pt-[15vh] backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          onClick={() => setOpen(false)}
        >
          <motion.div
            className="bg-card border-border/80 w-full max-w-[520px] overflow-hidden rounded-2xl border shadow-2xl"
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.15, ease: [0.32, 0.72, 0, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <Command shouldFilter loop className="w-full bg-transparent">
              {/* Search input */}
              <div className="border-border/50 flex items-center gap-3 border-b px-4 py-3">
                <Search size={18} className="text-muted-foreground shrink-0" />
                <Command.Input
                  autoFocus
                  placeholder="Search commands, actions, workflows..."
                  value={search}
                  onValueChange={setSearch}
                  className="text-foreground placeholder:text-muted-foreground/70 flex-1 bg-transparent text-[15px] outline-none"
                />
                <kbd className="border-border bg-muted/50 text-muted-foreground hidden rounded border px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-wider uppercase sm:inline-flex">
                  Esc
                </kbd>
              </div>

              {/* Results */}
              <Command.List className="custom-scrollbar max-h-[320px] overflow-y-auto px-2 py-2">
                <Command.Empty className="text-muted-foreground py-10 text-center text-sm font-medium">
                  No results for &ldquo;{search}&rdquo;
                </Command.Empty>

                {COMMANDS.map((group) => (
                  <Command.Group
                    key={group.group}
                    heading={group.group}
                    className="text-muted-foreground mt-2 px-2 py-1.5 text-xs font-semibold tracking-wider uppercase first:mt-0"
                  >
                    {group.items.map((item) => (
                      <Command.Item
                        key={item.label}
                        value={item.label}
                        onSelect={() => run(item)}
                        className="group aria-selected:bg-primary/10 aria-selected:text-primary data-[selected]:bg-primary/10 data-[selected]:text-primary flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-colors"
                      >
                        <div className="bg-muted/50 text-muted-foreground group-aria-selected:bg-primary/20 group-aria-selected:text-primary flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors">
                          <item.icon size={14} />
                        </div>
                        <span className="text-foreground group-aria-selected:text-primary flex-1 text-sm font-medium transition-colors">
                          {item.label}
                        </span>
                        <div className="flex items-center gap-2">
                          {item.hint && (
                            <span className="border-border bg-background text-muted-foreground rounded border px-1.5 py-0.5 font-mono text-[10px] font-medium">
                              {item.hint}
                            </span>
                          )}
                          <ArrowRight
                            size={14}
                            className="text-primary -translate-x-2 opacity-0 transition-all group-aria-selected:translate-x-0 group-aria-selected:opacity-100"
                          />
                        </div>
                      </Command.Item>
                    ))}
                  </Command.Group>
                ))}
              </Command.List>

              {/* Footer */}
              <div className="border-border/50 bg-muted/20 flex items-center gap-4 border-t px-4 py-3">
                {[
                  { keys: ["↑", "↓"], label: "Navigate" },
                  { keys: ["↵"], label: "Select" },
                  { keys: ["Esc"], label: "Close" },
                ].map(({ keys, label }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    {keys.map((k) => (
                      <kbd
                        key={k}
                        className="border-border/60 bg-background/50 text-muted-foreground rounded border px-1.5 py-0.5 font-mono text-[10px] font-medium"
                      >
                        {k}
                      </kbd>
                    ))}
                    <span className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </Command>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
