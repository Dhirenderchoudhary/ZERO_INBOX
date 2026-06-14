'use client';
import { motion } from 'framer-motion';
import { format, isToday, isYesterday } from 'date-fns';
import { Star } from 'lucide-react';
import { PriorityBadge } from './PriorityBadge';
import { parseSenderName } from '@/server/lib/emailUtils';

const TRIAGE_CLASS: Record<string, string> = {
  urgent:      'triage-urgent',
  needs_reply: 'triage-reply',
  fyi:         'triage-fyi',
  newsletter:  'triage-newsletter',
  other:       'triage-none',
};

function fmtTime(d?: string): string {
  if (!d) return '';
  const dt = new Date(d);
  if (isToday(dt))     return format(dt, 'h:mm a');
  if (isYesterday(dt)) return 'Yesterday';
  return format(dt, 'MMM d');
}

interface Props {
  email: any;
  isSelected: boolean;
  isFocused: boolean;
  onClick: () => void;
  index: number;
}

export function EmailRow({ email, isSelected, isFocused, onClick, index }: Props) {
  const priority = email.priority ?? 'other';
  const unread = !email.isRead;

  return (
    <motion.div
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.15, delay: Math.min(index * 0.02, 0.3) }}
      onClick={onClick}
      className={`
        group relative flex items-start gap-3 px-4 py-3.5 cursor-pointer
        select-none transition-all duration-200
        ${TRIAGE_CLASS[priority] ?? 'triage-none'}
      `}
      style={{
        borderBottom: '1px solid var(--border-0)',
        background: isSelected
          ? 'var(--bg-3)'
          : isFocused
          ? 'var(--bg-2)'
          : 'transparent',
        borderLeftWidth: '3px',
      }}
    >
      {/* Hover Background overlay */}
      <div 
        className="absolute inset-0 z-0 transition-opacity duration-200 opacity-0 group-hover:opacity-100"
        style={{ 
          background: 'var(--bg-2)', 
          boxShadow: 'var(--shadow-sm)',
          zIndex: 0 
        }} 
      />

      {/* Selected Indicator */}
      {isSelected && (
        <motion.div
          layoutId="selected-row"
          className="absolute inset-0 z-0"
          style={{ background: 'var(--bg-3)', border: '1px solid var(--border-2)', borderLeft: 'none' }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        />
      )}

      {/* Unread dot */}
      <div className="relative z-10 flex-shrink-0 mt-[6px]">
        <span
          className="block w-2 h-2 rounded-full transition-opacity duration-300"
          style={{
            background: 'var(--accent)',
            boxShadow: 'var(--shadow-glow)',
            opacity: unread ? 1 : 0,
            transform: unread ? 'scale(1)' : 'scale(0.5)',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 min-w-0 pr-1">
        {/* Row 1: sender + time */}
        <div className="flex items-center gap-2 mb-1">
          <span
            className="t-body flex-1 truncate"
            style={{
              color: unread ? 'var(--text-0)' : 'var(--text-1)',
              fontWeight: unread ? 600 : 500,
            }}
          >
            {parseSenderName(email.data?.from)}
          </span>
          <span
            className="t-mono flex-shrink-0"
            style={{ color: unread ? 'var(--text-2)' : 'var(--text-3)' }}
          >
            {fmtTime(email.data?.date ?? email.updated_at)}
          </span>
        </div>

        {/* Row 2: priority badge + subject */}
        <div className="flex items-center gap-2 mb-1.5">
          <PriorityBadge priority={priority} />
          <p
            className="t-small flex-1 truncate tracking-tight"
            style={{
              color: unread ? 'var(--text-0)' : 'var(--text-2)',
              fontWeight: unread ? 500 : 400,
            }}
          >
            {email.data?.subject || '(no subject)'}
          </p>
        </div>

        {/* Row 3: snippet */}
        <p className="t-small truncate" style={{ color: 'var(--text-3)', lineHeight: 1.4 }}>
          {email.data?.snippet || '(no preview)'}
        </p>
      </div>

      {/* Star */}
      {email.isStarred && (
        <Star
          size={14}
          className="relative z-10 flex-shrink-0 mt-[4px]"
          fill="var(--accent)"
          color="var(--accent)"
          style={{ filter: 'drop-shadow(0 0 8px var(--accent-glow))' }}
        />
      )}
    </motion.div>
  );
}
