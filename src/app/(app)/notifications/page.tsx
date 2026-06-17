"use client";

import { Bell } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

export default function NotificationsPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8">
      <EmptyState
        icon={Bell}
        title="No new notifications"
        description="You're all caught up! When there are critical system alerts or AI triage summaries, they will appear here."
      />
    </div>
  );
}
