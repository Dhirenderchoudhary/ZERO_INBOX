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
          className="fixed inset-0 z-50 flex items-start justify-center"
          style={{ paddingTop: "18vh", background: "var(--bg-overlay)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          onClick={() => setOpen(false)}
        >
          <motion.div
            className="w-full max-w-[520px] overflow-hidden rounded-[14px]"
            style={{
              background: "var(--bg-modal)",
              border: "1px solid var(--border-2)",
              boxShadow:
                "0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04) inset",
            }}
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.15, ease: [0.32, 0.72, 0, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <Command shouldFilter loop>
              {/* Search input */}
              <div
                className="flex items-center gap-3 px-4 py-3.5"
                style={{ borderBottom: "1px solid var(--border-1)" }}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M6.5 1a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11zm4.776 5.5a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0zM14.354 13.646l-3-3a.5.5 0 0 0-.708.708l3 3a.5.5 0 0 0 .708-.708z"
                    fill="var(--text-2)"
                  />
                </svg>
                <Command.Input
                  autoFocus
                  placeholder="Search commands..."
                  value={search}
                  onValueChange={setSearch}
                  className="flex-1 bg-transparent outline-none"
                  style={{
                    color: "var(--text-0)",
                    fontSize: "14px",
                    fontFamily: "var(--font-sans)",
                    caretColor: "var(--accent)",
                  }}
                />
                <kbd
                  className="t-mono rounded px-1.5 py-0.5 text-[10px]"
                  style={{
                    background: "var(--bg-4)",
                    color: "var(--text-3)",
                    border: "1px solid var(--border-2)",
                  }}
                >
                  Esc
                </kbd>
              </div>

              {/* Results */}
              <Command.List
                className="overflow-y-auto py-2"
                style={{ maxHeight: "320px" }}
              >
                <Command.Empty
                  className="t-small py-10 text-center"
                  style={{ color: "var(--text-3)" }}
                >
                  No results for &ldquo;{search}&rdquo;
                </Command.Empty>

                {COMMANDS.map((group) => (
                  <Command.Group
                    key={group.group}
                    heading={group.group}
                    className="px-2"
                  >
                    {group.items.map((item) => (
                      <Command.Item
                        key={item.label}
                        value={item.label}
                        onSelect={() => run(item)}
                        className="flex cursor-pointer items-center gap-3 rounded-[7px] px-3 py-2"
                      >
                        <div
                          className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-[5px]"
                          style={{ background: "var(--bg-4)" }}
                        >
                          <item.icon
                            size={12}
                            style={{ color: "var(--text-2)" }}
                          />
                        </div>
                        <span className="t-body flex-1">{item.label}</span>
                        <div className="flex items-center gap-1.5">
                          {item.hint && (
                            <span
                              className="t-mono rounded px-1.5 py-0.5 text-[10px]"
                              style={{
                                background: "var(--bg-4)",
                                color: "var(--text-3)",
                                border: "1px solid var(--border-1)",
                              }}
                            >
                              {item.hint}
                            </span>
                          )}
                          <ArrowRight
                            size={12}
                            style={{ color: "var(--text-3)" }}
                            className="opacity-0 group-data-[selected]:opacity-100"
                          />
                        </div>
                      </Command.Item>
                    ))}
                  </Command.Group>
                ))}
              </Command.List>

              {/* Footer */}
              <div
                className="flex items-center gap-4 px-4 py-2.5"
                style={{ borderTop: "1px solid var(--border-0)" }}
              >
                {[
                  { keys: ["↑", "↓"], label: "navigate" },
                  { keys: ["↵"], label: "select" },
                  { keys: ["Esc"], label: "close" },
                ].map(({ keys, label }) => (
                  <div key={label} className="flex items-center gap-1">
                    {keys.map((k) => (
                      <kbd
                        key={k}
                        className="t-mono rounded px-1.5 py-px text-[10px]"
                        style={{
                          background: "var(--bg-4)",
                          color: "var(--text-3)",
                          border: "1px solid var(--border-2)",
                        }}
                      >
                        {k}
                      </kbd>
                    ))}
                    <span
                      className="t-micro"
                      style={{ color: "var(--text-3)" }}
                    >
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
