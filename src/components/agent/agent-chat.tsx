'use client';
import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, CheckCircle2 } from 'lucide-react';
import { api } from '@/trpc/react';

export function AgentChat() {
  const [messages, setMessages] = useState<{role: 'user'|'assistant', content: string, actions?: string[]}[]>([]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const chat = api.ai.agentChat.useMutation({
    onSuccess: (data) => {
      setMessages(prev => [
        ...prev, 
        { role: 'assistant', content: data.reply, actions: data.actionsExecuted }
      ]);
    }
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chat.isPending]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden mx-auto w-full max-w-3xl border-x" style={{ background: 'var(--color-bg-0)', borderColor: 'var(--color-border-0)' }}>
      <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--color-border-0)', background: 'var(--color-bg-1)' }}>
        <h1 className="text-title flex items-center gap-2" style={{ color: 'var(--color-text-0)' }}>
          <Bot size={16} style={{ color: 'var(--color-accent)' }} /> FlowMail Agent
        </h1>
        <p className="text-small" style={{ color: 'var(--color-text-2)' }}>Controls your Inbox and Calendar natively.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <Bot size={32} style={{ color: 'var(--color-accent)' }} className="mb-4 opacity-50" />
            <p className="text-body" style={{ color: 'var(--color-text-1)' }}>How can I help manage your workflow today?</p>
            <p className="text-small mt-2" style={{ color: 'var(--color-text-3)' }}>Try: "Email John that I'm running 5 mins late"</p>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: msg.role === 'user' ? 'var(--color-bg-3)' : 'var(--color-accent-glow)', border: msg.role === 'user' ? 'none' : '1px solid var(--color-accent-border)' }}>
              {msg.role === 'user' ? <User size={14} style={{ color: 'var(--color-text-2)' }}/> : <Bot size={14} style={{ color: 'var(--color-accent)' }}/>}
            </div>
            <div className={`flex flex-col gap-2 max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className="px-4 py-2.5 rounded-2xl text-body" style={{ background: msg.role === 'user' ? 'var(--color-bg-3)' : 'transparent', color: 'var(--color-text-0)' }}>
                {msg.content}
              </div>
              
              {msg.actions && msg.actions.length > 0 && (
                <div className="flex flex-col gap-1.5 mt-1">
                  {msg.actions.map((action, i) => (
                    <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded text-micro font-medium" style={{ background: 'var(--color-accent-glow)', color: 'var(--color-accent)', border: '1px solid var(--color-accent-border)' }}>
                      <CheckCircle2 size={10} />
                      {action}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {chat.isPending && (
          <div className="flex gap-4">
             <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-accent-glow)', border: '1px solid var(--color-accent-border)' }}>
              <Bot size={14} style={{ color: 'var(--color-accent)' }}/>
            </div>
            <div className="px-4 py-2.5 rounded-2xl text-body flex items-center gap-2" style={{ color: 'var(--color-text-2)' }}>
              <Loader2 size={12} className="animate-spin" /> Thinking...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 border-t" style={{ borderColor: 'var(--color-border-0)', background: 'var(--color-bg-1)' }}>
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            if (!input.trim() || chat.isPending) return;
            setMessages(prev => [...prev, { role: 'user', content: input }]);
            chat.mutate({ message: input, history: messages.map(m => ({ role: m.role, content: m.content })) });
            setInput('');
          }}
          className="flex items-center gap-2 bg-transparent rounded-xl px-4 py-2"
          style={{ border: '1px solid var(--color-border-1)', background: 'var(--color-bg-2)' }}
        >
          <input 
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Tell FlowMail what to do..."
            className="flex-1 bg-transparent outline-none text-body py-1.5"
            style={{ color: 'var(--color-text-0)' }}
          />
          <button 
            type="submit"
            disabled={!input.trim() || chat.isPending}
            className="p-1.5 rounded transition-colors hover:opacity-80 disabled:opacity-50"
            style={{ color: 'var(--color-accent)' }}
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
