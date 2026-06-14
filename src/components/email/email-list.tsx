'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, Cpu, Search, X, Inbox } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { api } from '@/trpc/react';
import { EmailRow } from './EmailRow';
import { EmailRowSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useEmailStore } from '@/hooks/useEmailStore';

const TABS = [
  { key: 'all',         label: 'All' },
  { key: 'unread',      label: 'Unread' },
  { key: 'urgent',      label: 'Urgent' },
  { key: 'needs_reply', label: 'Reply' },
  { key: 'fyi',         label: 'FYI' },
];

export function EmailList() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [focusedIdx, setFocusedIdx] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const { selectedId, setSelectedId } = useEmailStore();

  const { data: emails = [], refetch, isLoading } = api.gmail.listWithTriage.useQuery(
    { limit: 60, priority: filter as any },
    { refetchInterval: 60_000 }
  );

  const { data: searchResults = [], isFetching: isSearching } = api.gmail.search.useQuery(
    { query: search },
    { enabled: search.length > 1 }
  );

  const displayed = search.length > 1 ? searchResults : emails;

  const refresh = api.gmail.refresh.useMutation({
    onSuccess: d => {
      refetch();
      toast.success(`Synced ${d.synced} threads from Gmail`);
    },
    onError: () => toast.error('Failed to refresh'),
  });

  const triage = api.ai.triageInbox.useMutation({
    onSuccess: d => {
      refetch();
      toast.success(`Triaged ${d.triaged} emails with AI`);
    },
  });

  // Keyboard navigation
  useEffect(() => {
    const handlers: Record<string, () => void> = {
      'nav-next': () => setFocusedIdx(i => Math.min(i + 1, displayed.length - 1)),
      'nav-prev': () => setFocusedIdx(i => Math.max(i - 1, 0)),
      'refresh': () => refresh.mutate(),
      'triage': () => triage.mutate(),
    };
    Object.entries(handlers).forEach(([e, h]) => window.addEventListener(e, h));
    return () => Object.entries(handlers).forEach(([e, h]) => window.removeEventListener(e, h));
  }, [displayed.length]);

  return (
    <div
      className="w-[420px] flex-shrink-0 flex flex-col h-full relative z-10"
      style={{
        background: 'rgba(10, 10, 12, 0.5)',
        backdropFilter: 'var(--blur-lg)',
        WebkitBackdropFilter: 'var(--blur-lg)',
        borderRight: '1px solid var(--border-0)',
      }}
    >
      {/* Header */}
      <div
        className="px-5 pt-6 pb-4 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border-0)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="t-display tracking-tight" style={{ color: 'var(--text-0)' }}>Inbox</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => triage.mutate()}
              disabled={triage.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] t-small font-semibold transition-all duration-200 disabled:opacity-40 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: triage.isPending ? 'var(--bg-3)' : 'var(--accent-subtle)',
                color: 'var(--accent-text)',
                border: '1px solid var(--accent-border)',
                boxShadow: 'var(--shadow-glow)',
              }}
            >
              <Cpu size={14} className={triage.isPending ? 'animate-pulse' : ''} />
              {triage.isPending ? 'Triaging...' : 'AI Triage'}
            </button>
            <button
              onClick={() => refresh.mutate()}
              disabled={refresh.isPending}
              className="p-2 rounded-[8px] transition-all duration-200 disabled:opacity-40 hover:scale-[1.05] active:scale-[0.95]"
              style={{
                background: 'var(--bg-2)',
                color: 'var(--text-1)',
                border: '1px solid var(--border-1)',
                boxShadow: 'var(--shadow-sm)'
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-0)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-1)')}
            >
              <RefreshCw size={14} className={refresh.isPending ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div
          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-[10px] transition-all duration-200"
          style={{
            background: 'var(--bg-1)',
            border: '1px solid var(--border-1)',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
          }}
          onFocusCapture={e => {
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-border)';
            (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 1px var(--accent-glow) inset, var(--shadow-glow)';
          }}
          onBlurCapture={e => {
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-1)';
            (e.currentTarget as HTMLElement).style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.2)';
          }}
        >
          <Search size={14} style={{ color: 'var(--text-2)', flexShrink: 0 }} />
          <input
            ref={searchRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search your workflow..."
            className="flex-1 t-body bg-transparent outline-none"
            style={{ color: 'var(--text-0)' }}
          />
          <AnimatePresence>
            {search && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.1 }}
                onClick={() => setSearch('')}
                className="p-1 rounded-full hover:bg-white/10"
              >
                <X size={12} style={{ color: 'var(--text-2)' }} />
              </motion.button>
            )}
          </AnimatePresence>
          {isSearching && <div className="w-3.5 h-3.5 rounded-full border-[1.5px] border-current border-t-transparent animate-spin" style={{ color: 'var(--accent)' }} />}
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1.5 mt-4 overflow-x-auto pb-px scrollbar-none">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className="flex-shrink-0 px-3 py-1.5 rounded-[6px] t-small transition-all duration-200"
              style={{
                background: filter === tab.key ? 'var(--bg-3)' : 'transparent',
                color: filter === tab.key ? 'var(--text-0)' : 'var(--text-2)',
                border: filter === tab.key ? '1px solid var(--border-2)' : '1px solid transparent',
                fontWeight: filter === tab.key ? 500 : 400,
                boxShadow: filter === tab.key ? 'var(--shadow-sm)' : 'none'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Email list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div>
            {Array.from({ length: 8 }).map((_, i) => (
              <EmailRowSkeleton key={i} />
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <EmptyState
            icon={search ? Search : Inbox}
            title={search ? 'No results found' : 'Inbox zero'}
            description={search ? `No emails matching "${search}"` : 'All caught up. Refresh to sync Gmail.'}
            action={search ? { label: 'Clear search', onClick: () => setSearch('') } : { label: 'Refresh inbox', onClick: () => refresh.mutate() }}
          />
        ) : (
          <AnimatePresence initial={false}>
            {displayed.map((email, idx) => (
              <EmailRow
                key={email.entity_id}
                email={email}
                index={idx}
                isSelected={selectedId === email.entity_id}
                isFocused={focusedIdx === idx && !selectedId}
                onClick={() => {
                  setSelectedId(email.entity_id);
                  setFocusedIdx(idx);
                }}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Footer bar */}
      <div
        className="px-5 py-2.5 flex items-center justify-between flex-shrink-0"
        style={{ borderTop: '1px solid var(--border-0)', background: 'var(--bg-1)' }}
      >
        <span className="t-mono" style={{ color: 'var(--text-2)', fontSize: '11px' }}>
          {displayed.length} messages
        </span>
        <span className="t-mono" style={{ color: 'var(--text-2)', fontSize: '11px' }}>
          j/k · e archive
        </span>
      </div>
    </div>
  );
}
