'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Reply, Archive, Star, Sparkles, Loader2,
  ArrowLeft, Clock, MoreHorizontal, ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { api } from '@/trpc/react';
import { useEmailStore } from '@/hooks/useEmailStore';
import { decodeEmailBody, parseSenderName, parseSenderEmail } from '@/server/lib/emailUtils';
import { LoadingDots } from '@/components/ui/LoadingDots';
import { EmptyState } from '@/components/ui/EmptyState';
import { KBD } from '@/components/ui/KBD';
import { SnoozeMenu } from './SnoozeMenu';
import { ComposeModal } from './compose-modal';

function linkify(text: string): string {
  return text.replace(
    /(https?:\/\/[^\s<>)"]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" style="color:var(--accent-text);text-decoration:underline;text-underline-offset:2px">$1</a>'
  );
}

export function EmailDetail() {
  const { selectedId, setSelectedId, setReplyTo, setComposeOpen } = useEmailStore();
  const [showSnooze, setShowSnooze] = useState(false);
  const [showReply, setShowReply] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [draftBody, setDraftBody] = useState('');

  const { data: email, isLoading } = api.gmail.getOne.useQuery(
    { entityId: selectedId! },
    { enabled: !!selectedId }
  );

  const markRead = api.gmail.markRead.useMutation();
  const archive = api.gmail.archive.useMutation({
    onSuccess: () => { setSelectedId(null); toast.success('Archived'); },
  });
  const snooze = api.gmail.snooze.useMutation({
    onSuccess: () => { setSelectedId(null); toast.success('Snoozed'); }
  });
  const toggleStar = api.gmail.toggleStar.useMutation({
    onSuccess: () => toast.success((email as any)?.isStarred ? 'Unstarred' : 'Starred'),
  });
  const summarize = api.ai.summarize.useMutation({
    onSuccess: d => setAiSummary(d.summary),
  });
  const draftReply = api.ai.draftReply.useMutation({
    onSuccess: d => { setDraftBody(d.draft); setShowReply(true); },
  });

  // Auto-mark as read and get quick replies
  useEffect(() => {
    if (!selectedId || !email) return;
    markRead.mutate({ entityId: selectedId });
    setAiSummary('');
    setShowReply(false);
    setDraftBody('');
  }, [selectedId]);

  // Keyboard shortcuts
  useEffect(() => {
    const onArchive = () => archive.mutate({ entityId: selectedId! });
    const onReply = () => {
      const e = email as any;
      if (!e) return;
      draftReply.mutate({ subject: e.data?.subject ?? '', from: e.data?.from ?? '', body: decodeEmailBody(e.payload) || e.data?.body || '' });
    };
    const onStar = () => {
      const e = email as any;
      toggleStar.mutate({ entityId: selectedId!, starred: !e?.isStarred });
    };
    window.addEventListener('archive', onArchive);
    window.addEventListener('reply', onReply);
    window.addEventListener('star', onStar);
    return () => {
      window.removeEventListener('archive', onArchive);
      window.removeEventListener('reply', onReply);
      window.removeEventListener('star', onStar);
    };
  }, [selectedId, email]);

  if (!selectedId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center relative" style={{ background: 'var(--bg-0)' }}>
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.03)_0,transparent_50%)]" />
        <EmptyState
          icon={ArrowLeft}
          title="No message selected"
          description="Use J/K to navigate · Enter to open"
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center relative" style={{ background: 'var(--bg-0)' }}>
        <LoadingDots />
      </div>
    );
  }

  const e = email as any;
  const subject = e?.data?.subject ?? '(no subject)';
  const from = e?.data?.from ?? '';
  const date = e?.data?.date ?? e?.updated_at;
  const body = decodeEmailBody(e?.payload) || e?.data?.body || e?.data?.snippet || '';
  const senderEmail = parseSenderEmail(from);

  return (
    <motion.div
      className="flex-1 flex flex-col overflow-hidden relative"
      style={{ background: 'var(--bg-0)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
    >
      {/* Floating Toolbar Header */}
      <div
        className="absolute top-0 left-0 right-0 z-30 flex items-center gap-3 px-6 h-[60px]"
        style={{
          background: 'linear-gradient(180deg, rgba(3,3,4,0.95) 0%, rgba(3,3,4,0.85) 60%, rgba(3,3,4,0) 100%)',
          backdropFilter: 'var(--blur-md)',
          WebkitBackdropFilter: 'var(--blur-md)',
          borderBottom: '1px solid rgba(255,255,255,0.03)',
        }}
      >
        <button
          onClick={() => setSelectedId(null)}
          className="p-2 rounded-[8px] transition-all duration-200 lg:hidden hover:bg-white/5 active:scale-[0.95]"
          style={{ color: 'var(--text-1)' }}
        >
          <ArrowLeft size={16} />
        </button>

        <div className="flex items-center gap-2 ml-auto relative">
          <button
            onClick={() => summarize.mutate({ subject, from, body })}
            disabled={summarize.isPending}
            className="flex items-center gap-2 px-3 py-1.5 rounded-[8px] t-small font-medium transition-all duration-200"
            style={{
              background: 'var(--bg-1)',
              color: 'var(--text-1)',
              border: '1px solid var(--border-1)',
              boxShadow: 'var(--shadow-sm)'
            }}
            onMouseEnter={ev => {
              (ev.currentTarget.style.color = 'var(--text-0)');
              (ev.currentTarget.style.borderColor = 'var(--accent-border)');
            }}
            onMouseLeave={ev => {
              (ev.currentTarget.style.color = 'var(--text-1)');
              (ev.currentTarget.style.borderColor = 'var(--border-1)');
            }}
            title="AI Summary (S)"
          >
            {summarize.isPending ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} style={{ color: 'var(--accent)' }} />}
            Summary
          </button>

          <button
            onClick={() => setShowReply(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-[8px] t-small font-medium transition-all duration-200"
            style={{
              background: 'var(--bg-1)',
              color: 'var(--text-1)',
              border: '1px solid var(--border-1)',
              boxShadow: 'var(--shadow-sm)'
            }}
            onMouseEnter={ev => {
              (ev.currentTarget.style.color = 'var(--text-0)');
              (ev.currentTarget.style.borderColor = 'var(--border-2)');
            }}
            onMouseLeave={ev => {
              (ev.currentTarget.style.color = 'var(--text-1)');
              (ev.currentTarget.style.borderColor = 'var(--border-1)');
            }}
            title="Reply (R)"
          >
            <Reply size={13} /> Reply
          </button>

          <div className="relative">
            <button
              onClick={() => setShowSnooze(!showSnooze)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-[8px] t-small font-medium transition-all duration-200"
              style={{
                background: 'var(--bg-1)',
                color: 'var(--text-1)',
                border: '1px solid var(--border-1)',
                boxShadow: 'var(--shadow-sm)'
              }}
              onMouseEnter={ev => {
                (ev.currentTarget.style.color = 'var(--text-0)');
                (ev.currentTarget.style.borderColor = 'var(--border-2)');
              }}
              onMouseLeave={ev => {
                (ev.currentTarget.style.color = 'var(--text-1)');
                (ev.currentTarget.style.borderColor = 'var(--border-1)');
              }}
              title="Snooze"
            >
              <Clock size={13} /> Snooze
            </button>
            
            {showSnooze && (
              <SnoozeMenu 
                onSnooze={(until) => snooze.mutate({ entityId: selectedId, snoozeUntil: until })} 
                onClose={() => setShowSnooze(false)} 
              />
            )}
          </div>

          <button
            onClick={() => archive.mutate({ entityId: selectedId })}
            className="flex items-center gap-2 px-3 py-1.5 rounded-[8px] t-small font-medium transition-all duration-200"
            style={{
              background: 'var(--bg-1)',
              color: 'var(--text-1)',
              border: '1px solid var(--border-1)',
              boxShadow: 'var(--shadow-sm)'
            }}
            onMouseEnter={ev => {
              (ev.currentTarget.style.color = 'var(--text-0)');
              (ev.currentTarget.style.borderColor = 'var(--border-2)');
            }}
            onMouseLeave={ev => {
              (ev.currentTarget.style.color = 'var(--text-1)');
              (ev.currentTarget.style.borderColor = 'var(--border-1)');
            }}
            title="Archive (E)"
          >
            <Archive size={13} /> Archive
          </button>

          <button
            onClick={() => toggleStar.mutate({ entityId: selectedId, starred: !e?.isStarred })}
            className="flex items-center gap-2 px-3 py-1.5 rounded-[8px] t-small font-medium transition-all duration-200"
            style={{
              background: 'var(--bg-1)',
              color: e?.isStarred ? 'var(--accent)' : 'var(--text-1)',
              border: '1px solid',
              borderColor: e?.isStarred ? 'var(--accent-border)' : 'var(--border-1)',
              boxShadow: e?.isStarred ? 'var(--shadow-glow)' : 'var(--shadow-sm)'
            }}
            onMouseEnter={ev => {
              if (!e?.isStarred) {
                (ev.currentTarget.style.color = 'var(--text-0)');
                (ev.currentTarget.style.borderColor = 'var(--border-2)');
              }
            }}
            onMouseLeave={ev => {
              if (!e?.isStarred) {
                (ev.currentTarget.style.color = 'var(--text-1)');
                (ev.currentTarget.style.borderColor = 'var(--border-1)');
              }
            }}
            title="Star (S)"
          >
            <Star size={13} fill={e?.isStarred ? 'var(--accent)' : 'none'} />
          </button>
        </div>
      </div>
      
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pt-[80px] px-10 pb-16">
        <div className="max-w-[720px] mx-auto">
          <h1 className="t-display mb-10 tracking-tight" style={{ color: 'var(--text-0)' }}>{subject}</h1>
          
          <div className="flex items-start justify-between mb-10 pb-6" style={{ borderBottom: '1px solid var(--border-0)' }}>
            <div className="flex items-center gap-3.5">
              <div 
                className="w-11 h-11 rounded-full flex items-center justify-center t-title"
                style={{ background: 'var(--bg-2)', color: 'var(--text-0)', border: '1px solid var(--border-1)', boxShadow: 'var(--shadow-sm)' }}
              >
                {parseSenderName(from).charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="t-body font-medium mb-0.5" style={{ color: 'var(--text-0)' }}>
                  {parseSenderName(from)} <span className="t-small font-normal opacity-60 ml-1">&lt;{senderEmail}&gt;</span>
                </p>
                <p className="t-small" style={{ color: 'var(--text-2)' }}>to me</p>
              </div>
            </div>
            <p className="t-small" style={{ color: 'var(--text-2)' }}>
              {format(date ? new Date(date) : new Date(), 'MMM d, yyyy, h:mm a')}
            </p>
          </div>

          <AnimatePresence>
            {aiSummary && (
              <motion.div 
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="mb-10 p-6 rounded-[16px] relative overflow-hidden" 
                style={{ 
                  background: 'var(--bg-1)', 
                  border: '1px solid var(--accent-border)',
                  boxShadow: 'var(--shadow-md)'
                }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)] opacity-[0.03] blur-[30px] rounded-full pointer-events-none" />
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={15} style={{ color: 'var(--accent)' }} />
                  <span className="t-label" style={{ color: 'var(--accent)' }}>AI SUMMARY</span>
                </div>
                <p className="t-body leading-relaxed text-[15px]" style={{ color: 'var(--text-0)' }}>{aiSummary}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div 
            className="t-body leading-[1.8] whitespace-pre-wrap"
            style={{ color: 'var(--text-0)', fontSize: '15px' }}
            dangerouslySetInnerHTML={{ __html: linkify(body) }}
          />
        </div>
      </div>

      {showReply && (
        <ComposeModal 
          replyTo={{ from, subject: subject.startsWith('Re:') ? subject : `Re: ${subject}`, body: draftBody }} 
          onClose={() => setShowReply(false)} 
        />
      )}
    </motion.div>
  );
}
