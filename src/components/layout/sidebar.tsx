'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Inbox, Calendar, Bot, Star, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/trpc/react';

const nav = [
  { label: 'Inbox',    href: '/inbox',    icon: Inbox,    hint: 'G I' },
  { label: 'Starred',  href: '/inbox?filter=starred', icon: Star, hint: '' },
  { label: 'Sent',     href: '/inbox?filter=sent',    icon: Send, hint: '' },
  { label: 'Calendar', href: '/calendar', icon: Calendar, hint: 'G C' },
  { label: 'Agent',    href: '/agent',    icon: Bot,      hint: 'G A' },
];

const filters = [
  { label: '🔴 Urgent',      href: '/inbox?priority=urgent',      color: 'var(--color-urgent)' },
  { label: '💬 Needs Reply', href: '/inbox?priority=needs_reply', color: 'var(--color-reply)' },
  { label: 'ℹ️ FYI',         href: '/inbox?priority=fyi',         color: 'var(--color-fyi)' },
  { label: '📧 Newsletters', href: '/inbox?priority=newsletter',  color: 'var(--color-newsletter)' },
];

export function Sidebar() {
  const path = usePathname();

  return (
    <aside
      className="w-[220px] flex-shrink-0 flex flex-col h-full border-r"
      style={{ background: 'var(--color-bg-1)', borderColor: 'var(--color-border-0)' }}
    >
      <div className="px-4 py-4 flex items-center gap-2">
        <div className="w-6 h-6 rounded flex items-center justify-center"
             style={{ background: 'var(--color-accent)' }}>
          <span className="text-black text-xs font-bold">F</span>
        </div>
        <span className="font-semibold text-sm tracking-tight"
              style={{ color: 'var(--color-text-0)' }}>FlowMail</span>
      </div>

      <div className="px-3 mb-3">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('compose'))}
          className="w-full flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors"
          style={{
            background: 'var(--color-accent)',
            color: '#000',
          }}
        >
          <span>Compose</span>
          <span className="ml-auto font-mono opacity-70">C</span>
        </button>
      </div>

      <nav className="px-2 flex flex-col gap-0.5">
        {nav.map(item => {
          const active = path === item.href || (path?.startsWith(item.href.split('?')[0] as string) ?? false);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 px-2.5 py-1.5 rounded text-xs transition-colors group',
                active
                  ? 'font-medium'
                  : 'hover:opacity-100'
              )}
              style={{
                color: active ? 'var(--color-text-0)' : 'var(--color-text-1)',
                background: active ? 'var(--color-bg-3)' : 'transparent',
              }}
            >
              <item.icon size={13} />
              <span className="flex-1">{item.label}</span>
              {item.hint && (
                <span className="font-mono opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ fontSize: '10px', color: 'var(--color-text-3)' }}>
                  {item.hint}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 mt-4">
        <p className="text-micro mb-1.5 px-1.5" style={{ color: 'var(--color-text-3)' }}>
          PRIORITY
        </p>
        {filters.map(f => (
          <Link
            key={f.href}
            href={f.href}
            className="flex items-center gap-2 px-2.5 py-1 rounded text-xs transition-colors hover:opacity-80"
            style={{ color: 'var(--color-text-2)' }}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="mt-auto px-3 pb-3 pt-3 border-t"
           style={{ borderColor: 'var(--color-border-0)' }}>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('cmd-k'))}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors hover:opacity-80"
          style={{ background: 'var(--color-bg-3)', color: 'var(--color-text-2)' }}
        >
          <span>Command menu</span>
          <span className="font-mono" style={{ fontSize: '10px' }}>⌘K</span>
        </button>
      </div>
    </aside>
  );
}
