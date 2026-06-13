import "@/styles/globals.css";
import { type Metadata } from "next";
import { TRPCReactProvider } from "@/trpc/react";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = {
  title: "FlowMail",
  description: "Premium Superhuman-Style Email & Calendar App",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <TRPCReactProvider>
          <AppShell>
            {children}
          </AppShell>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
