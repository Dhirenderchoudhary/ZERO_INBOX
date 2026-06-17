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
        <div className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[15vh] sm:pt-[20vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-background/40 fixed inset-0 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="border-border/60 bg-card/90 relative w-full max-w-lg overflow-hidden rounded-2xl border shadow-[0_20px_60px_rgba(0,0,0,0.15)] backdrop-blur-xl sm:w-[500px]"
          >
            <Command
              className="w-full flex-col overflow-hidden outline-none"
              shouldFilter={true}
            >
              <div className="border-border/50 flex items-center border-b px-4">
                <Search className="text-muted-foreground mr-3 h-5 w-5 shrink-0" />
                <Command.Input
                  autoFocus
                  placeholder="What do you need?"
                  value={search}
                  onValueChange={setSearch}
                  className="placeholder:text-muted-foreground/60 flex h-14 w-full bg-transparent py-3 text-[15px] font-medium outline-none"
                />
                <div className="text-muted-foreground/50 hidden text-[10px] font-bold tracking-wider sm:block">
                  ESC
                </div>
              </div>
              <Command.List className="max-h-[340px] overflow-x-hidden overflow-y-auto p-2">
                <Command.Empty className="text-muted-foreground py-8 text-center text-sm">
                  No results found.
                </Command.Empty>
                {COMMANDS.map((group) => (
                  <Command.Group
                    key={group.group}
                    heading={group.group}
                    className="[&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:tracking-wider"
                  >
                    {group.items.map((item) => (
                      <Command.Item
                        key={item.label}
                        onSelect={() => run(item)}
                        className="aria-selected:bg-primary/10 aria-selected:text-primary data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary text-foreground hover:bg-muted flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors outline-none"
                      >
                        <div className="bg-foreground/5 text-foreground/70 aria-selected:bg-primary/20 aria-selected:text-primary data-[selected=true]:bg-primary/20 data-[selected=true]:text-primary flex size-6 items-center justify-center rounded-md transition-colors">
                          <item.icon className="h-3.5 w-3.5" />
                        </div>
                        <span className="flex-1">{item.label}</span>
                        {item.hint && (
                          <div className="flex items-center gap-1 opacity-60">
                            {item.hint.split(" ").map((k) => (
                              <kbd
                                key={k}
                                className="bg-background border-border/60 text-muted-foreground rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wider"
                              >
                                {k}
                              </kbd>
                            ))}
                          </div>
                        )}
                      </Command.Item>
                    ))}
                  </Command.Group>
                ))}
              </Command.List>
            </Command>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
