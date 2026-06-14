"use client";
import { motion } from "framer-motion";
import { Sidebar } from "./sidebar";
import { CommandPalette } from "./command-palette";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { useKeyboard } from "@/hooks/useKeyboard";

import { GlobalCompose } from "@/components/email/GlobalCompose";

export function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: any;
}) {
  useKeyboard();

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "var(--bg-0)" }}
    >
      <Sidebar user={user} />
      <motion.main
        className="flex min-w-0 flex-1 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
      >
        {children}
      </motion.main>
      <CommandPalette />
      <GlobalCompose />
      <ToastProvider />
    </div>
  );
}
