import { AppShell } from "@/components/layout/app-shell";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { GlobalHotkeys } from "@/components/layout/global-hotkeys";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/");
  }

  return (
    <>
      <GlobalHotkeys />
      <AppShell user={session.user}>{children}</AppShell>
    </>
  );
}
