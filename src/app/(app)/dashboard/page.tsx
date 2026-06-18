"use client";

import { useEffect } from "react";
import {
  Bot,
  Calendar,
  CalendarCheck,
  Clock,
  Clock3,
  Inbox,
  MailPlus,
  Plus,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { api } from "@/trpc/react";
import { InboxIntelligence } from "@/components/dashboard/inbox-intelligence";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { RecentActions } from "@/components/dashboard/recent-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { EmptyState } from "@/components/ui/EmptyState";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;

  const { isError: isGmailError } = api.gmail.listWithTriage.useQuery({
    limit: 1,
  });

  useEffect(() => {
    const scrollToHash = () => {
      const id = window.location.hash.slice(1);
      if (!id) return;
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    };

    scrollToHash();
    window.addEventListener("hashchange", scrollToHash);

    // Also observe Next.js internal navigation changes if needed
    const observer = new MutationObserver(() => {
      if (window.location.hash) scrollToHash();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener("hashchange", scrollToHash);
      observer.disconnect();
    };
  }, []);

  const { data: stats } = api.dashboard.getStats.useQuery();

  const kpis = [
    {
      label: "Priority threads",
      value: stats?.priorityThreads?.toString() ?? "0",
      trend: "urgent inbox items",
      icon: Inbox,
      tone: "text-rose-500",
    },
    {
      label: "Reply obligations",
      value: stats?.replyObligations?.toString() ?? "0",
      trend: "needs reply",
      icon: Clock3,
      tone: "text-amber-500",
    },
    {
      label: "Meetings automated",
      value: stats?.meetingsAutomated?.toString() ?? "0",
      trend: "total scheduled",
      icon: CalendarCheck,
      tone: "text-emerald-500",
    },
    {
      label: "AI actions",
      value: stats?.aiActions?.toString() ?? "0",
      trend: "messages used",
      icon: Bot,
      tone: "text-violet-500",
    },
  ] as const;

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        {isGmailError && (
          <EmptyState
            icon={Inbox}
            title="Connect your Gmail"
            description="Please link your Gmail account to unlock AI-powered triage, summaries, replies, and workflow automation."
            action={{
              label: "Connect Gmail",
              onClick: () =>
                (window.location.href = "/api/corsair/connect?plugin=gmail"),
            }}
          />
        )}

        <section className="border-border/70 bg-card overflow-hidden rounded-2xl border shadow-sm">
          <div className="relative p-6 sm:p-8">
            <div className="bg-primary/10 absolute top-0 right-0 h-56 w-56 rounded-full blur-3xl" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <Badge
                  variant="outline"
                  className="bg-primary/5 mb-4 rounded-full"
                >
                  <Sparkles size={13} /> Morning command brief
                </Badge>
                <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  Welcome{" "}
                  {user?.name?.split(" ")[0]
                    ? `${user.name.split(" ")[0]}, `
                    : ""}
                  your communication system is under control.
                </h2>
                <p className="text-muted-foreground mt-3 text-base leading-7">
                  AI triage is filtering low-signal work, surfacing critical
                  replies, and keeping your calendar aligned with priority
                  conversations.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() =>
                    window.dispatchEvent(new CustomEvent("compose"))
                  }
                  className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-md transition-all hover:shadow-lg"
                >
                  <MailPlus size={16} /> New message
                </Button>
                <Button
                  variant="outline"
                  className="border-border/60 bg-background/50 hover:bg-muted/80 rounded-xl shadow-sm backdrop-blur-sm transition-all hover:shadow-md"
                  onClick={() => {
                    router.push("/agent");
                  }}
                >
                  <Bot size={16} /> Ask agent
                </Button>
                <Button
                  className="rounded-xl bg-amber-500 text-white shadow-md transition-all hover:bg-amber-600 hover:shadow-lg"
                  onClick={() => {
                    router.push("/dashboard/billing");
                  }}
                >
                  Upgrade to Pro
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((item) => (
            <KpiCard
              key={item.label}
              label={item.label}
              value={item.value}
              trend={item.trend}
              icon={item.icon}
              tone={item.tone}
            />
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <InboxIntelligence data={stats?.inboxIntelligence} />
          <RecentActions data={stats?.recentActions} />
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <Card id="security">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck size={18} /> Trust posture
              </CardTitle>
              <CardDescription>
                OAuth, least privilege scopes, and auditability.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-3 text-sm">
              <p>
                Google OAuth connected with scoped access for Gmail and Calendar
                actions.
              </p>
              <p>
                Every automated action is logged, reviewable, and reversible.
              </p>
            </CardContent>
          </Card>

          <Card className="flex flex-col gap-2 p-2">
            <Card className="hover:bg-muted/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Emails Triaged
                </CardTitle>
                <Inbox className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(stats?.priorityThreads || 0) +
                    (stats?.replyObligations || 0)}
                </div>
                <p className="text-muted-foreground text-xs">
                  Sorted by ZERO_INBOX AI
                </p>
              </CardContent>
            </Card>

            <Card className="hover:bg-muted/50 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Time Saved
                </CardTitle>
                <Clock className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ~{((stats?.aiActions || 0) * 2.5).toFixed(1)} hrs
                </div>
                <p className="text-muted-foreground text-xs">
                  Based on AI actions taken
                </p>
              </CardContent>
            </Card>

            <Card className="hover:bg-muted/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Quick Schedule
                </CardTitle>
                <Calendar className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent className="space-y-2 pt-2">
                <p className="text-muted-foreground mb-2 text-xs">
                  Instantly send an invite using ZERO INBOX API
                </p>
                <Button
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent("new-event"));
                  }}
                >
                  <Plus className="mr-2 h-3 w-3" /> New Meeting
                </Button>
              </CardContent>
            </Card>
          </Card>

          <Card id="settings">
            <CardHeader>
              <CardTitle>Empty-state quality</CardTitle>
              <CardDescription>
                When data is unavailable, the product guides the next step.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-border bg-muted/40 rounded-xl border border-dashed p-6 text-center">
                <Sparkles
                  className="text-muted-foreground mx-auto mb-3"
                  size={24}
                />
                <p className="font-medium">No pending escalations</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  You are clear to focus on deep work.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
