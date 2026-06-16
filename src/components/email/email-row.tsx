"use client";

import { format, isToday, isYesterday } from "date-fns";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group mx-3 my-2 w-[calc(100%-1.5rem)] rounded-2xl border p-4 text-left transition-all duration-200",
        "hover:border-border hover:bg-card hover:-translate-y-0.5 hover:shadow-md",
        isSelected
          ? "border-primary/30 bg-card ring-primary/10 shadow-md ring-1"
          : isFocused
            ? "border-border bg-card/80"
            : "border-border/60 bg-card/55",
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
            <Badge variant="outline" className="rounded-full text-[10px]">
              AI triaged
            </Badge>
            {email?.isStarred && (
              <Star size={14} className="fill-amber-400 text-amber-400" />
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
