'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Inbox, Calendar, Bot, Star, Send, Zap,
  ChevronRight, Edit3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { KBD } from '@/components/ui/KBD';
import { motion } from 'framer-motion';

const NAV_ITEMS = [
  { label: 'Inbox',    href: '/inbox',    icon: Inbox,    hint: 'G I', badge: null },
  { label: 'Starred',  href: '/inbox?f=starred', icon: Star, hint: '', badge: null },
  { label: 'Sent',     href: '/inbox?f=sent',    icon: Send, hint: '', badge: null },
  { label: 'Calendar', href: '/calendar', icon: Calendar, hint: 'G C', badge: null },
  { label: 'Agent',    href: '/agent',    icon: Bot,      hint: 'G A', badge: 'AI' },
];

const PRIORITY_FILTERS = [
  { label: 'Urgent',      href: '/inbox?p=urgent',      color: 'var(--urgent)' },
  { label: 'Needs Reply', href: '/inbox?p=needs_reply', color: 'var(--reply)' },
  { label: 'FYI',         href: '/inbox?p=fyi',         color: 'var(--fyi)' },
  { label: 'Newsletters', href: '/inbox?p=newsletter',  color: 'var(--newsletter)' },
];

interface NavItemProps {
  item: typeof NAV_ITEMS[number];
  active: boolean;
}

function NavItem({ item, active }: NavItemProps) {
  return (
    <Link
      href={item.href}
      className={cn(
        'group relative flex items-center gap-2.5 px-3 py-2 rounded-[8px]',
        't-small transition-colors duration-150',
        active ? 'font-medium' : 'font-normal'
      )}
      style={{
        color: active ? 'var(--text-0)' : 'var(--text-2)',
        background: 'transparent',
      }}
      onMouseEnter={e => {
        if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--text-0)';
      }}
      onMouseLeave={e => {
        if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--text-2)';
      }}
    >
      {/* Active indicator */}
      {active && (
        <motion.div
          layoutId="sidebar-active"
          className="absolute inset-0 rounded-[8px]"
          style={{ background: 'var(--bg-3)', border: '1px solid var(--border-2)', boxShadow: 'var(--shadow-sm)' }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        />
      )}

      <item.icon size={14} className="relative z-10 flex-shrink-0" />
      <span className="relative z-10 flex-1">{item.label}</span>

      {/* AI badge */}
      {item.badge && (
        <span
          className="relative z-10 t-label px-1.5 py-0.5 rounded-[4px]"
          style={{
            fontSize: '9px',
            background: 'var(--accent-subtle)',
            color: 'var(--accent-text)',
            border: '1px solid var(--accent-border)',
            boxShadow: 'var(--shadow-glow)',
          }}
        >
          {item.badge}
        </span>
      )}

      {/* Keyboard hint */}
      {item.hint && (
        <span
          className="relative z-10 t-mono opacity-0 group-hover:opacity-100 transition-opacity duration-150"
          style={{ color: 'var(--text-3)', fontSize: '10px' }}
        >
          {item.hint}
        </span>
      )}
    </Link>
  );
}

export function Sidebar({ user }: { user: any }) {
  const path = usePathname();

  return (
    <aside
      className="w-[240px] flex-shrink-0 flex flex-col h-full relative z-20"
      style={{
        background: 'rgba(12, 12, 15, 0.75)', // var(--bg-1) but translucent
        backdropFilter: 'var(--blur-md)',
        WebkitBackdropFilter: 'var(--blur-md)',
        borderRight: '1px solid var(--border-0)',
      }}
    >
      {/* Logo */}
      <div
        className="px-5 h-[60px] flex items-center gap-3 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border-0)' }}
      >
        <div
          className="w-6 h-6 rounded-[6px] flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--accent)', boxShadow: 'var(--shadow-glow)' }}
        >
          <Zap size={14} color="#000" strokeWidth={2.5} />
        </div>
        <span className="t-title tracking-tight" style={{ color: 'var(--text-0)' }}>
          ZERO_INBOX
        </span>
      </div>

      {/* Compose */}
      <div className="px-3 pt-5 pb-2">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('compose'))}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-[8px] t-small font-semibold transition-all duration-150 active:scale-[0.98] group relative overflow-hidden"
          style={{ 
            background: 'var(--bg-2)', 
            color: 'var(--text-0)',
            border: '1px solid var(--border-2)',
            boxShadow: 'var(--shadow-sm)'
          }}
          onMouseEnter={e => {
            (e.currentTarget.style.borderColor = 'var(--accent-border)');
            (e.currentTarget.style.boxShadow = 'var(--shadow-glow)');
          }}
          onMouseLeave={e => {
            (e.currentTarget.style.borderColor = 'var(--border-2)');
            (e.currentTarget.style.boxShadow = 'var(--shadow-sm)');
          }}
        >
          <div className="flex items-center gap-2">
            <Edit3 size={14} style={{ color: 'var(--accent)' }} className="group-hover:scale-110 transition-transform duration-200" />
            <span>Compose</span>
          </div>
          <KBD>C</KBD>
        </button>
      </div>

      {/* Nav */}
      <nav className="px-3 flex flex-col gap-1 mt-2">
        {NAV_ITEMS.map(item => (
          <NavItem
            key={item.href}
            item={item}
            active={path === item.href.split('?')[0] || path.startsWith(item.href.split('?')[0]!)}
          />
        ))}
      </nav>

      {/* Divider */}
      <div className="mx-4 my-4 divider" />

      {/* Priority filters */}
      <div className="px-3">
        <p
          className="t-label px-3 mb-2"
          style={{ color: 'var(--text-3)' }}
        >
          Priority Triage
        </p>
        <div className="flex flex-col gap-0.5">
          {PRIORITY_FILTERS.map(f => (
            <Link
              key={f.href}
              href={f.href}
              className="flex items-center gap-3 px-3 py-2 rounded-[8px] t-small transition-all duration-150"
              style={{ color: 'var(--text-2)' }}
              onMouseEnter={e => {
                (e.currentTarget.style.color = 'var(--text-0)');
                (e.currentTarget.style.background = 'var(--bg-3)');
              }}
              onMouseLeave={e => {
                (e.currentTarget.style.color = 'var(--text-2)');
                (e.currentTarget.style.background = 'transparent');
              }}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: f.color, boxShadow: `0 0 8px ${f.color}40` }}
              />
              {f.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom */}
      <div
        className="mt-auto p-4 flex flex-col gap-2"
        style={{ borderTop: '1px solid var(--border-0)' }}
      >
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('cmd-k'))}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-[8px] t-small transition-all duration-150 group"
          style={{
            background: 'var(--bg-2)',
            color: 'var(--text-2)',
            border: '1px solid var(--border-1)',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.color = 'var(--text-0)';
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-2)';
            (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.color = 'var(--text-2)';
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-1)';
            (e.currentTarget as HTMLElement).style.boxShadow = 'none';
          }}
        >
          <span>Command menu</span>
          <KBD>⌘K</KBD>
        </button>

        {user && (
          <div className="flex items-center gap-2 mt-2 px-1">
            {user.image ? (
              <img src={user.image} alt={user.name} className="w-6 h-6 rounded-full" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-semibold">{user.name?.[0]}</div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{user.name}</p>
            </div>
            <button 
              onClick={async () => {
                const { signOut } = await import('@/lib/auth-client');
                await signOut();
                window.location.href = '/';
              }}
              className="text-xs text-zinc-500 hover:text-red-400 transition-colors"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
