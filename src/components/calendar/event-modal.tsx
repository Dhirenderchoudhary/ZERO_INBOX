"use client";

import { useState } from "react";
import { format, addHours } from "date-fns";
import { X, Loader2 } from "lucide-react";
import { api } from "@/trpc/react";

export function EventModal({ initialStart, onClose }: { initialStart: Date, onClose: () => void }) {
  const [summary, setSummary] = useState("");
  const [startTime, setStartTime] = useState(format(initialStart, "yyyy-MM-dd'T'HH:mm"));
  const [endTime, setEndTime] = useState(format(addHours(initialStart, 1), "yyyy-MM-dd'T'HH:mm"));
  const [attendeeStr, setAttendeeStr] = useState("");
  const [location, setLocation] = useState("");
  const [sendInvites, setSendInvites] = useState(true);

  const createEvent = api.calendar.createEvent.useMutation({
    onSuccess: () => {
      onClose();
    }
  });

  const handleSave = () => {
    const attendees = attendeeStr.split(',').map(s => s.trim()).filter(Boolean);
    createEvent.mutate({
      summary,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      attendees,
      location,
      sendInvites
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-zinc-950 w-full max-w-md rounded-xl border border-zinc-800 shadow-2xl overflow-hidden font-sans">
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="font-semibold text-zinc-100">New Event</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wider">Event Title</label>
            <input 
              autoFocus
              className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500/50"
              placeholder="E.g. Engineering Sync"
              value={summary}
              onChange={e => setSummary(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wider">Start Time</label>
              <input 
                type="datetime-local"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500/50"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wider">End Time</label>
              <input 
                type="datetime-local"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500/50"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wider">Attendees (comma separated)</label>
            <input 
              className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500/50 font-mono"
              placeholder="alice@example.com, bob@example.com"
              value={attendeeStr}
              onChange={e => setAttendeeStr(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wider">Location</label>
            <input 
              className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500/50"
              placeholder="Google Meet or physical location"
              value={location}
              onChange={e => setLocation(e.target.value)}
            />
          </div>
          
          <label className="flex items-center gap-2 cursor-pointer mt-1">
            <input 
              type="checkbox" 
              className="rounded bg-zinc-900 border-zinc-800 text-emerald-500 focus:ring-emerald-500/20 w-4 h-4"
              checked={sendInvites}
              onChange={e => setSendInvites(e.target.checked)}
            />
            <span className="text-sm text-zinc-300">Send email invitations to attendees</span>
          </label>
        </div>

        <div className="px-5 py-4 border-t border-zinc-800 flex justify-end gap-2 bg-zinc-900/50">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={createEvent.isPending || !summary}
            className="bg-emerald-500 hover:bg-emerald-600 text-black px-5 py-2 rounded font-semibold text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {createEvent.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Create Event
          </button>
        </div>
      </div>
    </div>
  );
}
