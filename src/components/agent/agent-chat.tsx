"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bot,
  CheckCircle2,
  Loader2,
  Send,
  Sparkles,
  User,
  Mic,
  Square,
} from "lucide-react";
import { toast } from "sonner";
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

  const historyQuery = api.ai.getChatHistory.useQuery(undefined, {
    staleTime: Infinity,
  });

  useEffect(() => {
    if (historyQuery.data && messages.length === 0) {
      setMessages(historyQuery.data);
    }
  }, [historyQuery.data]);

  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("file", audioBlob, "audio.webm");

        try {
          const res = await fetch("/api/speech-to-text", {
            method: "POST",
            body: formData,
          });
          const data = await res.json();
          if (data.text) {
            setInput((prev) => (prev + " " + data.text).trim().slice(0, 500));
          }
        } catch (e) {
          console.error(e);
        }

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (e) {
      console.error("Microphone access denied", e);
      toast.error(
        "Microphone access denied. Please allow microphone permissions in your browser to use voice features.",
      );
    }
  };

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
    onError: (error) => {
      toast.error(error.message || "The AI agent failed to respond.");
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

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) {
      submit(q);
      window.history.replaceState({}, "", "/agent");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="h-full overflow-hidden p-4 sm:p-6 lg:p-8">
      <div className="border-border/70 bg-card mx-auto flex h-full max-w-5xl flex-col overflow-hidden rounded-2xl border shadow-sm">
        <div className="border-border/70 border-b px-5 py-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-foreground text-xl font-semibold tracking-tight">
                What should ZERO INBOX do?
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Control email and calendar workflows with natural language.
              </p>
            </div>
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
              <div className="mt-8 flex w-full max-w-3xl flex-wrap justify-center gap-3">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => submit(suggestion)}
                    className="border-border/50 bg-muted/30 hover:bg-muted/80 text-muted-foreground hover:text-foreground flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm transition-all hover:scale-105 active:scale-95"
                  >
                    <Sparkles size={14} className="opacity-70" />
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
          <div className="mb-2 flex justify-end px-2">
            <span
              className={`text-xs ${input.length >= 500 ? "text-destructive font-medium" : "text-muted-foreground"}`}
            >
              {input.length} / 500
            </span>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (input.length <= 500) submit();
            }}
            className="border-border/70 bg-background focus-within:ring-ring/40 flex items-end gap-3 rounded-2xl border p-2 shadow-sm focus-within:ring-2"
          >
            <textarea
              value={input}
              onChange={(e) => {
                if (e.target.value.length <= 500) {
                  setInput(e.target.value);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (input.length <= 500) submit();
                }
              }}
              placeholder="Tell the agent what outcome you want..."
              className="placeholder:text-muted-foreground max-h-32 min-h-10 flex-1 resize-none border-0 bg-transparent px-3 py-2 text-sm outline-none focus:ring-0"
              rows={1}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={`rounded-xl ${isRecording ? "text-destructive animate-pulse" : "text-muted-foreground"}`}
              onClick={toggleRecording}
            >
              {isRecording ? <Square size={16} /> : <Mic size={16} />}
            </Button>
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
