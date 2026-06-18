"use client";

import { useEffect, useState } from "react";
import { Loader2, Send, X } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KBD } from "@/components/ui/KBD";

interface ComposeModalProps {
  replyTo?: { from: string; subject: string; body?: string };
  onClose: () => void;
}

export function ComposeModal({ replyTo, onClose }: ComposeModalProps) {
  const [to, setTo] = useState(replyTo ? replyTo.from : "");
  const [subject, setSubject] = useState(replyTo ? replyTo.subject : "");
  const [body, setBody] = useState(replyTo?.body ?? "");

  const send = api.gmail.send.useMutation({
    onSuccess: () => {
      toast.success("Message sent");
      onClose();
    },
    onError: (error) => {
      if (
        error.message.toLowerCase().includes("permission") ||
        error.message.toLowerCase().includes("auth") ||
        error.message.toLowerCase().includes("credential")
      ) {
        toast.error("Please connect Gmail to send emails.", {
          action: {
            label: "Connect",
            onClick: () =>
              (window.location.href = "/api/corsair/connect?plugin=gmail"),
          },
        });
      } else {
        toast.error("Failed to send message: " + error.message);
      }
    },
  });

  useEffect(() => {
    const handleClose = () => onClose();
    const handleCmdEnter = (e: KeyboardEvent) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        if (to && body && !send.isPending) send.mutate({ to, subject, body });
      }
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("close-modals", handleClose);
    window.addEventListener("keydown", handleCmdEnter);
    return () => {
      window.removeEventListener("close-modals", handleClose);
      window.removeEventListener("keydown", handleCmdEnter);
    };
  }, [onClose, to, subject, body, send]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.98 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="border-border/70 bg-card fixed inset-x-3 bottom-3 z-50 flex max-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-2xl border shadow-2xl sm:right-6 sm:left-auto sm:w-[560px]"
      role="dialog"
      aria-modal="true"
      aria-label={replyTo ? "Reply" : "New message"}
    >
      <div className="border-border/70 bg-muted/40 flex items-center justify-between border-b px-5 py-4">
        <div>
          <p className="text-sm font-semibold">
            {replyTo ? "Reply" : "New message"}
          </p>
          <p className="text-muted-foreground text-xs">
            Draft with clear context and keyboard shortcuts.
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          className="rounded-xl"
          onClick={onClose}
        >
          <X size={16} />
          <span className="sr-only">Close compose</span>
        </Button>
      </div>

      <div className="grid gap-4 p-5">
        <div className="grid gap-2">
          <Label htmlFor="compose-to">To</Label>
          <Input
            id="compose-to"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="name@company.com"
            autoFocus={!replyTo}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="compose-subject">Subject</Label>
          <Input
            id="compose-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="What is this about?"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="compose-body">Message</Label>
          <textarea
            id="compose-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring focus-visible:ring-offset-background min-h-[260px] resize-none rounded-xl border px-3 py-3 text-sm leading-7 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            placeholder="Write a concise, helpful response..."
            autoFocus={!!replyTo}
          />
          <p className="text-muted-foreground text-xs">
            Tip: Keep replies direct. You can ask the agent to draft first.
          </p>
        </div>
      </div>

      <div className="border-border/70 bg-muted/30 flex items-center justify-between border-t px-5 py-4">
        <Button
          onClick={() => send.mutate({ to, subject, body })}
          disabled={!to || !body || send.isPending}
          className="rounded-xl"
        >
          {send.isPending ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Send size={15} />
          )}
          Send
        </Button>
        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          Send <KBD>⌘↵</KBD>
        </div>
      </div>
    </motion.div>
  );
}
