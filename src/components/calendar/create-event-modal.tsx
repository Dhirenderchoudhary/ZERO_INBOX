"use client";

import { useState } from "react";
import { addHours, format } from "date-fns";
import { Calendar as CalendarIcon, Loader2, X } from "lucide-react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateEventModal({ onClose }: { onClose: () => void }) {
  const [summary, setSummary] = useState("");
  const [startTime, setStartTime] = useState(
    format(new Date(), "yyyy-MM-dd'T'HH:mm"),
  );
  const [endTime, setEndTime] = useState(
    format(addHours(new Date(), 1), "yyyy-MM-dd'T'HH:mm"),
  );
  const [attendees, setAttendees] = useState("");

  const utils = api.useUtils();

  const create = api.calendar.createEvent.useMutation({
    onSuccess: () => {
      void utils.calendar.getEventsRange.invalidate();
      onClose();
    },
  });

  return (
    <div className="bg-background/70 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div
        className="border-border/70 bg-card w-full max-w-lg overflow-hidden rounded-2xl border shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-title"
      >
        <div className="border-border/70 bg-muted/40 flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 id="event-title" className="text-sm font-semibold">
              New event
            </h2>
            <p className="text-muted-foreground text-xs">
              Create a calendar hold with clear ownership.
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            className="rounded-xl"
            onClick={onClose}
          >
            <X size={16} />
            <span className="sr-only">Close</span>
          </Button>
        </div>

        <div className="grid gap-4 p-5">
          <div className="grid gap-2">
            <Label htmlFor="event-summary">Event title</Label>
            <Input
              id="event-summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              autoFocus
              placeholder="Customer follow-up"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="event-start">Start time</Label>
              <Input
                id="event-start"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="event-end">End time</Label>
              <Input
                id="event-end"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="event-attendees">Attendees</Label>
            <Input
              id="event-attendees"
              value={attendees}
              onChange={(e) => setAttendees(e.target.value)}
              placeholder="teammate@company.com, client@company.com"
            />
            <p className="text-muted-foreground text-xs">
              Comma-separated email addresses. Invites are sent through Google
              Calendar.
            </p>
          </div>
        </div>

        <div className="border-border/70 bg-muted/30 flex flex-col-reverse gap-2 border-t px-5 py-4 sm:flex-row sm:justify-end">
          <Button variant="outline" className="rounded-xl" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="rounded-xl"
            onClick={() =>
              create.mutate({
                summary,
                startTime: new Date(startTime).toISOString(),
                endTime: new Date(endTime).toISOString(),
                attendees: attendees
                  .split(",")
                  .map((a) => a.trim())
                  .filter(Boolean),
              })
            }
            disabled={!summary || create.isPending}
          >
            {create.isPending ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <CalendarIcon size={15} />
            )}
            Create event
          </Button>
        </div>
      </div>
    </div>
  );
}
