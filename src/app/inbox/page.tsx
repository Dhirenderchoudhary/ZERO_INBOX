import { EmailList } from '@/components/email/email-list';
import { EmailDetail } from '@/components/email/email-detail';

export default function InboxPage() {
  return (
    <div className="flex-1 flex overflow-hidden">
      <EmailList />
      <EmailDetail />
    </div>
  );
}
