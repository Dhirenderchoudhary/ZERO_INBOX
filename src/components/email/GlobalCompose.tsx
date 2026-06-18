"use client";
import { useEffect } from "react";
import { ComposeModal } from "@/components/email/compose-modal";
import { useEmailStore } from "@/hooks/useEmailStore";

export function GlobalCompose() {
  const { composeOpen, setComposeOpen, replyTo, setReplyTo } = useEmailStore();

  useEffect(() => {
    const handleCompose = () => setComposeOpen(true);
    window.addEventListener("compose", handleCompose);
    return () => window.removeEventListener("compose", handleCompose);
  }, [setComposeOpen]);

  if (!composeOpen) return null;

  return (
    <ComposeModal
      replyTo={replyTo || undefined}
      onClose={() => {
        setComposeOpen(false);
        setReplyTo(null);
      }}
    />
  );
}
