"use client";

import { format, isToday, isYesterday } from "date-fns";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

function formatEmailTime(dateStr: string | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, "h:mm a");
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMM d");
}

function parseSenderName(from: string | undefined): string {
  if (!from) return "Unknown";
  const match = /^([^<]+)</.exec(from);
  return match
    ? (match[1]?.trim() ?? "Unknown")
    : from.split("@")[0] || "Unknown";
}

interface EmailRowProps {
  email: any;
  index?: number;
  isSelected: boolean;
  isFocused: boolean;
  onClick: () => void;
}

export function EmailRow({
  email,
  isSelected,
  isFocused,
  onClick,
}: EmailRowProps) {
  const isUnread = !email?.isRead;
  const headers =
    email?.data?.payload?.headers || email?.payload?.headers || [];
  const getHeader = (name: string) =>
    headers.find((h: any) => h.name?.toLowerCase() === name.toLowerCase())
      ?.value;

  const sender = parseSenderName(
    email?.data?.from ?? email?.fromAddress ?? email?.from ?? getHeader("from"),
  );
  const subject =
    email?.data?.subject ??
    email?.subject ??
    getHeader("subject") ??
    "(no subject)";
  const snippet = email?.data?.snippet ?? email?.snippet ?? "";

  return (
    <motion.button
      type="button"
      onClick={onClick}
      variants={{
        hidden: { opacity: 0, x: -10 },
        show: { opacity: 1, x: 0 },
      }}
      className={cn(
        "group mx-3 my-2 w-[calc(100%-1.5rem)] rounded-2xl p-4 text-left transition-all duration-200",
        isSelected
          ? "border-primary/40 bg-card ring-primary/20 border shadow-md ring-1"
          : isFocused
            ? "glass-panel bg-card/70 border-primary/20"
            : "glass-panel bg-card/40 border-border/40",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="bg-muted text-muted-foreground relative flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
          {sender.charAt(0).toUpperCase()}
          {isUnread && (
            <span className="ring-card absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-blue-500 ring-2" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p
              className={cn(
                "truncate text-sm",
                isUnread
                  ? "font-semibold"
                  : "text-muted-foreground font-medium",
              )}
            >
              {sender}
            </p>
            {isUnread && (
              <Badge
                variant="secondary"
                className="h-5 rounded-full text-[10px]"
              >
                New
              </Badge>
            )}
            <span className="text-muted-foreground ml-auto shrink-0 font-mono text-[11px]">
              {formatEmailTime(
                email?.data?.date ??
                  email?.updated_at ??
                  new Date().toISOString(),
              )}
            </span>
          </div>
          <p className="text-foreground/90 mt-1 truncate text-sm font-medium">
            {subject}
          </p>
          <p className="text-muted-foreground mt-1 line-clamp-2 text-xs leading-5">
            {snippet}
          </p>
          <div className="mt-3 flex items-center justify-between">
            {email?.priority === "urgent" ? (
              <Badge
                variant="outline"
                className="rounded-full border-red-500/30 bg-red-500/5 text-[10px] text-red-500"
              >
                Urgent
              </Badge>
            ) : email?.priority === "needs_reply" ? (
              <Badge
                variant="outline"
                className="rounded-full border-blue-500/30 bg-blue-500/5 text-[10px] text-blue-500"
              >
                Needs Reply
              </Badge>
            ) : email?.priority === "fyi" ? (
              <Badge
                variant="outline"
                className="rounded-full border-violet-500/30 bg-violet-500/5 text-[10px] text-violet-500"
              >
                FYI
              </Badge>
            ) : email?.priority === "newsletter" ? (
              <Badge
                variant="outline"
                className="rounded-full border-slate-500/30 bg-slate-500/5 text-[10px] text-slate-500"
              >
                Newsletter
              </Badge>
            ) : (
              <Badge variant="outline" className="rounded-full text-[10px]">
                Standard
              </Badge>
            )}
            {email?.isStarred && (
              <Star size={14} className="fill-amber-400 text-amber-400" />
            )}
          </div>
        </div>
      </div>
    </motion.button>
  );
}
