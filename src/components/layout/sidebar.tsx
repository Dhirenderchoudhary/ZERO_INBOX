"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Inbox,
  Calendar,
  Bot,
  Star,
  Send,
  Zap,
  ChevronRight,
  Edit3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { KBD } from "@/components/ui/KBD";
import { motion } from "framer-motion";

const NAV_ITEMS = [
  { label: "Inbox", href: "/inbox", icon: Inbox, hint: "G I", badge: null },
  {
    label: "Starred",
    href: "/inbox?f=starred",
    icon: Star,
    hint: "",
    badge: null,
  },
  { label: "Sent", href: "/inbox?f=sent", icon: Send, hint: "", badge: null },
  {
    label: "Calendar",
    href: "/calendar",
    icon: Calendar,
    hint: "G C",
    badge: null,
  },
  { label: "Agent", href: "/agent", icon: Bot, hint: "G A", badge: "AI" },
];

const PRIORITY_FILTERS = [
  { label: "Urgent", href: "/inbox?p=urgent", color: "var(--urgent)" },
  { label: "Needs Reply", href: "/inbox?p=needs_reply", color: "var(--reply)" },
  { label: "FYI", href: "/inbox?p=fyi", color: "var(--fyi)" },
  {
    label: "Newsletters",
    href: "/inbox?p=newsletter",
    color: "var(--newsletter)",
  },
];

interface NavItemProps {
  item: (typeof NAV_ITEMS)[number];
  active: boolean;
}

