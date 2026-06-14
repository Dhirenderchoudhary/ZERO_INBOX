"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, CheckCircle2, Loader2 } from "lucide-react";
import { api } from "@/trpc/react";

export function AgentChat() {
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string; actions?: string[] }[]
  >([]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const chatMutation = api.ai.agentChat.useMutation({
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply,
          actions: data.actionsExecuted,
        },
      ]);
    },
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatMutation.isPending]);

  const handleSend = () => {
    if (!input.trim() || chatMutation.isPending) return;

    setMessages((prev) => [...prev, { role: "user", content: input }]);
    chatMutation.mutate({
      message: input,
      history: messages.map((m) => ({ role: m.role, content: m.content })),
    });
    setInput("");
  };

  return (
    <div className="flex h-full flex-col border-l border-zinc-800 bg-zinc-950 font-sans shadow-[-8px_0_24px_-8px_rgba(0,0,0,0.5)]">
      <div className="z-10 flex shrink-0 items-center gap-3 border-b border-zinc-800 bg-zinc-950 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 shadow-inner">
          <Bot className="h-5 w-5 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-zinc-100">
            FlowMail Agent
          </h2>
          <p className="flex items-center gap-1.5 font-mono text-xs text-zinc-500">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            Online & ready
          </p>
        </div>
      </div>

      <div className="relative flex flex-1 flex-col gap-6 overflow-y-auto bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900/20 via-zinc-950 to-zinc-950 p-6">
        {messages.length === 0 && (
          <div className="m-auto max-w-sm text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 shadow-xl shadow-black/50">
              <Bot className="h-8 w-8 text-emerald-400" />
            </div>
            <h3 className="mb-2 text-xl font-medium tracking-tight text-zinc-100">
              How can I help you today?
            </h3>
            <p className="mb-8 text-sm leading-relaxed text-zinc-500">
              I can read your emails, send messages, and manage your calendar
              natively.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => setInput("What meetings do I have tomorrow?")}
                className="rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-3.5 text-left text-sm text-zinc-300 shadow-sm transition-all hover:border-emerald-500/40 hover:bg-zinc-800/80 hover:text-emerald-400"
              >
                "What meetings do I have tomorrow?"
              </button>
              <button
                onClick={() =>
                  setInput(
                    "Draft an email to john@example.com about the project update",
                  )
                }
                className="rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-3.5 text-left text-sm text-zinc-300 shadow-sm transition-all hover:border-emerald-500/40 hover:bg-zinc-800/80 hover:text-emerald-400"
              >
                "Draft an email to john@example.com..."
              </button>
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex gap-4 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm ${m.role === "user" ? "border border-zinc-700 bg-zinc-800" : "border border-emerald-500/20 bg-emerald-500/10"}`}
            >
              {m.role === "user" ? (
                <User className="h-4 w-4 text-zinc-300" />
              ) : (
                <Bot className="h-4 w-4 text-emerald-400" />
              )}
            </div>

            <div
              className={`flex max-w-[80%] flex-col gap-2 ${m.role === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`rounded-2xl px-5 py-3 text-sm leading-relaxed shadow-sm ${m.role === "user" ? "bg-emerald-500 font-medium text-black" : "border border-zinc-800 bg-zinc-900 whitespace-pre-wrap text-zinc-200"}`}
              >
                {m.content}
              </div>

              {m.actions && m.actions.length > 0 && (
                <div className="mt-1 flex w-full flex-col gap-1.5">
                  {m.actions.map((act, actIdx) => (
                    <div
                      key={actIdx}
                      className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 font-mono text-xs text-emerald-400 shadow-sm"
                    >
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      {act}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {chatMutation.isPending && (
          <div className="flex flex-row gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10">
              <Bot className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="flex items-center gap-1.5 rounded-2xl border border-zinc-800 bg-zinc-900 px-5 py-4 shadow-sm">
              <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-500" />
              <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-500 [animation-delay:0.2s]" />
              <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-500 [animation-delay:0.4s]" />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="z-10 shrink-0 border-t border-zinc-800 bg-zinc-950 p-4">
        <div className="relative mx-auto flex max-w-4xl items-center">
          <input
            autoFocus
            className="w-full rounded-full border border-zinc-800 bg-zinc-900 py-3.5 pr-14 pl-6 text-sm text-zinc-100 shadow-inner transition-colors placeholder:text-zinc-500 focus:border-emerald-500/50 focus:outline-none"
            placeholder="Ask FlowMail Agent to do something..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || chatMutation.isPending}
            className="absolute right-2 rounded-full bg-emerald-500 p-2.5 text-black shadow-md transition-all hover:bg-emerald-600 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:opacity-50"
          >
            {chatMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="ml-[1px] h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
