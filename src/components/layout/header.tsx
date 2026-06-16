"use client";

import Link from "next/link";
import { toast } from "sonner";
import {
  Bell,
  ChevronRight,
  Menu,
  Search,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function DashboardHeader({ onMenuClick }: { onMenuClick?: () => void }) {
  return (
    <header className="border-border/70 bg-background/80 sticky top-0 z-30 border-b backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
        >
          <Menu size={18} />
          <span className="sr-only">Open navigation</span>
        </Button>

        <div className="min-w-0 shrink-0">
          <div className="text-muted-foreground flex items-center gap-1 text-xs">
            <span>Workspace</span>
            <ChevronRight size={13} />
            <span className="truncate">Executive workspace</span>
          </div>
          <h1 className="truncate text-base font-semibold tracking-tight">
            Dashboard
          </h1>
        </div>

        <div className="mx-auto hidden w-full max-w-md md:block">
          <div className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              aria-label="Search"
              placeholder="Search emails, events, actions…"
              className="border-border/70 bg-card/70 h-10 rounded-xl pl-9 shadow-sm"
            />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Badge
            variant="outline"
            className="hidden rounded-full border-emerald-500/30 bg-emerald-500/10 text-emerald-600 sm:inline-flex dark:text-emerald-300"
          >
            <ShieldCheck size={12} /> Secure
          </Badge>
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-xl"
            onClick={() => toast.info("No new notifications")}
          >
            <Bell size={17} />
            <span className="ring-background absolute top-2 right-2 size-2 rounded-full bg-blue-500 ring-2" />
            <span className="sr-only">Notifications</span>
          </Button>
          <Link href="/settings" className="hidden sm:inline-flex">
            <Button variant="ghost" size="icon" className="rounded-xl">
              <Settings size={17} />
              <span className="sr-only">Settings</span>
            </Button>
          </Link>
          <details className="group relative">
            <summary className="border-border/70 bg-card/70 hover:bg-muted focus-visible:ring-ring focus-visible:ring-offset-background flex list-none items-center gap-2 rounded-full border p-1 pr-2 shadow-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2">
              <Avatar size="sm">
                <AvatarImage src="" alt="Dhirender Dangi" />
                <AvatarFallback>D</AvatarFallback>
              </Avatar>
              <span className="hidden max-w-24 truncate text-xs font-medium sm:block">
                Dhirender
              </span>
            </summary>
            <div className="border-border/70 bg-popover absolute right-0 mt-2 w-52 rounded-xl border p-2 text-sm shadow-xl">
              <div className="px-2 py-2">
                <p className="font-medium">Dhirender Dangi</p>
                <p className="text-muted-foreground text-xs">
                  Founder workspace
                </p>
              </div>
              <button className="text-muted-foreground hover:bg-muted hover:text-foreground w-full rounded-lg px-2 py-2 text-left">
                Account settings
              </button>
              <button className="text-muted-foreground hover:bg-muted hover:text-foreground w-full rounded-lg px-2 py-2 text-left">
                Sign out
              </button>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
