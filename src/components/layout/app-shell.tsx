"use client";

import { useMemo, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Bell,
  ChevronRight,
  Menu,
  PanelLeftOpen,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Sidebar } from "./sidebar";
import { CommandPalette } from "./command-palette";
import { ShortcutsModal } from "./shortcuts-modal";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useKeyboard } from "@/hooks/useKeyboard";
import { GlobalCompose } from "@/components/email/GlobalCompose";
import { CreateEventModal } from "@/components/calendar/create-event-modal";
import { FloatingChat } from "@/components/agent/floating-chat";
import { cn } from "@/lib/utils";

const pageCopy: Record<string, { title: string; eyebrow: string }> = {
  dashboard: { title: "Dashboard", eyebrow: "Executive workspace" },
  inbox: { title: "Inbox", eyebrow: "AI-prioritized communication" },
  calendar: { title: "Calendar", eyebrow: "Scheduling command center" },
  agent: { title: "AI Agent", eyebrow: "Natural-language operations" },
};

export function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: any;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  useKeyboard();

  useEffect(() => {
    const handleNewEvent = () => setShowEventModal(true);
    window.addEventListener("new-event", handleNewEvent);

    const savedState = localStorage.getItem("sidebar-collapsed");
    if (savedState !== null) {
      setCollapsed(savedState === "true");
    }

    return () => window.removeEventListener("new-event", handleNewEvent);
  }, []);

  const handleToggleSidebar = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar-collapsed", String(next));
      return next;
    });
  };

  const page = useMemo(() => {
    const key = pathname.split("/").find(Boolean) || "dashboard";
    return pageCopy[key] ?? { title: "Workspace", eyebrow: "ZERO INBOX" };
  }, [pathname]);

  return (
    <div className="app-surface bg-bg-app text-foreground flex h-screen overflow-hidden">
      <div className="hidden shrink-0 lg:block">
        <Sidebar
          collapsed={collapsed}
          onToggle={handleToggleSidebar}
          user={user}
        />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close navigation"
            className="bg-background/70 absolute inset-0 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <motion.div
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative h-full w-[300px] shadow-2xl"
          >
            <Sidebar user={user} onNavigate={() => setMobileOpen(false)} />
          </motion.div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="bg-bg-surface border-border-subtle z-30 flex h-16 shrink-0 items-center gap-3 border-b px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={18} />
            <span className="sr-only">Open navigation</span>
          </Button>

          <div className="min-w-0 flex-1">
            <div className="text-muted-foreground flex items-center gap-1 text-xs">
              <span>Workspace</span>
              <ChevronRight size={13} />
              <span className="truncate">{page.eyebrow}</span>
            </div>
            <h1 className="truncate text-base font-semibold tracking-tight">
              {page.title}
            </h1>
          </div>

          <button
            onClick={() => window.dispatchEvent(new CustomEvent("cmd-k"))}
            className="group border-border/50 bg-background/40 hover:bg-background/80 text-muted-foreground hover:text-foreground hover:border-primary/30 hover:ring-primary/20 hidden h-9 w-full max-w-[280px] items-center gap-2 rounded-full border px-3 text-sm shadow-sm backdrop-blur-md transition-all hover:ring-2 md:flex"
          >
            <Search
              size={14}
              className="opacity-70 transition-opacity group-hover:opacity-100"
            />
            <span className="flex-1 text-left font-medium">
              Search everything...
            </span>
            <kbd className="bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary group-hover:border-primary/20 rounded-md border border-b-2 px-1.5 py-0.5 font-mono text-[10px] font-semibold transition-colors">
              ⌘K
            </kbd>
          </button>

          <Badge
            variant="outline"
            className="hidden rounded-full border-emerald-500/30 bg-emerald-500/10 text-emerald-600 sm:inline-flex dark:text-emerald-300"
          >
            <ShieldCheck size={12} /> Secure
          </Badge>
          <ThemeToggle />

          <Link
            href="/settings"
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "text-muted-foreground hover:text-foreground hidden sm:inline-flex",
            )}
          >
            <Settings size={17} />
            <span className="sr-only">Settings</span>
          </Link>
          <UserMenu user={user} />
        </header>

        <motion.main
          className="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.16 }}
        >
          {children}
        </motion.main>
      </div>

      <CommandPalette />
      <ShortcutsModal />
      <GlobalCompose />
      {showEventModal && (
        <CreateEventModal onClose={() => setShowEventModal(false)} />
      )}
      <FloatingChat />
      <ToastProvider />
    </div>
  );
}

function UserMenu({ user }: { user: any }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="border-border/70 bg-background/70 hover:bg-muted/50 flex cursor-pointer items-center gap-2 rounded-full border py-1 pr-3 pl-1 shadow-sm transition-colors outline-none">
        <Avatar size="sm">
          {user?.image && (
            <AvatarImage src={user.image} alt={user.name ?? "User"} />
          )}
          <AvatarFallback>{user?.name?.[0] ?? "U"}</AvatarFallback>
        </Avatar>
        <div className="hidden min-w-0 sm:block">
          <p className="max-w-28 truncate text-xs font-medium">
            {user?.name ?? "User"}
          </p>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-xl">
        <div className="px-2 py-1.5 text-sm font-medium">
          {user?.name ?? "Account"}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Link href="/settings" className="w-full cursor-pointer">
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Link href="/security" className="w-full cursor-pointer">
            Security
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
          onClick={async () => {
            const { signOut } = await import("@/lib/auth-client");
            await signOut();
            window.location.href = "/";
          }}
        >
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
