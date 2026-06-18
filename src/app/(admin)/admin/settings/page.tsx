"use client";

import { Shield, Database, Key } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AdminSettingsPage() {
  return (
    <div className="bg-background h-full overflow-y-auto p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Settings</h1>
          <p className="text-muted-foreground mt-2">
            Configure global platform security, integrations, and database
            variables.
          </p>
        </div>

        <div className="grid gap-6">
          <div className="bg-card border-border/50 flex items-start gap-4 rounded-xl border p-6 shadow-sm">
            <div className="shrink-0 rounded-lg bg-red-500/10 p-3 text-red-500">
              <Shield size={24} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Global Security Policy
                </h3>
                <Badge
                  variant="outline"
                  className="border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                >
                  Active
                </Badge>
              </div>
              <p className="text-muted-foreground mt-1 text-sm">
                Enforce strict Content Security Policies and prevent external
                API leaks.
              </p>
              <div className="border-border/50 mt-4 border-t pt-4">
                <p className="text-muted-foreground/70 text-xs italic">
                  Managed automatically by Vercel environment variables.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card border-border/50 flex items-start gap-4 rounded-xl border p-6 shadow-sm">
            <div className="shrink-0 rounded-lg bg-indigo-500/10 p-3 text-indigo-500">
              <Key size={24} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">OpenAI Rate Limits</h3>
                <Badge variant="secondary">Configured</Badge>
              </div>
              <p className="text-muted-foreground mt-1 text-sm">
                Max tokens per user: 15,000 / day. (Currently handled via
                Upstash).
              </p>
              <button className="bg-secondary hover:bg-secondary/80 text-secondary-foreground mt-4 rounded-md px-4 py-2 text-sm font-medium transition-colors">
                Edit Rate Limits
              </button>
            </div>
          </div>

          <div className="bg-card border-border/50 flex items-start gap-4 rounded-xl border p-6 shadow-sm">
            <div className="shrink-0 rounded-lg bg-emerald-500/10 p-3 text-emerald-500">
              <Database size={24} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Database Connection</h3>
                <Badge
                  variant="outline"
                  className="border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                >
                  Healthy
                </Badge>
              </div>
              <p className="text-muted-foreground mt-1 text-sm">
                Drizzle ORM connected to Neon Postgres. Latency: ~14ms.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
