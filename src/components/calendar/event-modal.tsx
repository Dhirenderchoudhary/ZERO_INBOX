"use client";

import { useState } from "react";
import { format, addHours } from "date-fns";
import { X, Loader2 } from "lucide-react";
import { api } from "@/trpc/react";

export function EventModal({
  initialStart,
  onClose,
}: {
  initialStart: Date;
  onClose: () => void;
}) {
  const [summary, setSummary] = useState("");
  const [startTime, setStartTime] = useState(
    format(initialStart, "yyyy-MM-dd'T'HH:mm"),
  );
  const [endTime, setEndTime] = useState(
    format(addHours(initialStart, 1), "yyyy-MM-dd'T'HH:mm"),
  );
  const [attendeeStr, setAttendeeStr] = useState("");
  const [location, setLocation] = useState("");
  const [sendInvites, setSendInvites] = useState(true);

  const utils = api.useUtils();

  const createEvent = api.calendar.createEvent.useMutation({
    onSuccess: () => {
      void utils.calendar.getEventsRange.invalidate();
      onClose();
    },
  });

  const handleSave = () => {
    const attendees = attendeeStr
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    createEvent.mutate({
      summary,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      attendees,
      location,
      sendInvites,
    });
  };

  return (
    <div className="bg-background/80 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="border-border bg-card w-full max-w-md overflow-hidden rounded-xl border font-sans shadow-2xl">
        <div className="border-border flex items-center justify-between border-b px-5 py-4">
          <h3 className="text-foreground font-semibold">New Event</h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-4 p-5">
          <div>
            <label className="text-muted-foreground mb-1.5 block text-xs font-semibold tracking-wider uppercase">
              Event Title
            </label>
            <input
              autoFocus
              className="border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary w-full rounded-md border px-3 py-2.5 text-sm transition-colors focus:ring-1 focus:outline-none"
              placeholder="E.g. Engineering Sync"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-muted-foreground mb-1.5 block text-xs font-semibold tracking-wider uppercase">
                Start Time
              </label>
              <input
                type="datetime-local"
                className="border-border bg-background text-foreground focus:border-primary focus:ring-primary w-full rounded-md border px-3 py-2.5 text-sm transition-colors focus:ring-1 focus:outline-none"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <label className="text-muted-foreground mb-1.5 block text-xs font-semibold tracking-wider uppercase">
                End Time
              </label>
              <input
                type="datetime-local"
                className="border-border bg-background text-foreground focus:border-primary focus:ring-primary w-full rounded-md border px-3 py-2.5 text-sm transition-colors focus:ring-1 focus:outline-none"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-muted-foreground mb-1.5 block text-xs font-semibold tracking-wider uppercase">
              Attendees (comma separated)
            </label>
            <input
              className="border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary w-full rounded-md border px-3 py-2.5 font-mono text-sm transition-colors focus:ring-1 focus:outline-none"
              placeholder="alice@example.com, bob@example.com"
              value={attendeeStr}
              onChange={(e) => setAttendeeStr(e.target.value)}
            />
          </div>

          <div>
            <label className="text-muted-foreground mb-1.5 block text-xs font-semibold tracking-wider uppercase">
              Location
            </label>
            <input
              className="border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary w-full rounded-md border px-3 py-2.5 text-sm transition-colors focus:ring-1 focus:outline-none"
              placeholder="Google Meet or physical location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <label className="mt-1 flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              className="border-border bg-background text-primary focus:ring-primary/20 h-4 w-4 rounded"
              checked={sendInvites}
              onChange={(e) => setSendInvites(e.target.checked)}
            />
            <span className="text-muted-foreground text-sm">
              Send email invitations to attendees
            </span>
          </label>
        </div>

        <div className="border-border bg-muted/50 flex justify-end gap-2 border-t px-5 py-4">
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground px-4 py-2 text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={createEvent.isPending || !summary}
            className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded px-5 py-2 text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {createEvent.isPending && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            Create Event
          </button>
        </div>
      </div>
    </div>
  );
}
