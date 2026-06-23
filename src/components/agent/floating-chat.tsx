"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bot,
  MessageCircle,
  Send,
  X,
  Check,
  Copy,
  Loader2,
  Sparkles,
  User,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { useEmailStore } from "@/hooks/useEmailStore";

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

export function FloatingChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const historyQuery = api.ai.getChatHistory.useQuery(undefined, {
    staleTime: Infinity,
    enabled: open,
  });

  useEffect(() => {
    if (historyQuery.data && messages.length === 0) {
      setMessages(historyQuery.data);
    }
  }, [historyQuery.data, messages.length]);

  const chat = api.ai.agentChat.useMutation({
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply,
          actions: data.actionsExecuted,
          pendingAction: data.pendingAction,
        },
      ]);
    },
    onError: (error) => {
      toast.error(error.message || "The AI agent failed to respond.");
    },
  });

  useEffect(() => {
    if (open) {
      setTimeout(
        () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
        100,
      );
    }
  }, [messages, chat.isPending, open]);

  const submit = () => {
    if (!input.trim() || chat.isPending) return;
    setMessages((prev) => [...prev, { role: "user", content: input }]);
    chat.mutate({
      message: input,
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
    setMessages((prev) => [
      ...prev.map((message) => ({ ...message, pendingAction: undefined })),
      { role: "user", content },
    ]);
    chat.mutate({
      message: "confirm",
      history: messages.map((m) => ({ role: m.role, content: m.content })),
      confirmedAction: pendingAction,
    });
  };

  const cancelAction = (index: number) => {
    setMessages((prev) =>
      prev.map((message, messageIndex) =>
        messageIndex === index
          ? { ...message, pendingAction: undefined }
          : message,
      ),
    );
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

  const { composeOpen } = useEmailStore();

  // Do not render the floating widget if the user is already on the full agent page
  // or if the email compose modal is open (to prevent overlap)
  if (pathname === "/agent" || composeOpen) return null;

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="border-border/70 bg-card fixed right-6 bottom-[88px] z-50 flex h-[500px] w-[380px] flex-col overflow-hidden rounded-2xl border shadow-2xl"
          >
            {/* Header */}
            <div className="border-border/70 bg-muted/40 flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-lg">
                  <Bot size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">AI Assistant</h3>
                  <p className="text-muted-foreground text-xs">Ask anything</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                className="h-8 w-8 rounded-full"
                onClick={() => setOpen(false)}
              >
                <X size={16} />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <Bot size={32} className="text-muted-foreground/50 mb-3" />
                  <p className="text-sm font-medium">How can I help?</p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    I can draft emails, schedule meetings, or summarize threads.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((m, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex gap-3",
                        m.role === "user" ? "flex-row-reverse" : "",
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                          m.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {m.role === "user" ? (
                          <User size={14} />
                        ) : (
                          <Bot size={14} />
                        )}
                      </div>
                      <div className="flex max-w-[80%] flex-col gap-1">
                        <div
                          className={cn(
                            "group/message relative rounded-2xl px-4 py-2 pr-9 text-sm",
                            m.role === "user"
                              ? "bg-primary text-primary-foreground rounded-tr-sm"
                              : "bg-muted rounded-tl-sm",
                          )}
                        >
                          <div
                            className={cn(
                              "break-words whitespace-pre-wrap select-text",
                              m.role === "user"
                                ? "selection:bg-primary-foreground/25 selection:text-primary-foreground"
                                : "selection:bg-primary/20 selection:text-foreground",
                            )}
                          >
                            {m.content}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            className="absolute top-1.5 right-1.5 opacity-0 transition-opacity group-hover/message:opacity-100 focus-visible:opacity-100"
                            onClick={() => copyMessage(m.content)}
                          >
                            <Copy size={11} />
                            <span className="sr-only">Copy message</span>
                          </Button>
                        </div>
                        {m.pendingAction && (
                          <div className="border-border/70 bg-background mt-1 flex flex-wrap gap-1 rounded-xl border p-1.5 shadow-sm">
                            <Button
                              type="button"
                              size="xs"
                              onClick={() => confirmAction(m.pendingAction!)}
                              disabled={chat.isPending}
                            >
                              <Check size={12} />
                              Confirm
                            </Button>
                            <Button
                              type="button"
                              size="xs"
                              variant="outline"
                              onClick={() => cancelAction(i)}
                              disabled={chat.isPending}
                            >
                              Cancel
                            </Button>
                          </div>
                        )}
                        {m.actions && m.actions.length > 0 && (
                          <div className="mt-1 flex flex-col gap-1">
                            {m.actions.map((act, j) => (
                              <Badge
                                key={j}
                                variant="outline"
                                className="bg-background w-fit gap-1"
                              >
                                <CheckCircle2
                                  size={10}
                                  className="text-emerald-500"
                                />
                                {act}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {chat.isPending && (
                    <div className="flex gap-3">
                      <div className="bg-muted text-muted-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
                        <Sparkles
                          size={14}
                          className="animate-pulse text-amber-500"
                        />
                      </div>
                      <div className="bg-muted text-muted-foreground flex items-center gap-2 rounded-2xl rounded-tl-sm px-4 py-2 text-sm">
                        <Loader2 size={14} className="animate-spin" />
                        Thinking...
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} className="h-2" />
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-border/70 bg-background border-t p-3">
              <form
                className="flex items-center gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  submit();
                }}
              >
                <input
                  type="text"
                  placeholder="Tell the agent..."
                  className="border-border/70 bg-muted/50 focus:border-primary/50 focus:bg-background flex-1 rounded-full border px-4 py-2 text-sm transition-colors outline-none"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={chat.isPending}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="h-9 w-9 shrink-0 rounded-full"
                  disabled={!input.trim() || chat.isPending}
                >
                  <Send size={15} />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(!open)}
        className={cn(
          "fixed z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-2xl transition-colors",
          open
            ? "bg-muted-foreground hover:bg-muted-foreground/90 text-background"
            : "bg-primary hover:bg-primary/90 text-primary-foreground",
        )}
        style={{ bottom: "2rem", right: "2rem" }}
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
      </motion.button>
    </>
  );
}
