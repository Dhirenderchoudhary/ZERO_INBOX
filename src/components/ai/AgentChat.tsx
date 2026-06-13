"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, CheckCircle2, Loader2 } from "lucide-react";
import { api } from "@/trpc/react";

export function AgentChat() {
  const [messages, setMessages] = useState<{role: 'user'|'assistant', content: string, actions?: string[]}[]>([]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const chatMutation = api.ai.agentChat.useMutation({
    onSuccess: (data) => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.reply,
        actions: data.actionsExecuted
      }]);
    }
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatMutation.isPending]);

  const handleSend = () => {
    if (!input.trim() || chatMutation.isPending) return;
    
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    chatMutation.mutate({
      message: input,
      history: messages.map(m => ({ role: m.role, content: m.content }))
    });
    setInput("");
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 font-sans border-l border-zinc-800 shadow-[-8px_0_24px_-8px_rgba(0,0,0,0.5)]">
      <div className="p-4 border-b border-zinc-800 flex items-center gap-3 bg-zinc-950 z-10 shrink-0">
        <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-inner">
          <Bot className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h2 className="font-semibold text-zinc-100 text-lg tracking-tight">FlowMail Agent</h2>
          <p className="text-xs text-zinc-500 font-mono flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
            Online & ready
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 relative bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900/20 via-zinc-950 to-zinc-950">
        {messages.length === 0 && (
          <div className="m-auto max-w-sm text-center">
            <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mx-auto mb-5 border border-zinc-800 shadow-xl shadow-black/50">
              <Bot className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-zinc-100 font-medium mb-2 text-xl tracking-tight">How can I help you today?</h3>
            <p className="text-sm text-zinc-500 mb-8 leading-relaxed">I can read your emails, send messages, and manage your calendar natively.</p>
            
            <div className="flex flex-col gap-3">
              <button onClick={() => setInput("What meetings do I have tomorrow?")} className="text-sm px-5 py-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-emerald-400 hover:border-emerald-500/40 hover:bg-zinc-800/80 transition-all text-left shadow-sm">
                "What meetings do I have tomorrow?"
              </button>
              <button onClick={() => setInput("Draft an email to john@example.com about the project update")} className="text-sm px-5 py-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-emerald-400 hover:border-emerald-500/40 hover:bg-zinc-800/80 transition-all text-left shadow-sm">
                "Draft an email to john@example.com..."
              </button>
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${m.role === 'user' ? 'bg-zinc-800 border border-zinc-700' : 'bg-emerald-500/10 border border-emerald-500/20'}`}>
              {m.role === 'user' ? <User className="w-4 h-4 text-zinc-300" /> : <Bot className="w-4 h-4 text-emerald-400" />}
            </div>
            
            <div className={`flex flex-col gap-2 max-w-[80%] ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`px-5 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${m.role === 'user' ? 'bg-emerald-500 text-black font-medium' : 'bg-zinc-900 border border-zinc-800 text-zinc-200 whitespace-pre-wrap'}`}>
                {m.content}
              </div>
              
              {m.actions && m.actions.length > 0 && (
                <div className="flex flex-col gap-1.5 mt-1 w-full">
                  {m.actions.map((act, actIdx) => (
                    <div key={actIdx} className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-2 rounded-lg border border-emerald-500/20 shadow-sm">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      {act}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {chatMutation.isPending && (
          <div className="flex gap-4 flex-row">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="px-5 py-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center gap-1.5 shadow-sm">
              <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" />
              <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="p-4 border-t border-zinc-800 bg-zinc-950 z-10 shrink-0">
        <div className="relative flex items-center max-w-4xl mx-auto">
          <input
            autoFocus
            className="w-full bg-zinc-900 border border-zinc-800 rounded-full pl-6 pr-14 py-3.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500/50 transition-colors shadow-inner"
            placeholder="Ask FlowMail Agent to do something..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || chatMutation.isPending}
            className="absolute right-2 p-2.5 rounded-full bg-emerald-500 text-black hover:bg-emerald-600 disabled:opacity-50 disabled:bg-zinc-800 disabled:text-zinc-500 transition-all shadow-md"
          >
            {chatMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-[1px]" />}
          </button>
        </div>
      </div>
    </div>
  );
}
