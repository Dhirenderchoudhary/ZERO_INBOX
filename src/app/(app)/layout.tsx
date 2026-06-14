import { AppShell } from "@/components/layout/app-shell";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session) {
    redirect("/");
  }

  return <AppShell user={session.user}>{children}</AppShell>;
}
