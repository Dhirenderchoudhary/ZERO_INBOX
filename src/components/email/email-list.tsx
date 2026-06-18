"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Cpu, Inbox, RefreshCw, Search, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/trpc/react";
import { EmailRow } from "./email-row";
import { EmailRowSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useEmailStore } from "@/hooks/useEmailStore";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "urgent", label: "Urgent" },
  { key: "needs_reply", label: "Reply" },
  { key: "fyi", label: "FYI" },
  { key: "starred", label: "Starred" },
  { key: "sent", label: "Sent" },
];

export function EmailList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [focusedIdx, setFocusedIdx] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const { selectedId, setSelectedId } = useEmailStore();

  useEffect(() => {
    setFilter(searchParams.get("p") ?? searchParams.get("f") ?? "all");
  }, [searchParams]);

  const updateFilter = (nextFilter: string) => {
    setFilter(nextFilter);
    setFocusedIdx(0);

    if (nextFilter === "all") {
      router.replace("/inbox", { scroll: false });
    } else if (nextFilter === "starred" || nextFilter === "sent") {
      router.replace(`/inbox?f=${nextFilter}`, { scroll: false });
    } else {
      router.replace(`/inbox?p=${nextFilter}`, { scroll: false });
    }
  };

  const markRead = api.gmail.markRead.useMutation();

  const {
    data: emails = [],
    refetch,
    isLoading,
    isError,
  } = api.gmail.listWithTriage.useQuery(
    { limit: 50, priority: filter as any },
    { refetchInterval: 60_000, retry: false },
  );

  const { data: searchResults = [], isFetching: isSearching } =
    api.gmail.search.useQuery(
      { query: search },
      { enabled: search.length > 1 },
    );

  const displayed = search.length > 1 ? searchResults : emails;

  const refresh = api.gmail.refresh.useMutation({
    onSuccess: (d) => {
      refetch();
      toast.success(`Synced ${d.synced} threads from Gmail`);
    },
    onError: () => toast.error("Failed to refresh"),
  });

  const triage = api.ai.triageInbox.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Background AI triage queued successfully");
    },
    onError: () => toast.error("AI triage failed"),
  });

  useEffect(() => {
    const handlers: Record<string, () => void> = {
      "nav-next": () =>
        setFocusedIdx((i) => Math.min(i + 1, displayed.length - 1)),
      "nav-prev": () => setFocusedIdx((i) => Math.max(i - 1, 0)),
      refresh: () => refresh.mutate(),
      triage: () => triage.mutate(),
    };
    Object.entries(handlers).forEach(([e, h]) => window.addEventListener(e, h));
    return () =>
      Object.entries(handlers).forEach(([e, h]) =>
        window.removeEventListener(e, h),
      );
  }, [displayed.length, refresh, triage]);

  return (
    <section className="border-border/70 bg-card flex min-h-0 flex-col overflow-hidden rounded-2xl border shadow-sm">
      <div className="border-border/70 border-b p-4">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold tracking-tight">Inbox</h2>
              <Badge variant="outline" className="rounded-full">
                {displayed.length} threads
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1 text-sm">
              Prioritized by urgency, obligation, and context.
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button
              onClick={() => refresh.mutate()}
              disabled={refresh.isPending}
              variant="outline"
              size="icon-sm"
              className="rounded-xl"
            >
              <RefreshCw
                className={cn("size-4", refresh.isPending && "animate-spin")}
              />
              <span className="sr-only">Refresh</span>
            </Button>
          </div>
        </div>

        <div className="relative">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            ref={searchRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search sender, subject, or action..."
            className="bg-background/50 border-border/60 focus-visible:ring-primary placeholder:text-muted-foreground/50 h-11 rounded-xl pr-10 pl-9 shadow-sm transition-all focus-visible:ring-1"
          />
          <AnimatePresence>
            {search && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => setSearch("")}
                className="text-muted-foreground hover:bg-muted hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1"
              >
                <X size={14} />
              </motion.button>
            )}
          </AnimatePresence>
          {isSearching && (
            <div className="border-primary absolute top-1/2 right-10 size-4 -translate-y-1/2 animate-spin rounded-full border-2 border-t-transparent" />
          )}
        </div>

        <div className="mt-4 flex scrollbar-none gap-2 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => updateFilter(tab.key)}
              className={cn(
                "relative rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200",
                filter === tab.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <span className="relative z-10">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-muted/20 min-h-0 flex-1 overflow-y-auto py-1">
        {isLoading ? (
          <div className="py-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <EmailRowSkeleton key={i} />
            ))}
          </div>
        ) : isError ? (
          <EmptyState
            icon={Inbox}
            title="Connect your Gmail"
            description="Link Gmail to unlock AI-powered triage, summaries, replies, and workflow automation."
            action={{
              label: "Connect Gmail",
              onClick: () =>
                (window.location.href = "/api/corsair/connect?plugin=gmail"),
            }}
          />
        ) : displayed.length === 0 ? (
          <EmptyState
            icon={
              search
                ? Search
                : ["urgent", "needs_reply", "fyi", "newsletter"].includes(
                      filter,
                    )
                  ? Cpu
                  : Inbox
            }
            title={
              search
                ? "No matching threads"
                : ["urgent", "needs_reply", "fyi", "newsletter"].includes(
                      filter,
                    )
                  ? `No ${filter.replace("_", " ")} emails`
                  : "Inbox zero"
            }
            description={
              search
                ? `No emails match “${search}”. Try a broader query.`
                : ["urgent", "needs_reply", "fyi", "newsletter"].includes(
                      filter,
                    )
                  ? "If you just connected Gmail, the AI agent is currently triaging your inbox in the background. Check back in a minute!"
                  : "All caught up. Refresh to sync Gmail or let the agent monitor new work."
            }
            action={
              search
                ? { label: "Clear search", onClick: () => setSearch("") }
                : { label: "Refresh inbox", onClick: () => refresh.mutate() }
            }
          />
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.04 },
              },
            }}
          >
            {displayed.map((email: any, idx: number) => (
              <EmailRow
                key={email.entity_id}
                email={email}
                index={idx}
                isSelected={selectedId === email.entity_id}
                isFocused={focusedIdx === idx && !selectedId}
                onClick={() => {
                  setSelectedId(email.entity_id);
                  setFocusedIdx(idx);
                  if (!email.isRead) {
                    markRead.mutate(email.entity_id);
                    email.isRead = true; // Optimistic update
                  }
                }}
              />
            ))}
          </motion.div>
        )}
      </div>

      <div className="border-border/70 bg-card text-muted-foreground flex shrink-0 items-center justify-between border-t px-4 py-3 text-xs">
        <span>{displayed.length} messages</span>
        <span className="font-mono">J/K navigate · E archive</span>
      </div>
    </section>
  );
}