function NavItem({ item, active }: NavItemProps) {
  return (
    <Link
      href={item.href}
      className={cn(
        "group relative flex items-center gap-2.5 rounded-[8px] px-3 py-2",
        "t-small transition-colors duration-150",
        active ? "font-medium" : "font-normal",
      )}
      style={{
        color: active ? "var(--text-0)" : "var(--text-2)",
        background: "transparent",
      }}
      onMouseEnter={(e) => {
        if (!active)
          (e.currentTarget as HTMLElement).style.color = "var(--text-0)";
      }}
      onMouseLeave={(e) => {
        if (!active)
          (e.currentTarget as HTMLElement).style.color = "var(--text-2)";
      }}
    >
      {/* Active indicator */}
      {active && (
        <motion.div
          layoutId="sidebar-active"
          className="absolute inset-0 rounded-[8px]"
          style={{
            background: "var(--bg-3)",
            border: "1px solid var(--border-2)",
            boxShadow: "var(--shadow-sm)",
          }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        />
      )}

      <item.icon size={14} className="relative z-10 flex-shrink-0" />
      <span className="relative z-10 flex-1">{item.label}</span>

      {/* AI badge */}
      {item.badge && (
        <span
          className="t-label relative z-10 rounded-[4px] px-1.5 py-0.5"
          style={{
            fontSize: "9px",
            background: "var(--accent-subtle)",
            color: "var(--accent-text)",
            border: "1px solid var(--accent-border)",
            boxShadow: "var(--shadow-glow)",
          }}
        >
          {item.badge}
        </span>
      )}

      {/* Keyboard hint */}
      {item.hint && (
        <span
          className="t-mono relative z-10 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
          style={{ color: "var(--text-3)", fontSize: "10px" }}
        >
          {item.hint}
        </span>
      )}
    </Link>
  );
}

export function Sidebar({ user }: { user: any }) {
  const path = usePathname();

  return (
    <aside
      className="relative z-20 flex h-full w-[240px] flex-shrink-0 flex-col"
      style={{
        background: "rgba(12, 12, 15, 0.75)", // var(--bg-1) but translucent
        backdropFilter: "var(--blur-md)",
        WebkitBackdropFilter: "var(--blur-md)",
        borderRight: "1px solid var(--border-0)",
      }}
    >
      {/* Logo */}
      <div
        className="flex h-[60px] flex-shrink-0 items-center gap-3 px-5"
        style={{ borderBottom: "1px solid var(--border-0)" }}
      >
        <div
          className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-[6px]"
          style={{
            background: "var(--accent)",
            boxShadow: "var(--shadow-glow)",
          }}
        >
          <Zap size={14} color="#000" strokeWidth={2.5} />
        </div>
        <span
          className="t-title tracking-tight"
          style={{ color: "var(--text-0)" }}
        >
          ZERO_INBOX
        </span>
      </div>

      {/* Compose */}
      <div className="px-3 pt-5 pb-2">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("compose"))}
          className="t-small group relative flex w-full items-center justify-between overflow-hidden rounded-[8px] px-3 py-2.5 font-semibold transition-all duration-150 active:scale-[0.98]"
          style={{
            background: "var(--bg-2)",
            color: "var(--text-0)",
            border: "1px solid var(--border-2)",
            boxShadow: "var(--shadow-sm)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--accent-border)";
            e.currentTarget.style.boxShadow = "var(--shadow-glow)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border-2)";
            e.currentTarget.style.boxShadow = "var(--shadow-sm)";
          }}
        >
          <div className="flex items-center gap-2">
            <Edit3
              size={14}
              style={{ color: "var(--accent)" }}
              className="transition-transform duration-200 group-hover:scale-110"
            />
            <span>Compose</span>
          </div>
          <KBD>C</KBD>
        </button>
      </div>

      {/* Nav */}
      <nav className="mt-2 flex flex-col gap-1 px-3">
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.href}
            item={item}
            active={
              path === item.href.split("?")[0] ||
              path.startsWith(item.href.split("?")[0]!)
            }
          />
        ))}
      </nav>

      {/* Divider */}
      <div className="divider mx-4 my-4" />

      {/* Priority filters */}
      <div className="px-3">
        <p className="t-label mb-2 px-3" style={{ color: "var(--text-3)" }}>
          Priority Triage
        </p>
        <div className="flex flex-col gap-0.5">
          {PRIORITY_FILTERS.map((f) => (
            <Link
              key={f.href}
              href={f.href}
              className="t-small flex items-center gap-3 rounded-[8px] px-3 py-2 transition-all duration-150"
              style={{ color: "var(--text-2)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--text-0)";
                e.currentTarget.style.background = "var(--bg-3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--text-2)";
                e.currentTarget.style.background = "transparent";
              }}
            >
              <span
                className="h-2 w-2 flex-shrink-0 rounded-full"
                style={{
                  background: f.color,
                  boxShadow: `0 0 8px ${f.color}40`,
                }}
              />
              {f.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom */}
      <div
        className="mt-auto flex flex-col gap-2 p-4"
        style={{ borderTop: "1px solid var(--border-0)" }}
      >
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("cmd-k"))}
          className="t-small group flex w-full items-center justify-between rounded-[8px] px-3 py-2.5 transition-all duration-150"
          style={{
            background: "var(--bg-2)",
            color: "var(--text-2)",
            border: "1px solid var(--border-1)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = "var(--text-0)";
            (e.currentTarget as HTMLElement).style.borderColor =
              "var(--border-2)";
            (e.currentTarget as HTMLElement).style.boxShadow =
              "var(--shadow-sm)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = "var(--text-2)";
            (e.currentTarget as HTMLElement).style.borderColor =
              "var(--border-1)";
            (e.currentTarget as HTMLElement).style.boxShadow = "none";
          }}
        >
          <span>Command menu</span>
          <KBD>⌘K</KBD>
        </button>

        {user && (
          <div className="mt-2 flex items-center gap-2 px-1">
            {user.image ? (
              <img
                src={user.image}
                alt={user.name}
                className="h-6 w-6 rounded-full"
              />
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold">
                {user.name?.[0]}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-white">
                {user.name}
              </p>
            </div>
            <button
              onClick={async () => {
                const { signOut } = await import("@/lib/auth-client");
                await signOut();
                window.location.href = "/";
              }}
              className="text-xs text-zinc-500 transition-colors hover:text-red-400"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
