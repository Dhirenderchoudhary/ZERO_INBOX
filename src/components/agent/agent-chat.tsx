'use client';
import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, CheckCircle2, Sparkles } from 'lucide-react';
import { api } from '@/trpc/react';
import { motion, AnimatePresence } from 'framer-motion';

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
    <div className="flex-1 flex flex-col items-center relative overflow-hidden" style={{ background: 'var(--bg-0)' }}>
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--accent)] opacity-[0.015] blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-[760px] h-full flex flex-col relative z-10">
        
        {/* Header */}
        <div className="px-6 py-8 flex-shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[8px] flex items-center justify-center" style={{ background: 'var(--accent-glow)', border: '1px solid var(--accent-border)' }}>
              <Bot size={16} style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <h1 className="t-title" style={{ color: 'var(--text-0)' }}>FlowMail Agent</h1>
              <p className="t-small opacity-60" style={{ color: 'var(--text-2)' }}>Native control for Inbox & Calendar</p>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto px-6 space-y-8 scrollbar-none pb-4">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center pb-20">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              >
                <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center relative">
                  <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ background: 'var(--accent)' }} />
                  <div className="absolute inset-0 rounded-full" style={{ background: 'var(--accent-glow)', border: '1px solid var(--accent-border)' }} />
                  <Sparkles size={24} style={{ color: 'var(--accent)' }} className="relative z-10" />
                </div>
                <h2 className="t-display mb-3" style={{ color: 'var(--text-0)' }}>How can I help?</h2>
                <p className="t-body max-w-sm mx-auto" style={{ color: 'var(--text-2)' }}>
                  I can read emails, draft replies, and manage your calendar entirely natively.
                </p>
                <div className="mt-8 flex flex-col gap-2">
                  <div className="px-4 py-2 rounded-full t-small inline-block mx-auto" style={{ background: 'var(--bg-2)', color: 'var(--text-1)', border: '1px solid var(--border-1)' }}>
                    "Email John that I'm running 5 mins late"
                  </div>
                  <div className="px-4 py-2 rounded-full t-small inline-block mx-auto" style={{ background: 'var(--bg-2)', color: 'var(--text-1)', border: '1px solid var(--border-1)' }}>
                    "Clear out my newsletters"
                  </div>
                </div>
              </motion.div>
            </div>
          )}
          
          <AnimatePresence>
            {messages.map((msg, idx) => (
              <motion.div 
                key={idx} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1" 
                  style={{ 
                    background: msg.role === 'user' ? 'var(--bg-3)' : 'var(--accent-glow)', 
                    border: msg.role === 'user' ? '1px solid var(--border-1)' : '1px solid var(--accent-border)',
                    boxShadow: msg.role === 'user' ? 'var(--shadow-sm)' : 'var(--shadow-glow)'
                  }}
                >
                  {msg.role === 'user' ? <User size={14} style={{ color: 'var(--text-1)' }}/> : <Bot size={14} style={{ color: 'var(--accent)' }}/>}
                </div>
                
                <div className={`flex flex-col gap-2 max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div 
                    className="px-5 py-3 rounded-[18px] t-body leading-relaxed" 
                    style={{ 
                      background: msg.role === 'user' ? 'var(--bg-2)' : 'transparent', 
                      color: 'var(--text-0)',
                      border: msg.role === 'user' ? '1px solid var(--border-1)' : 'none'
                    }}
                  >
                    {msg.content}
                  </div>
                  
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="flex flex-col gap-2 mt-1 px-4">
                      {msg.actions.map((action, i) => (
                        <div 
                          key={i} 
                          className="flex items-center gap-2 px-3 py-1.5 rounded-[8px] t-small font-medium" 
                          style={{ 
                            background: 'var(--bg-1)', 
                            color: 'var(--accent-text)', 
                            border: '1px solid var(--border-1)',
                            boxShadow: 'var(--shadow-sm)'
                          }}
                        >
                          <CheckCircle2 size={12} className="opacity-70" />
                          {action}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {chat.isPending && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
               <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1" style={{ background: 'var(--accent-glow)', border: '1px solid var(--accent-border)', boxShadow: 'var(--shadow-glow)' }}>
                <Bot size={14} style={{ color: 'var(--accent)' }}/>
              </div>
              <div className="px-4 py-3 rounded-2xl t-body flex items-center gap-3" style={{ color: 'var(--text-2)' }}>
                <Loader2 size={14} className="animate-spin" /> Thinking natively...
              </div>
            </motion.div>
          )}
          <div ref={bottomRef} className="h-4" />
        </div>

        {/* Input Bar */}
        <div className="p-6 pt-2 pb-8 flex-shrink-0">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (!input.trim() || chat.isPending) return;
              setMessages(prev => [...prev, { role: 'user', content: input }]);
              chat.mutate({ message: input, history: messages.map(m => ({ role: m.role, content: m.content })) });
              setInput('');
            }}
            className="flex items-center gap-3 rounded-[16px] px-5 py-3 transition-all duration-300 relative group"
            style={{ 
              background: 'var(--bg-1)',
              border: '1px solid var(--border-1)', 
              boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.02) inset' 
            }}
            onFocusCapture={e => {
              (e.currentTarget.style.borderColor = 'var(--accent-border)');
              (e.currentTarget.style.boxShadow = 'var(--shadow-glow), 0 8px 32px rgba(0,0,0,0.6)');
            }}
            onBlurCapture={e => {
              (e.currentTarget.style.borderColor = 'var(--border-1)');
              (e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.02) inset');
            }}
          >
            <Sparkles size={18} style={{ color: 'var(--text-2)' }} className="group-focus-within:text-[var(--accent)] transition-colors duration-300" />
            <input 
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Tell FlowMail what to do..."
              className="flex-1 bg-transparent outline-none t-title py-1"
              style={{ color: 'var(--text-0)', fontWeight: 400 }}
              autoFocus
            />
            <button 
              type="submit"
              disabled={!input.trim() || chat.isPending}
              className="p-2 rounded-[8px] transition-all duration-200 disabled:opacity-30 disabled:scale-100 hover:scale-110 active:scale-95"
              style={{ background: input.trim() ? 'var(--accent)' : 'var(--bg-3)', color: input.trim() ? '#000' : 'var(--text-2)' }}
            >
              <Send size={16} className={chat.isPending ? 'animate-pulse' : ''} />
            </button>
          </form>
          <div className="text-center mt-3">
            <span className="t-mono" style={{ color: 'var(--text-3)', fontSize: '10px' }}>
              Powered by Mistral & Corsair API
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
