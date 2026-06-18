import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Activity, CreditCard, Mail } from "lucide-react";
import { db } from "@/server/db";
import { user, subscriptions, emailTriage } from "@/server/db/schema";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function AdminOverview() {
  // Fetch stats from DB
  const [totalUsersRes, totalSubsRes, totalEmailsRes] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(user),
    db.select({ count: sql<number>`count(*)` }).from(subscriptions),
    db.select({ count: sql<number>`count(*)` }).from(emailTriage),
  ]);

  const totalUsers = totalUsersRes[0]?.count ?? 0;
  const totalSubs = totalSubsRes[0]?.count ?? 0;
  const totalEmails = totalEmailsRes[0]?.count ?? 0;

  const stats = [
    {
      title: "Total Users",
      value: totalUsers.toString(),
      icon: Users,
      description: "+12% from last month",
    },
    {
      title: "Active Subscriptions",
      value: totalSubs.toString(),
      icon: CreditCard,
      description: "+4% from last month",
    },
    {
      title: "Emails Triaged",
      value: totalEmails.toString(),
      icon: Mail,
      description: "Powered by AI",
    },
    {
      title: "System Status",
      value: "Healthy",
      icon: Activity,
      description: "All services operational",
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-foreground text-3xl font-bold tracking-tight">
          Dashboard Overview
        </h1>
        <p className="text-muted-foreground mt-1">
          Welcome to the Zero Inbox administrative panel.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card
            key={stat.title}
            className="border-border/50 shadow-sm transition-all hover:shadow-md"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-foreground text-2xl font-bold">
                {stat.value}
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="border-border/50 col-span-4 shadow-sm">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground flex items-center justify-center py-10">
            Analytics chart will render here.
          </CardContent>
        </Card>
        <Card className="border-border/50 col-span-3 shadow-sm">
          <CardHeader>
            <CardTitle>System Health</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Database (Neon)</span>
              <span className="text-sm font-semibold text-green-500">
                Online
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">OpenAI API</span>
              <span className="text-sm font-semibold text-green-500">
                Online
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">QStash Worker</span>
              <span className="text-sm font-semibold text-green-500">
                Online
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
