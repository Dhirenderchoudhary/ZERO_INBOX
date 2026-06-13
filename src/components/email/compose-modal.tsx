'use client';
import { useState, useEffect } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import { api } from '@/trpc/react';

interface ComposeModalProps {
  replyTo?: { from: string; subject: string };
  onClose: () => void;
}

export function ComposeModal({ replyTo, onClose }: ComposeModalProps) {
  const [to, setTo] = useState(replyTo ? replyTo.from : '');
  const [subject, setSubject] = useState(replyTo ? replyTo.subject : '');
  const [body, setBody] = useState('');

  const send = api.gmail.send.useMutation({
    onSuccess: () => onClose(),
  });

  useEffect(() => {
    const handleClose = () => onClose();
    window.addEventListener('close-modals', handleClose);
    return () => window.removeEventListener('close-modals', handleClose);
  }, [onClose]);

  return (
    <div className="fixed bottom-0 right-16 w-[500px] h-[600px] max-h-[80vh] shadow-2xl rounded-t-xl overflow-hidden flex flex-col z-50"
         style={{ background: 'var(--color-bg-modal)', border: '1px solid var(--color-border-1)' }}>
      
      <div className="flex items-center justify-between px-4 py-2 border-b"
           style={{ borderColor: 'var(--color-border-0)', background: 'var(--color-bg-2)' }}>
        <span className="text-small font-semibold" style={{ color: 'var(--color-text-0)' }}>
          {replyTo ? 'Reply' : 'New Message'}
        </span>
        <button onClick={onClose} className="p-1 rounded hover:opacity-80" style={{ color: 'var(--color-text-2)' }}>
          <X size={14} />
        </button>
      </div>

      <div className="flex flex-col flex-1">
        <div className="px-4 py-2 border-b flex items-center" style={{ borderColor: 'var(--color-border-0)' }}>
          <span className="text-small w-12" style={{ color: 'var(--color-text-2)' }}>To:</span>
          <input 
            value={to} 
            onChange={(e) => setTo(e.target.value)}
            className="flex-1 bg-transparent outline-none text-small"
            style={{ color: 'var(--color-text-0)' }}
            autoFocus={!replyTo}
          />
        </div>
        
        <div className="px-4 py-2 border-b flex items-center" style={{ borderColor: 'var(--color-border-0)' }}>
          <span className="text-small w-12" style={{ color: 'var(--color-text-2)' }}>Subject:</span>
          <input 
            value={subject} 
            onChange={(e) => setSubject(e.target.value)}
            className="flex-1 bg-transparent outline-none text-small font-medium"
            style={{ color: 'var(--color-text-0)' }}
          />
        </div>

        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="flex-1 p-4 bg-transparent outline-none text-body resize-none"
          style={{ color: 'var(--color-text-0)' }}
          autoFocus={!!replyTo}
        />
      </div>

      <div className="px-4 py-3 flex items-center justify-between border-t" style={{ borderColor: 'var(--color-border-0)', background: 'var(--color-bg-2)' }}>
        <button
          onClick={() => send.mutate({ to, subject, body })}
          disabled={!to || !body || send.isPending}
          className="flex items-center gap-2 px-4 py-1.5 rounded text-small font-medium transition-colors hover:opacity-90 disabled:opacity-50"
          style={{ background: 'var(--color-accent)', color: '#000' }}
        >
          {send.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          Send
        </button>
      </div>
    </div>
  );
}
