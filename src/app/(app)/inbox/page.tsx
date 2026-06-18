"use client";

import { EmailList } from "@/components/email/email-list";
import { EmailDetail } from "@/components/email/email-detail";
import { useEmailStore } from "@/hooks/useEmailStore";

export default function InboxPage() {
  const { selectedId } = useEmailStore();
  return (
    <>
      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden p-3 lg:hidden">
        <EmailList />
        {selectedId && <EmailDetail />}
      </div>

      <div
        className={
          selectedId
            ? "hidden min-h-0 flex-1 gap-4 overflow-hidden lg:grid lg:grid-cols-[350px_1fr] lg:p-4"
            : "hidden min-h-0 flex-1 overflow-hidden lg:grid lg:grid-cols-1 lg:p-4"
        }
      >
        <EmailList />
        {selectedId && <EmailDetail />}
      </div>
    </>
  );
}
