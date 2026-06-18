"use client";

import { Home, Users, BarChart, Settings, Mail, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/auth-client";

const adminLinks = [
  { href: "/admin", icon: Home, label: "Overview" },
  { href: "/admin/users", icon: Users, label: "Users" },
  { href: "/admin/analytics", icon: BarChart, label: "Analytics" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="border-border/50 bg-background flex h-full w-64 shrink-0 flex-col border-r">
      <div className="border-border/50 flex items-center gap-3 border-b p-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 text-white shadow-md">
          <Mail size={18} className="stroke-[2.5]" />
        </div>
        <span className="text-lg font-semibold tracking-tight">Zero Admin</span>
      </div>

      <div className="flex-1 space-y-1 p-4">
        {adminLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all duration-200",
                isActive
                  ? "bg-indigo-500/10 font-medium text-indigo-600 dark:text-indigo-400"
                  : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
              )}
            >
              <link.icon size={18} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="border-border/50 space-y-1 border-t p-4">
        <Link
          href="/dashboard"
          className="text-muted-foreground hover:bg-muted/80 hover:text-foreground flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all duration-200"
        >
          <Home size={18} />
          <span>Back to App</span>
        </Link>
        <button
          onClick={() =>
            signOut({
              fetchOptions: {
                onSuccess: () => {
                  window.location.href = "/login";
                },
              },
            })
          }
          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-all duration-200"
        >
          <LogOut size={18} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
