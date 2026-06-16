"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Archive,
  ArrowLeft,
  Clock,
  Loader2,
  Reply,
  Sparkles,
  Star,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { api } from "@/trpc/react";
import { useEmailStore } from "@/hooks/useEmailStore";
import {
  decodeEmailBody,
  parseSenderEmail,
  parseSenderName,
} from "@/server/lib/emailUtils";
import { LoadingDots } from "@/components/ui/LoadingDots";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { SnoozeMenu } from "./SnoozeMenu";
import { ComposeModal } from "./compose-modal";

function linkify(text: string): string {
  return text.replace(
    /(https?:\/\/[^\s<>)"]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-primary underline underline-offset-4">$1</a>',
  );
}

export function EmailDetail() {
  const { selectedId, setSelectedId } = useEmailStore();
  const [showSnooze, setShowSnooze] = useState(false);
  const [showReply, setShowReply] = useState(false);
  const [aiSummary, setAiSummary] = useState("");
  const [draftBody, setDraftBody] = useState("");
  const markedReadIdsRef = useRef(new Set<string>());
  const markReadMutateRef = useRef<
    ReturnType<typeof api.gmail.markRead.useMutation>["mutate"] | null
  >(null);

  const { data: email, isLoading } = api.gmail.getOne.useQuery(
    { entityId: selectedId! },
    { enabled: !!selectedId },
  );

  const e = email;
  const headers = e?.data?.payload?.headers || e?.payload?.headers || [];
  const getHeader = (name: string) =>
    headers.find((h: any) => h.name?.toLowerCase() === name.toLowerCase())
      ?.value;

  const subject =
    e?.data?.subject ?? e?.subject ?? getHeader("subject") ?? "(no subject)";
  const from = e?.data?.from ?? e?.from ?? getHeader("from") ?? "";
  const dateStr =
    e?.data?.date ??
    e?.updated_at ??
    getHeader("date") ??
    new Date().toISOString();

  // Try to decode body if missing
  let body = e?.data?.text ?? e?.data?.html;
  if (!body && e?.data?.payload) {
    body = decodeEmailBody(e.data.payload);
  }
  if (!body) body = "No content";

  const senderEmail = parseSenderEmail(from);
  const senderName = parseSenderName(from);
  const date = new Date(dateStr);

  const markRead = api.gmail.markRead.useMutation();
  const archive = api.gmail.archive.useMutation({
    onSuccess: () => {
      setSelectedId(null);
      toast.success("Archived");
    },
  });
  const snooze = api.gmail.snooze.useMutation({
    onSuccess: () => {
      setSelectedId(null);
      toast.success("Snoozed");
    },
  });
  const toggleStar = api.gmail.toggleStar.useMutation({
    onSuccess: () => toast.success(email?.isStarred ? "Unstarred" : "Starred"),
  });
  const summarize = api.ai.summarize.useMutation({
    onSuccess: (d) => setAiSummary(d.summary),
  });
  const draftReply = api.ai.draftReply.useMutation({
    onSuccess: (d) => {
      setDraftBody(d.draft);
      setShowReply(true);
    },
  });

  useEffect(() => {
    markReadMutateRef.current = markRead.mutate;
  }, [markRead.mutate]);

  useEffect(() => {
    setAiSummary("");
    setShowReply(false);
    setDraftBody("");
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId || !email || markedReadIdsRef.current.has(selectedId))
      return;

    markedReadIdsRef.current.add(selectedId);
    markReadMutateRef.current?.(
      { entityId: selectedId },
      {
        onError: () => {
          markedReadIdsRef.current.delete(selectedId);
        },
      },
    );
  }, [selectedId, email]);

  useEffect(() => {
    const onArchive = () =>
      selectedId && archive.mutate({ entityId: selectedId });
    const onReply = () => {
      const e = email;
      if (!e) return;
      draftReply.mutate({
        subject,
        from,
        body,
      });
    };
    const onStar = () => {
      const e = email;
      if (!selectedId) return;
      toggleStar.mutate({ entityId: selectedId, starred: !e?.isStarred });
    };
    window.addEventListener("archive", onArchive);
    window.addEventListener("reply", onReply);
    window.addEventListener("star", onStar);
    return () => {
      window.removeEventListener("archive", onArchive);
      window.removeEventListener("reply", onReply);
      window.removeEventListener("star", onStar);
    };
  }, [selectedId, email, archive, draftReply, toggleStar]);

  if (!selectedId) {
    return (
      <section className="border-border/70 bg-card hidden min-h-0 rounded-2xl border shadow-sm lg:flex">
        <EmptyState
          icon={ArrowLeft}
          title="Select a message"
          description="Choose a thread to read, summarize, reply, snooze, or archive."
        />
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="border-border/70 bg-card flex min-h-0 items-center justify-center rounded-2xl border shadow-sm">
        <LoadingDots />
      </section>
    );
  }

  return (
    <motion.section
      className="bg-background lg:border-border/70 lg:bg-card fixed inset-0 z-40 flex min-h-0 flex-col overflow-hidden lg:static lg:rounded-2xl lg:border lg:shadow-sm"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.16 }}
    >
      <div className="border-border/70 bg-card/95 flex min-h-16 shrink-0 items-center gap-2 border-b px-4 backdrop-blur lg:rounded-t-2xl lg:px-5">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setSelectedId(null)}
        >
          <ArrowLeft size={17} />
          <span className="sr-only">Back to inbox</span>
        </Button>
        <Badge variant="outline" className="rounded-full">
          Thread
        </Badge>
        <div className="ml-auto flex items-center gap-1 overflow-x-auto">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-xl"
            onClick={() => summarize.mutate({ subject, from, body })}
            disabled={summarize.isPending}
          >
            {summarize.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            Summary
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-xl"
            onClick={() => setShowReply(true)}
          >
            <Reply className="size-4" /> Reply
          </Button>
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl"
              onClick={() => setShowSnooze((value) => !value)}
            >
              <Clock className="size-4" /> Snooze
            </Button>
            {showSnooze && (
              <SnoozeMenu
                onSnooze={(until) =>
                  snooze.mutate({ entityId: selectedId, snoozeUntil: until })
                }
                onClose={() => setShowSnooze(false)}
              />
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-xl"
            onClick={() => archive.mutate({ entityId: selectedId })}
          >
            <Archive className="size-4" /> Archive
          </Button>
          <Button
            variant={e?.isStarred ? "secondary" : "ghost"}
            size="icon-sm"
            className="rounded-xl"
            onClick={() =>
              toggleStar.mutate({
                entityId: selectedId,
                starred: !e?.isStarred,
              })
            }
          >
            <Star
              className={
                e?.isStarred ? "size-4 fill-amber-400 text-amber-400" : "size-4"
              }
            />
            <span className="sr-only">Star</span>
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8 lg:px-10">
        <article className="mx-auto max-w-3xl">
          <div className="mb-8">
            <h1 className="text-3xl font-semibold tracking-tight text-balance">
              {subject}
            </h1>
            <div className="border-border/70 mt-6 flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>
                    {senderName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{senderName}</p>
                  <p className="text-muted-foreground truncate text-xs">
                    {senderEmail} · to me
                  </p>
                </div>
              </div>
              <p className="text-muted-foreground text-xs">
                {format(
                  date ? new Date(date) : new Date(),
                  "MMM d, yyyy · h:mm a",
                )}
              </p>
            </div>
          </div>

          <AnimatePresence>
            {aiSummary && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                <Card className="border-primary/20 bg-primary/5 mb-8">
                  <CardContent className="p-5">
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                      <Sparkles size={16} /> AI summary
                    </div>
                    <p className="text-muted-foreground text-sm leading-7">
                      {aiSummary}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          <div
            className="prose prose-sm text-foreground dark:prose-invert max-w-none leading-8 whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: linkify(body) }}
          />
        </article>
      </div>

      {showReply && (
        <ComposeModal
          replyTo={{
            from,
            subject: subject.startsWith("Re:") ? subject : `Re: ${subject}`,
            body: draftBody,
          }}
          onClose={() => setShowReply(false)}
        />
      )}
    </motion.section>
  );
}
