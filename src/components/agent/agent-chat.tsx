"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bot,
  CheckCircle2,
  Check,
  Copy,
  History,
  Loader2,
  Plus,
  Send,
  Sparkles,
  User,
  Mic,
  Square,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const suggestions = [
  "Summarize my urgent emails",
  "Draft follow-ups from yesterday",
  "Find time for a 30 minute sync",
  "Archive low-signal newsletters",
];

type PendingAction =
  | {
      type: "send_email";
      to: string;
      subject: string;
      body: string;
    }
  | {
      type: "create_event";
      summary: string;
      description?: string;
      startTime: string;
      endTime: string;
      attendees: string[];
      sendInvites: boolean;
    };

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  actions?: string[];
  pendingAction?: PendingAction;
};

type ChatSession = {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
};

const CHAT_SESSIONS_KEY = "zero-inbox-agent-chat-sessions";

function createSessionTitle(messages: ChatMessage[]) {
  return (
    messages.find((message) => message.role === "user")?.content.trim() ||
    "New chat"
  ).slice(0, 80);
}

function readStoredSessions() {
  try {
    const stored = window.localStorage.getItem(CHAT_SESSIONS_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as ChatSession[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    window.localStorage.removeItem(CHAT_SESSIONS_KEY);
    return [];
  }
}

export function AgentChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [historyHydrated, setHistoryHydrated] = useState(false);
  const activeSessionIdRef = useRef<string | null>(null);

  const historyQuery = api.ai.getChatHistory.useQuery(undefined, {
    staleTime: Infinity,
  });

  useEffect(() => {
    activeSessionIdRef.current = activeSessionId;
  }, [activeSessionId]);

  useEffect(() => {
    if (!historyQuery.data || historyHydrated) return;

    const parsedSessions = readStoredSessions();
    const validSessions = parsedSessions.filter(
      (session) => Array.isArray(session.messages) && session.messages.length,
    );

    if (validSessions.length > 0) {
      const sorted = validSessions.sort((a, b) => b.updatedAt - a.updatedAt);
      const active = sorted[0]!;
      setSessions(sorted);
      setActiveSessionId(active.id);
      activeSessionIdRef.current = active.id;
      setMessages(active.messages);
    } else if (historyQuery.data.length > 0) {
      const session: ChatSession = {
        id: `chat-${Date.now()}`,
        title: createSessionTitle(historyQuery.data),
        messages: historyQuery.data,
        updatedAt: Date.now(),
      };
      setSessions([session]);
      setActiveSessionId(session.id);
      activeSessionIdRef.current = session.id;
      setMessages(session.messages);
    }

    setHistoryHydrated(true);
  }, [historyHydrated, historyQuery.data]);

  useEffect(() => {
    if (!historyHydrated) return;
    window.localStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(sessions));
  }, [historyHydrated, sessions]);

  const saveActiveSession = (nextMessages: ChatMessage[]) => {
    if (nextMessages.length === 0) return;
    const now = Date.now();
    const sessionId = activeSessionIdRef.current ?? `chat-${now}`;
    activeSessionIdRef.current = sessionId;
    setActiveSessionId(sessionId);
    setSessions((prev) => {
      const existing = prev.find((session) => session.id === sessionId);
      const nextSession: ChatSession = {
        id: sessionId,
        title: existing?.title ?? createSessionTitle(nextMessages),
        messages: nextMessages,
        updatedAt: now,
      };
      return existing
        ? prev.map((session) =>
            session.id === sessionId ? nextSession : session,
          )
        : [nextSession, ...prev];
    });
  };

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
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.reply,
        actions: data.actionsExecuted,
        pendingAction: data.pendingAction,
      };
      setMessages((prev) => {
        const next = [...prev, assistantMessage];
        saveActiveSession(next);
        return next;
      });
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
    const userMessage: ChatMessage = { role: "user", content: value };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    saveActiveSession(nextMessages);
    chat.mutate({
      message: value,
      history: messages.map((m) => ({ role: m.role, content: m.content })),
    });
    setInput("");
  };

  const confirmAction = (pendingAction: PendingAction) => {
    if (chat.isPending) return;
    const content =
      pendingAction.type === "send_email"
        ? `Confirm sending email to ${pendingAction.to}`
        : `Confirm creating "${pendingAction.summary}"`;

    const userMessage: ChatMessage = { role: "user", content };
    const clearPending = (message: ChatMessage) => ({
      ...message,
      pendingAction: undefined,
    });
    const nextMessages = [...messages.map(clearPending), userMessage];
    setMessages(nextMessages);
    saveActiveSession(nextMessages);
    chat.mutate({
      message: "confirm",
      history: messages.map((m) => ({ role: m.role, content: m.content })),
      confirmedAction: pendingAction,
    });
  };

  const cancelAction = (index: number) => {
    setMessages((prev) => {
      const next = prev.map((message, messageIndex) =>
        messageIndex === index
          ? { ...message, pendingAction: undefined }
          : message,
      );
      saveActiveSession(next);
      return next;
    });
    toast.message("Action cancelled");
  };

  const copyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success("Copied");
    } catch {
      toast.error("Copy failed");
    }
  };

  const historyItems = sessions
    .slice()
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 18);

  const openSession = (session: ChatSession) => {
    setActiveSessionId(session.id);
    activeSessionIdRef.current = session.id;
    setMessages(session.messages);
  };

  const startNewChat = () => {
    setMessages([]);
    setInput("");
    const nextId = `chat-${Date.now()}`;
    setActiveSessionId(nextId);
    activeSessionIdRef.current = nextId;
    setHistoryHydrated(true);
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
      <div className="border-border/70 bg-card mx-auto flex h-full max-w-6xl overflow-hidden rounded-2xl border shadow-sm">
        <aside className="border-border/70 bg-muted/20 hidden w-72 shrink-0 flex-col border-r lg:flex">
          <div className="border-border/70 flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <History size={16} className="text-muted-foreground" />
              <span className="text-sm font-semibold">History</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={startNewChat}
              className="rounded-lg"
            >
              <Plus size={15} />
              <span className="sr-only">New chat</span>
            </Button>
          </div>
          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
            {historyItems.length === 0 ? (
              <div className="text-muted-foreground px-3 py-4 text-xs leading-5">
                Your recent agent prompts will appear here.
              </div>
            ) : (
              historyItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openSession(item)}
                  className="hover:bg-muted/80 focus-visible:bg-muted w-full rounded-lg px-3 py-2 text-left text-sm transition-colors outline-none"
                >
                  <span className="line-clamp-2">{item.title}</span>
                </button>
              ))
            )}
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
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
                  Ask the agent to summarize, draft, schedule, triage, or
                  execute routine communication tasks.
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
                    ref={(node) => {
                      messageRefs.current[idx] = node;
                    }}
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
                      className={`flex max-w-[82%] flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                    >
                      <Card
                        className={
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-background/70"
                        }
                      >
                        <CardContent className="group/message relative p-4 pr-10 text-sm leading-7">
                          <div
                            className={
                              msg.role === "user"
                                ? "selection:bg-primary-foreground/25 selection:text-primary-foreground break-words whitespace-pre-wrap select-text"
                                : "selection:bg-primary/20 selection:text-foreground break-words whitespace-pre-wrap select-text"
                            }
                          >
                            {msg.content}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            className="absolute top-2 right-2 opacity-0 transition-opacity group-hover/message:opacity-100 focus-visible:opacity-100"
                            onClick={() => copyMessage(msg.content)}
                          >
                            <Copy size={12} />
                            <span className="sr-only">Copy message</span>
                          </Button>
                        </CardContent>
                      </Card>
                      {msg.pendingAction && (
                        <div className="border-border/70 bg-background mt-2 flex flex-wrap gap-2 rounded-xl border p-2 shadow-sm">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => confirmAction(msg.pendingAction!)}
                            disabled={chat.isPending}
                          >
                            <Check size={14} />
                            Confirm
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => cancelAction(idx)}
                            disabled={chat.isPending}
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
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
    </div>
  );
}
