"use client";
import { useState } from "react";
import { X, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { api } from "@/trpc/react";
import { format, addHours } from "date-fns";

export function CreateEventModal({ onClose }: { onClose: () => void }) {
  const [summary, setSummary] = useState("");
  const [startTime, setStartTime] = useState(
    format(new Date(), "yyyy-MM-dd'T'HH:mm"),
  );
  const [endTime, setEndTime] = useState(
    format(addHours(new Date(), 1), "yyyy-MM-dd'T'HH:mm"),
  );
  const [attendees, setAttendees] = useState("");

  const create = api.calendar.createEvent.useMutation({
    onSuccess: () => onClose(),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className="w-[400px] overflow-hidden rounded-xl shadow-2xl"
        style={{
          background: "var(--bg-2)",
          border: "1px solid var(--border-1)",
        }}
      >
        <div
          className="flex items-center justify-between border-b px-4 py-3"
          style={{ borderColor: "var(--border-0)" }}
        >
          <span
            className="text-small font-semibold"
            style={{ color: "var(--text-0)" }}
          >
            New Event
          </span>
          <button
            onClick={onClose}
            className="rounded p-1 hover:opacity-80"
            style={{ color: "var(--text-2)" }}
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex flex-col gap-3 p-4">
          <div>
            <label
              className="text-micro mb-1 block"
              style={{ color: "var(--text-2)" }}
            >
              Event Title
            </label>
            <input
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              autoFocus
              className="text-small w-full rounded px-3 py-1.5 outline-none"
              style={{
                background: "var(--bg-3)",
                color: "var(--text-0)",
                border: "1px solid var(--border-1)",
              }}
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label
                className="text-micro mb-1 block"
                style={{ color: "var(--text-2)" }}
              >
                Start Time
              </label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="text-small w-full rounded px-3 py-1.5 outline-none"
                style={{
                  background: "var(--bg-3)",
                  color: "var(--text-0)",
                  border: "1px solid var(--border-1)",
                }}
              />
            </div>
            <div className="flex-1">
              <label
                className="text-micro mb-1 block"
                style={{ color: "var(--text-2)" }}
              >
                End Time
              </label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="text-small w-full rounded px-3 py-1.5 outline-none"
                style={{
                  background: "var(--bg-3)",
                  color: "var(--text-0)",
                  border: "1px solid var(--border-1)",
                }}
              />
            </div>
          </div>

          <div>
            <label
              className="text-micro mb-1 block"
              style={{ color: "var(--text-2)" }}
            >
              Attendees (comma separated)
            </label>
            <input
              value={attendees}
              onChange={(e) => setAttendees(e.target.value)}
              className="text-small w-full rounded px-3 py-1.5 outline-none"
              style={{
                background: "var(--bg-3)",
                color: "var(--text-0)",
                border: "1px solid var(--border-1)",
              }}
            />
          </div>
        </div>

        <div
          className="flex justify-end border-t px-4 py-3"
          style={{ borderColor: "var(--border-0)", background: "var(--bg-1)" }}
        >
          <button
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
            className="text-small flex items-center gap-2 rounded px-4 py-1.5 font-medium transition-colors hover:opacity-90 disabled:opacity-50"
            style={{ background: "var(--accent)", color: "#000" }}
          >
            {create.isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <CalendarIcon size={14} />
            )}
            Create Event
          </button>
        </div>
      </div>
    </div>
  );
}
