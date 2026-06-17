"use client";

import { format } from "date-fns";
import {
  X,
  MapPin,
  Users,
  Video,
  AlignLeft,
  Calendar as CalendarIcon,
  ExternalLink,
} from "lucide-react";

export function EventDetailModal({
  event,
  onClose,
}: {
  event: any;
  onClose: () => void;
}) {
  const title = event.data?.summary || event.summary || "(No title)";
  const startDateTime = event.data?.start?.dateTime || event.start?.dateTime;
  const endDateTime = event.data?.end?.dateTime || event.end?.dateTime;
  const isAllDay = !startDateTime;
  const dateStr = isAllDay
    ? format(
        new Date(event.data?.start?.date || event.start?.date),
        "MMMM d, yyyy",
      )
    : format(new Date(startDateTime), "EEEE, MMMM d, yyyy");

  const timeStr = isAllDay
    ? "All day"
    : `${format(new Date(startDateTime), "h:mm a")} - ${format(new Date(endDateTime), "h:mm a")}`;

  const description = event.data?.description || event.description;
  const location = event.data?.location || event.location;
  const hangoutLink = event.data?.hangoutLink || event.hangoutLink;
  const htmlLink = event.data?.htmlLink || event.htmlLink;
  const attendees = event.data?.attendees || event.attendees || [];

  return (
    <div className="bg-background/80 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="border-border bg-card w-full max-w-lg overflow-hidden rounded-xl border shadow-2xl">
        <div className="border-border/50 flex items-start justify-between border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-lg">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl leading-none font-semibold tracking-tight">
                {title}
              </h2>
              <p className="text-muted-foreground mt-1.5 text-sm">
                {dateStr} • {timeStr}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:bg-muted/50 rounded-md p-1 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-5 p-6">
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {hangoutLink && (
              <a
                href={hangoutLink}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                <Video className="h-4 w-4" />
                Join Google Meet
              </a>
            )}
            {htmlLink && (
              <a
                href={htmlLink}
                target="_blank"
                rel="noreferrer"
                className="border-border bg-background text-foreground hover:bg-muted flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Open in Google Calendar
              </a>
            )}
          </div>

          <div className="space-y-4 text-sm">
            {location && (
              <div className="flex items-start gap-3">
                <MapPin className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
                <span className="text-foreground">{location}</span>
              </div>
            )}

            {attendees.length > 0 && (
              <div className="flex items-start gap-3">
                <Users className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
                <div className="flex flex-col gap-1">
                  {attendees.map((a: any) => (
                    <span key={a.email} className="text-foreground">
                      {a.displayName
                        ? `${a.displayName} (${a.email})`
                        : a.email}
                      {a.responseStatus === "accepted" && " ✓"}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {description && (
              <div className="flex items-start gap-3">
                <AlignLeft className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
                <div
                  className="prose prose-sm dark:prose-invert text-foreground/90 max-w-none break-words"
                  dangerouslySetInnerHTML={{ __html: description }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
