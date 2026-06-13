'use client';
import { useState, useEffect } from 'react';
import { RefreshCw, Cpu, Search, X } from 'lucide-react';
import { api } from '@/trpc/react';
import { EmailRow } from './email-row';
import { useEmailStore } from '@/hooks/useEmailStore';

const FILTER_TABS = [
  { key: 'all',         label: 'All' },
  { key: 'unread',      label: 'Unread' },
  { key: 'urgent',      label: '🔴 Urgent' },
  { key: 'needs_reply', label: '💬 Reply' },
  { key: 'fyi',         label: 'ℹ️ FYI' },
];

export function EmailList() {
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [focusedIdx, setFocusedIdx] = useState(0);
  const { selectedId, setSelectedId } = useEmailStore();

  const { data: emails = [], refetch, isLoading } = api.gmail.listWithTriage.useQuery({
    limit: 60,
    priority: filter as any,
  });

  const { data: searchResults = [] } = api.gmail.search.useQuery(
    { query: search },
    { enabled: search.length > 1 }
  );

  const displayed = search.length > 1 ? searchResults : emails;

  const refresh = api.gmail.refresh.useMutation({ onSuccess: () => refetch() });
  const triage = api.ai.triageInbox.useMutation({ onSuccess: () => refetch() });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (['INPUT','TEXTAREA'].includes((e.target as Element)?.tagName)) return;
      if (e.key === 'j') setFocusedIdx(i => Math.min(i + 1, displayed.length - 1));
      if (e.key === 'k') setFocusedIdx(i => Math.max(i - 1, 0));
      if (e.key === 'Enter' && displayed[focusedIdx]) {
        setSelectedId(displayed[focusedIdx].entity_id);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [displayed, focusedIdx]);

  return (
    <div
      className="w-[360px] flex-shrink-0 flex flex-col h-full border-r"
      style={{ background: 'var(--color-bg-2)', borderColor: 'var(--color-border-0)' }}
    >
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-title" style={{ color: 'var(--color-text-0)' }}>Inbox</h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => triage.mutate()}
              disabled={triage.isPending}
              className="flex items-center gap-1.5 px-2 py-1 rounded text-micro transition-colors"
              style={{
                background: 'var(--color-bg-4)',
                color: triage.isPending ? 'var(--color-text-3)' : 'var(--color-accent)',
              }}
              title="AI Triage Inbox"
            >
              <Cpu size={11} />
              {triage.isPending ? 'Triaging...' : 'Triage'}
            </button>
            <button
              onClick={() => refresh.mutate()}
              disabled={refresh.isPending}
              className="p-1.5 rounded transition-colors"
              style={{ background: 'var(--color-bg-4)', color: 'var(--color-text-2)' }}
            >
              <RefreshCw size={12} className={refresh.isPending ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded"
          style={{ background: 'var(--color-bg-3)', border: '1px solid var(--color-border-1)' }}
        >
          <Search size={12} style={{ color: 'var(--color-text-3)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search emails..."
            className="flex-1 text-small bg-transparent outline-none"
            style={{ color: 'var(--color-text-0)' }}
          />
          {search && (
            <button onClick={() => setSearch('')}>
              <X size={11} style={{ color: 'var(--color-text-3)' }} />
            </button>
          )}
        </div>
      </div>

      <div
        className="flex items-center gap-1 px-3 pb-2 overflow-x-auto"
        style={{ borderBottom: '1px solid var(--color-border-0)' }}
      >
        {FILTER_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className="flex-shrink-0 px-2 py-1 rounded text-micro transition-colors"
            style={{
              background: filter === tab.key ? 'var(--color-bg-4)' : 'transparent',
              color: filter === tab.key ? 'var(--color-text-0)' : 'var(--color-text-2)',
              border: filter === tab.key ? '1px solid var(--color-border-2)' : '1px solid transparent',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="flex gap-1">
              {[0,1,2].map(i => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full animate-bounce"
                  style={{ background: 'var(--color-accent)', animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center px-6">
            <p className="text-body mb-1" style={{ color: 'var(--color-text-2)' }}>
              {search ? 'No results found' : 'Inbox is empty'}
            </p>
            <p className="text-small" style={{ color: 'var(--color-text-3)' }}>
              {search ? 'Try a different search' : 'Click refresh to sync Gmail'}
            </p>
          </div>
        ) : (
          displayed.map((email, idx) => (
            <EmailRow
              key={email.entity_id}
              email={email}
              isSelected={selectedId === email.entity_id}
              isFocused={focusedIdx === idx && !selectedId}
              onClick={() => {
                setSelectedId(email.entity_id);
                setFocusedIdx(idx);
              }}
            />
          ))
        )}
      </div>

      <div className="px-4 py-2 border-t" style={{ borderColor: 'var(--color-border-0)' }}>
        <p className="text-micro" style={{ color: 'var(--color-text-3)' }}>
          {displayed.length} messages · j/k to navigate
        </p>
      </div>
    </div>
  );
}
