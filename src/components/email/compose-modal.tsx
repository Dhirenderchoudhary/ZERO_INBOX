'use client';
import { useState, useEffect } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/trpc/react';
import { KBD } from '@/components/ui/KBD';

interface ComposeModalProps {
  replyTo?: { from: string; subject: string; body?: string };
  onClose: () => void;
}

export function ComposeModal({ replyTo, onClose }: ComposeModalProps) {
  const [to, setTo] = useState(replyTo ? replyTo.from : '');
  const [subject, setSubject] = useState(replyTo ? replyTo.subject : '');
  const [body, setBody] = useState(replyTo?.body ?? '');

  const send = api.gmail.send.useMutation({
    onSuccess: () => onClose(),
  });

  useEffect(() => {
    const handleClose = () => onClose();
    const handleCmdEnter = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        if (to && body && !send.isPending) {
          send.mutate({ to, subject, body });
        }
      }
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('close-modals', handleClose);
    window.addEventListener('keydown', handleCmdEnter);
    return () => {
      window.removeEventListener('close-modals', handleClose);
      window.removeEventListener('keydown', handleCmdEnter);
    };
  }, [onClose, to, subject, body, send]);

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.98 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="fixed bottom-0 right-16 w-[520px] h-[600px] max-h-[85vh] shadow-2xl rounded-t-[14px] flex flex-col z-50 overflow-hidden"
        style={{ 
          background: 'var(--bg-modal)', 
          border: '1px solid var(--border-2)',
          boxShadow: '0 40px 100px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04) inset'
        }}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b"
             style={{ borderColor: 'var(--border-0)', background: 'var(--bg-1)' }}>
          <span className="t-small font-medium" style={{ color: 'var(--text-0)' }}>
            {replyTo ? 'Reply' : 'New Message'}
          </span>
          <button 
            onClick={onClose} 
            className="p-1 rounded transition-colors hover:bg-white/5" 
            style={{ color: 'var(--text-2)' }}
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex flex-col flex-1">
          <div className="px-5 py-2.5 border-b flex items-center" style={{ borderColor: 'var(--border-0)' }}>
            <span className="t-small w-14" style={{ color: 'var(--text-2)' }}>To:</span>
            <input 
              value={to} 
              onChange={(e) => setTo(e.target.value)}
              className="flex-1 bg-transparent outline-none t-body font-medium"
              style={{ color: 'var(--text-0)' }}
              autoFocus={!replyTo}
            />
          </div>
          
          <div className="px-5 py-2.5 border-b flex items-center" style={{ borderColor: 'var(--border-0)' }}>
            <span className="t-small w-14" style={{ color: 'var(--text-2)' }}>Subject:</span>
            <input 
              value={subject} 
              onChange={(e) => setSubject(e.target.value)}
              className="flex-1 bg-transparent outline-none t-body font-medium"
              style={{ color: 'var(--text-0)' }}
            />
          </div>

          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="flex-1 p-5 bg-transparent outline-none t-body resize-none leading-relaxed"
            style={{ color: 'var(--text-0)' }}
            autoFocus={!!replyTo}
          />
        </div>

        <div className="px-5 py-3 flex items-center justify-between border-t" style={{ borderColor: 'var(--border-0)', background: 'var(--bg-1)' }}>
          <button
            onClick={() => send.mutate({ to, subject, body })}
            disabled={!to || !body || send.isPending}
            className="flex items-center gap-2 px-3 py-1.5 rounded-[6px] t-small font-semibold transition-all duration-100 disabled:opacity-50 active:scale-[0.98]"
            style={{ background: 'var(--accent)', color: '#000' }}
          >
            {send.isPending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            Send
          </button>
          
          <div className="flex items-center gap-1 opacity-70">
            <span className="t-small" style={{ color: 'var(--text-3)' }}>Send</span>
            <KBD>⌘↵</KBD>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
