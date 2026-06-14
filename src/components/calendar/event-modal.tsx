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

  const createEvent = api.calendar.createEvent.useMutation({
    onSuccess: () => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 font-sans shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <h3 className="font-semibold text-zinc-100">New Event</h3>
          <button
            onClick={onClose}
            className="text-zinc-400 transition-colors hover:text-zinc-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-4 p-5">
          <div>
            <label className="mb-1.5 block text-xs font-semibold tracking-wider text-zinc-500 uppercase">
              Event Title
            </label>
            <input
              autoFocus
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500/50 focus:outline-none"
              placeholder="E.g. Engineering Sync"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold tracking-wider text-zinc-500 uppercase">
                Start Time
              </label>
              <input
                type="datetime-local"
                className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 focus:border-emerald-500/50 focus:outline-none"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold tracking-wider text-zinc-500 uppercase">
                End Time
              </label>
              <input
                type="datetime-local"
                className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 focus:border-emerald-500/50 focus:outline-none"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold tracking-wider text-zinc-500 uppercase">
              Attendees (comma separated)
            </label>
            <input
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2.5 font-mono text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500/50 focus:outline-none"
              placeholder="alice@example.com, bob@example.com"
              value={attendeeStr}
              onChange={(e) => setAttendeeStr(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold tracking-wider text-zinc-500 uppercase">
              Location
            </label>
            <input
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500/50 focus:outline-none"
              placeholder="Google Meet or physical location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <label className="mt-1 flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-zinc-800 bg-zinc-900 text-emerald-500 focus:ring-emerald-500/20"
              checked={sendInvites}
              onChange={(e) => setSendInvites(e.target.checked)}
            />
            <span className="text-sm text-zinc-300">
              Send email invitations to attendees
            </span>
          </label>
        </div>

        <div className="flex justify-end gap-2 border-t border-zinc-800 bg-zinc-900/50 px-5 py-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={createEvent.isPending || !summary}
            className="flex items-center gap-2 rounded bg-emerald-500 px-5 py-2 text-sm font-semibold text-black transition-colors hover:bg-emerald-600 disabled:opacity-50"
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
