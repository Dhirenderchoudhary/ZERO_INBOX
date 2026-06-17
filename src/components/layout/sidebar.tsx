"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import {
  BarChart3,
  Bot,
  Calendar,
  ChevronLeft,
  Edit3,
  Inbox,
  LifeBuoy,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Github,
  HardDrive,
} from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const createPrimaryNav = (dashboardHref: string) => [
  { label: "Dashboard", href: dashboardHref, icon: BarChart3 },
  { label: "Inbox", href: "/inbox", icon: Inbox },
  { label: "Calendar", href: "/calendar", icon: Calendar },
  { label: "AI Agent", href: "/agent", icon: Bot, badge: "AI" },
  { label: "Drive", href: "/drive", icon: HardDrive },
  { label: "GitHub", href: "/github", icon: Github },
];

const workspaceNav = [
  { label: "Starred", href: "/inbox?f=starred", icon: Star },
  { label: "Sent", href: "/inbox?f=sent", icon: Send },
  { label: "Security", href: "/security", icon: ShieldCheck },
  { label: "Settings", href: "/settings", icon: Settings },
];

const triageNav = [
  { label: "Urgent", href: "/inbox?p=urgent", color: "bg-red-500" },
  { label: "Needs Reply", href: "/inbox?p=needs_reply", color: "bg-blue-500" },
  { label: "FYI", href: "/inbox?p=fyi", color: "bg-violet-500" },
  { label: "Newsletters", href: "/inbox?p=newsletter", color: "bg-slate-500" },
];

export function Sidebar({
  collapsed = false,
  onToggle,
  onNavigate,
  dashboardHref = "/dashboard",
  activePath,
}: {
  user?: any;
  collapsed?: boolean;
  onToggle?: () => void;
  onNavigate?: () => void;
  dashboardHref?: string;
  activePath?: string;
}) {
  const currentPathname = usePathname();
  const searchParams = useSearchParams();
  const pathname = activePath ?? currentPathname;
  const currentSearch = searchParams.toString();
  const primaryNav = createPrimaryNav(dashboardHref);

  return (
    <aside
      className={cn(
        "bg-sidebar text-sidebar-foreground border-sidebar-border flex h-full shrink-0 flex-col border-r transition-[width] duration-300",
        collapsed ? "w-[84px]" : "w-[280px]",
      )}
    >
      <div className="border-sidebar-border flex h-16 items-center gap-3 border-b px-4">
        <Link
          href={dashboardHref}
          className="flex min-w-0 items-center gap-3"
          onClick={onNavigate}
        >
          <div className="bg-sidebar-primary text-sidebar-primary-foreground flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 shadow-sm">
            <Image
              src="/zero-inbox-logo-120.png"
              alt="ZERO INBOX"
              width={36}
              height={36}
              className="object-cover"
              priority
            />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight">
                ZERO_INBOX
              </p>
              <p className="text-muted-foreground truncate text-xs">
                AI workflow command center
              </p>
            </div>
          )}
        </Link>
        {!collapsed && onToggle && (
          <Button
            variant="ghost"
            size="icon-sm"
            className="ml-auto hidden lg:inline-flex"
            onClick={onToggle}
          >
            <ChevronLeft size={15} />
            <span className="sr-only">Collapse sidebar</span>
          </Button>
        )}
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        <Button
          className={cn(
            "w-full justify-start rounded-xl",
            collapsed && "justify-center px-0",
          )}
          onClick={() => window.dispatchEvent(new CustomEvent("compose"))}
        >
          <Edit3 size={16} />
          {!collapsed && <span>Compose</span>}
        </Button>

        <NavSection
          title="Command"
          items={primaryNav}
          pathname={pathname}
          currentSearch={currentSearch}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />

        <NavSection
          title="Workspace"
          items={workspaceNav}
          pathname={pathname}
          currentSearch={currentSearch}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />

        {!collapsed && (
          <div>
            <SectionLabel>Priority triage</SectionLabel>
            <div className="mt-2 space-y-1">
              {triageNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className="group text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors"
                >
                  <span className={cn("size-2 rounded-full", item.color)} />
                  <span className="flex-1">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="border-sidebar-border mt-auto border-t p-3">
        <div
          className={cn(
            "border-sidebar-border bg-sidebar-accent/60 rounded-xl border p-3",
            collapsed && "flex justify-center p-2",
          )}
        >
          {collapsed ? (
            <Sparkles size={16} className="text-muted-foreground" />
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg">
                  <Sparkles size={16} />
                </div>
                <div>
                  <p className="text-sm font-medium">AI automation</p>
                  <p className="text-muted-foreground text-xs">
                    94% confidence
                  </p>
                </div>
              </div>
              <div className="bg-muted h-1.5 rounded-full">
                <div className="bg-primary h-full w-[72%] rounded-full" />
              </div>
            </div>
          )}
        </div>
        {!collapsed && (
          <Button
            variant="ghost"
            className="text-muted-foreground mt-2 w-full justify-start rounded-xl"
            onClick={() => {
              window.location.href = "mailto:support@zeroinbox.local";
            }}
          >
            <LifeBuoy size={16} />
            Help & support
          </Button>
        )}
      </div>
    </aside>
  );
}

function NavSection({
  title,
  items,
  pathname,
  currentSearch,
  collapsed,
  onNavigate,
}: {
  title: string;
  items: Array<{ label: string; href: string; icon: any; badge?: string }>;
  pathname: string;
  currentSearch: string;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <div>
      {!collapsed && <SectionLabel>{title}</SectionLabel>}
      <div className="mt-2 space-y-1">
        {items.map((item) => {
          const url = new URL(item.href, "https://zero-inbox.local");
          const itemPath = url.pathname;
          const itemSearch = url.searchParams.toString();
          const hasSearch = item.href.includes("?");
          const active = hasSearch
            ? pathname === itemPath && currentSearch === itemSearch
            : pathname === itemPath ||
              (itemPath !== "/dashboard" &&
                itemPath !== "/" &&
                pathname.startsWith(itemPath));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group hover:bg-sidebar-accent hover:text-sidebar-accent-foreground relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "text-sidebar-accent-foreground"
                  : "text-muted-foreground",
                collapsed && "justify-center px-0",
              )}
              title={collapsed ? item.label : undefined}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active"
                  className="bg-sidebar-accent absolute inset-0 rounded-xl shadow-sm"
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                />
              )}
              <item.icon className="relative z-10 size-4 shrink-0" />
              {!collapsed && (
                <>
                  <span className="relative z-10 flex-1">{item.label}</span>
                  {item.badge && (
                    <Badge
                      variant={item.badge === "AI" ? "secondary" : "outline"}
                      className="relative z-10 rounded-full"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-muted-foreground px-3 text-xs font-semibold tracking-[0.16em] uppercase">
      {children}
    </p>
  );
}
