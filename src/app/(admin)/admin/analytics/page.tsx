"use client";

import { BarChart, TrendingUp, Users, Activity } from "lucide-react";

export default function AdminAnalyticsPage() {
  return (
    <div className="bg-background h-full overflow-y-auto p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Monitor platform usage, AI metrics, and growth.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            {
              label: "Active Users",
              value: "1,248",
              icon: Users,
              trend: "+12%",
            },
            {
              label: "Emails Triaged",
              value: "45.2k",
              icon: Activity,
              trend: "+24%",
            },
            {
              label: "AI Tokens Used",
              value: "2.4M",
              icon: TrendingUp,
              trend: "+8%",
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-card border-border/50 rounded-xl border p-6 shadow-sm"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-500">
                  <stat.icon size={20} />
                </div>
                <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-sm font-medium text-emerald-500">
                  {stat.trend}
                </span>
              </div>
              <p className="text-muted-foreground text-sm font-medium">
                {stat.label}
              </p>
              <h3 className="mt-1 text-3xl font-bold">{stat.value}</h3>
            </div>
          ))}
        </div>

        <div className="bg-card border-border/50 flex min-h-[300px] flex-col items-center justify-center rounded-xl border p-8 text-center shadow-sm">
          <BarChart className="text-muted-foreground/30 mb-4 h-16 w-16" />
          <h2 className="mb-2 text-xl font-semibold">
            Detailed Charts Coming Soon
          </h2>
          <p className="text-muted-foreground max-w-sm">
            We are currently wiring up the advanced time-series database for
            enterprise-level charting. Check back later!
          </p>
        </div>
      </div>
    </div>
  );
}
