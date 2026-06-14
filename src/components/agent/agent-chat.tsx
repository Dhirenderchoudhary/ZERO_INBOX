"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, CheckCircle2, Loader2, Send, Sparkles, User } from "lucide-react";
import { api } from "@/trpc/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const suggestions = [
  "Summarize my urgent emails",
  "Draft follow-ups from yesterday",
  "Find time for a 30 minute sync",
  "Archive low-signal newsletters",
];

export function AgentChat() {
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string; actions?: string[] }[]
  >([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const chat = api.ai.agentChat.useMutation({
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
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chat.isPending]);

  const submit = (value = input) => {
    if (!value.trim() || chat.isPending) return;
    setMessages((prev) => [...prev, { role: "user", content: value }]);
    chat.mutate({
      message: value,
      history: messages.map((m) => ({ role: m.role, content: m.content })),
    });
    setInput("");
  };

  return (
    <div className="h-full overflow-hidden p-4 sm:p-6 lg:p-8">
      <div className="border-border/70 bg-card mx-auto flex h-full max-w-5xl flex-col overflow-hidden rounded-2xl border shadow-sm">
        <div className="border-border/70 border-b p-5">
          <Badge variant="outline" className="mb-3 rounded-full">
            <Sparkles size={13} /> AI operator
          </Badge>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                What should ZERO INBOX do?
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Control email and calendar workflows with natural language.
              </p>
            </div>
            <Badge variant="secondary" className="w-fit rounded-full">
              Mistral + Corsair tools
            </Badge>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="bg-primary text-primary-foreground shadow-primary/10 mb-5 flex size-16 items-center justify-center rounded-2xl shadow-lg">
                <Bot size={28} />
              </div>
              <h3 className="text-2xl font-semibold tracking-tight">
                Delegate the busywork.
              </h3>
              <p className="text-muted-foreground mt-2 max-w-md text-sm leading-6">
                Ask the agent to summarize, draft, schedule, triage, or execute
                routine communication tasks.
              </p>
              <div className="mt-6 grid w-full max-w-2xl gap-2 sm:grid-cols-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => submit(suggestion)}
                    className="border-border/70 bg-background/70 hover:bg-muted rounded-xl border p-3 text-left text-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-6">
            <AnimatePresence>
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  <div
                    className={`flex size-9 shrink-0 items-center justify-center rounded-full ${msg.role === "user" ? "bg-muted" : "bg-primary text-primary-foreground"}`}
                  >
                    {msg.role === "user" ? (
                      <User size={16} />
                    ) : (
                      <Bot size={16} />
                    )}
                  </div>
                  <div
                    className={`max-w-[82%] ${msg.role === "user" ? "items-end" : "items-start"}`}
                  >
                    <Card
                      className={
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-background/70"
                      }
                    >
                      <CardContent className="p-4 text-sm leading-7">
                        {msg.content}
                      </CardContent>
                    </Card>
                    {msg.actions && msg.actions.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {msg.actions.map((action, i) => (
                          <div
                            key={i}
                            className="border-border/70 flex items-center gap-2 rounded-xl border bg-emerald-500/10 px-3 py-2 text-xs text-emerald-600 dark:text-emerald-300"
                          >
                            <CheckCircle2 size={13} /> {action}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {chat.isPending && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3"
              >
                <div className="bg-primary text-primary-foreground flex size-9 shrink-0 items-center justify-center rounded-full">
                  <Bot size={16} />
                </div>
                <div className="bg-muted text-muted-foreground flex items-center gap-2 rounded-xl px-4 py-3 text-sm">
                  <Loader2 size={15} className="animate-spin" /> Thinking
                  through tools...
                </div>
              </motion.div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        <div className="border-border/70 bg-muted/30 border-t p-4 sm:p-5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
            className="border-border/70 bg-background focus-within:ring-ring/40 flex items-end gap-3 rounded-2xl border p-2 shadow-sm focus-within:ring-2"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tell the agent what outcome you want..."
              className="placeholder:text-muted-foreground max-h-32 min-h-10 flex-1 resize-none bg-transparent px-3 py-2 text-sm outline-none"
              rows={1}
            />
            <Button
              type="submit"
              disabled={!input.trim() || chat.isPending}
              size="icon"
              className="rounded-xl"
            >
              <Send size={16} />
              <span className="sr-only">Send</span>
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
