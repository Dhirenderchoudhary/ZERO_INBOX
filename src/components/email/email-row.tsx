'use client';
import { format, isToday, isYesterday } from 'date-fns';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const PRIORITY_COLORS: Record<string, string> = {
  urgent:      'var(--color-urgent)',
  needs_reply: 'var(--color-reply)',
  fyi:         'var(--color-fyi)',
  newsletter:  'var(--color-newsletter)',
  other:       'transparent',
};

function formatEmailTime(dateStr: string | undefined): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, 'h:mm a');
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMM d');
}

function parseSenderName(from: string | undefined): string {
  if (!from) return 'Unknown';
  const match = from.match(/^([^<]+)</);
  return match ? (match[1]?.trim() ?? 'Unknown') : (from.split('@')[0] || 'Unknown');
}

interface EmailRowProps {
  email: any;
  isSelected: boolean;
  isFocused: boolean;
  onClick: () => void;
}

export function EmailRow({ email, isSelected, isFocused, onClick }: EmailRowProps) {
  const priority = email?.priority ?? 'other';
  const isUnread = !email?.isRead;

  return (
    <div
      onClick={onClick}
      className="relative flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors border-b"
      style={{
        borderColor: 'var(--color-border-0)',
        background: isSelected
          ? 'var(--color-accent-glow)'
          : isFocused
          ? 'var(--color-bg-3)'
          : isUnread
          ? 'var(--color-bg-2)'
          : 'transparent',
        borderLeft: `2px solid ${isSelected ? 'var(--color-accent)' : (PRIORITY_COLORS[priority] || 'transparent')}`,
        paddingLeft: isSelected || (PRIORITY_COLORS[priority] || 'transparent') !== 'transparent' ? '14px' : '16px',
      }}
    >
      <div className="mt-1.5 flex-shrink-0">
        <div
          className="w-1.5 h-1.5 rounded-full transition-opacity"
          style={{
            background: 'var(--color-accent)',
            opacity: isUnread ? 1 : 0,
          }}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span
            className="text-small truncate"
            style={{
              color: 'var(--color-text-0)',
              fontWeight: isUnread ? 600 : 400,
            }}
          >
            {parseSenderName(email?.data?.from ?? email?.fromAddress ?? email?.from)}
          </span>
          <span className="text-mono flex-shrink-0 ml-2" style={{ color: 'var(--color-text-3)' }}>
            {formatEmailTime(email?.data?.date ?? email?.updated_at ?? new Date().toISOString())}
          </span>
        </div>

        <p
          className="text-small truncate mb-0.5"
          style={{
            color: isUnread ? 'var(--color-text-0)' : 'var(--color-text-1)',
            fontWeight: isUnread ? 500 : 400,
          }}
        >
          {email?.data?.subject ?? email?.subject ?? '(no subject)'}
        </p>

        <p className="text-micro truncate" style={{ color: 'var(--color-text-2)' }}>
          {email?.data?.snippet ?? email?.snippet ?? ''}
        </p>
      </div>

      {email?.isStarred && (
        <Star size={11} fill="var(--color-accent)" color="var(--color-accent)" className="mt-1 flex-shrink-0" />
      )}
    </div>
  );
}
