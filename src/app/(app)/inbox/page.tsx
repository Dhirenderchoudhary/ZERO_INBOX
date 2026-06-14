import { EmailList } from "@/components/email/email-list";
import { EmailDetail } from "@/components/email/email-detail";

export default function InboxPage() {
  return (
    <div className="grid h-full min-h-0 grid-cols-1 overflow-hidden p-3 lg:grid-cols-[420px_minmax(0,1fr)] lg:gap-3 lg:p-4">
      <EmailList />
      <EmailDetail />
    </div>
  );
}
