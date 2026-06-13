'use client';
import { useState } from 'react';
import { Reply, Archive, Star, Cpu, Loader2, ArrowLeft } from 'lucide-react';
import { api } from '@/trpc/react';
import { useEmailStore } from '@/hooks/useEmailStore';
import { ComposeModal } from './compose-modal';
import { format } from 'date-fns';

function decodeBody(payload: any): string {
  if (!payload) return '';
  if (payload.body?.data) {
    try { return atob(payload.body.data.replace(/-/g,'+').replace(/_/g,'/')); } catch {}
  }
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        try { return atob(part.body.data.replace(/-/g,'+').replace(/_/g,'/')); } catch {}
      }
    }
    for (const part of payload.parts) {
      const nested = decodeBody(part);
      if (nested) return nested;
    }
  }
  return '';
}

function linkify(text: string): string {
  return text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener" style="color:var(--color-accent);text-decoration:underline">$1</a>');
}

export function EmailDetail() {
  const { selectedId, setSelectedId } = useEmailStore();
  const [showReply, setShowReply] = useState(false);
  const [aiSummary, setAiSummary] = useState('');

  const { data: email, isLoading } = api.gmail.getOne.useQuery(
    { entityId: selectedId! },
    { enabled: !!selectedId }
  );

  const markRead = api.gmail.markRead.useMutation();
  const archive = api.gmail.archive.useMutation();
  const summarize = api.ai.summarize.useMutation({
    onSuccess: (d) => setAiSummary(d.summary),
  });
  const draftReply = api.ai.draftReply.useMutation();

  if (!selectedId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center"
           style={{ background: 'var(--color-bg-0)' }}>
        <div className="text-center">
          <p className="text-title mb-1" style={{ color: 'var(--color-text-2)' }}>No email selected</p>
          <p className="text-small" style={{ color: 'var(--color-text-3)' }}>Press J/K to navigate · Enter to open</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ background: 'var(--color-bg-0)' }}>
        <Loader2 size={18} className="animate-spin" style={{ color: 'var(--color-accent)' }} />
      </div>
    );
  }

  const e = email as any;
  const subject = e?.data?.subject ?? e?.subject ?? '(no subject)';
  const from = e?.data?.from ?? e?.fromAddress ?? e?.from ?? '';
  const dateStr = e?.data?.date ?? e?.updated_at ?? e?.receivedAt;
  const date = dateStr ? new Date(dateStr) : new Date();
  const body = decodeBody(e?.payload) || e?.data?.body || e?.body || e?.data?.snippet || e?.snippet || '';

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative" style={{ background: 'var(--color-bg-0)' }}>
      <div
        className="flex items-center gap-2 px-6 py-3 border-b flex-shrink-0"
        style={{ borderColor: 'var(--color-border-0)', background: 'var(--color-bg-1)' }}
      >
        <button
          onClick={() => setSelectedId(null)}
          className="p-1.5 rounded transition-colors lg:hidden"
          style={{ color: 'var(--color-text-2)' }}
        >
          <ArrowLeft size={14} />
        </button>

        <div className="flex items-center gap-1 ml-auto">
          {[
            {
              icon: Cpu, label: 'AI Summary', shortcut: 'S',
              action: () => summarize.mutate({ subject, from, body }),
              loading: summarize.isPending,
            },
            {
              icon: Reply, label: 'Reply', shortcut: 'R',
              action: () => setShowReply(true),
            },
            {
              icon: Archive, label: 'Archive', shortcut: 'E',
              action: () => { archive.mutate({ entityId: selectedId }); setSelectedId(null); },
            },
          ].map(btn => (
            <button
              key={btn.label}
              onClick={btn.action}
              disabled={'loading' in btn ? btn.loading : false}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-micro transition-colors hover:opacity-80"
              style={{
                background: 'var(--color-bg-3)',
                color: 'var(--color-text-1)',
                border: '1px solid var(--color-border-1)',
              }}
              title={`${btn.label} (${btn.shortcut})`}
            >
              {'loading' in btn && btn.loading ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <btn.icon size={12} />
              )}
              {btn.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <h1 className="text-display mb-6" style={{ color: 'var(--color-text-0)' }}>{subject}</h1>
        
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-body font-semibold mb-0.5" style={{ color: 'var(--color-text-0)' }}>{from}</p>
            <p className="text-small" style={{ color: 'var(--color-text-2)' }}>to me</p>
          </div>
          <p className="text-small" style={{ color: 'var(--color-text-2)' }}>
            {format(date, 'MMM d, yyyy, h:mm a')}
          </p>
        </div>

        {aiSummary && (
          <div className="mb-8 p-4 rounded-lg" style={{ background: 'var(--color-bg-3)', border: '1px solid var(--color-border-1)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Cpu size={14} style={{ color: 'var(--color-accent)' }} />
              <span className="text-micro font-semibold" style={{ color: 'var(--color-accent)' }}>AI SUMMARY</span>
            </div>
            <p className="text-body" style={{ color: 'var(--color-text-0)' }}>{aiSummary}</p>
          </div>
        )}

        <div 
          className="text-body leading-relaxed whitespace-pre-wrap"
          style={{ color: 'var(--color-text-0)' }}
          dangerouslySetInnerHTML={{ __html: linkify(body) }}
        />
      </div>

      {showReply && (
        <ComposeModal 
          replyTo={{ from, subject: subject.startsWith('Re:') ? subject : `Re: ${subject}` }} 
          onClose={() => setShowReply(false)} 
        />
      )}
    </div>
  );
}
