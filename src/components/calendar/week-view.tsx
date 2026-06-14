"use client";
import { useState } from "react";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { api } from "@/trpc/react";
import { CreateEventModal } from "./create-event-modal";

export function WeekView() {
  const [currentWeek, setCurrentWeek] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const [showModal, setShowModal] = useState(false);

  const { data: events = [] } = api.calendar.getWeekEvents.useQuery({
    weekStart: currentWeek.toISOString(),
  });

  const days = Array.from({ length: 7 }).map((_, i) => addDays(currentWeek, i));

  return (
    <div
      className="flex flex-1 flex-col overflow-hidden"
      style={{ background: "var(--bg-0)" }}
    >
      <div
        className="flex items-center justify-between border-b px-6 py-3"
        style={{ borderColor: "var(--border-0)", background: "var(--bg-1)" }}
      >
        <h1 className="text-title" style={{ color: "var(--text-0)" }}>
          Calendar
        </h1>
        <button
          onClick={() => setShowModal(true)}
          className="text-small rounded px-3 py-1.5 font-medium transition-colors hover:opacity-90"
          style={{ background: "var(--accent)", color: "#000" }}
        >
          New Event
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {days.map((day) => {
          const dayEvents = (events as any[]).filter((e) =>
            isSameDay(
              new Date(
                e.data?.start?.dateTime ||
                  e.start?.dateTime ||
                  e.updated_at ||
                  e.updated ||
                  new Date(),
              ),
              day,
            ),
          );
          return (
            <div
              key={day.toISOString()}
              className="flex flex-1 flex-col border-r"
              style={{ borderColor: "var(--border-0)" }}
            >
              <div
                className="flex flex-col items-center border-b p-3 text-center"
                style={{
                  borderColor: "var(--border-0)",
                  background: "var(--bg-2)",
                }}
              >
                <p
                  className="text-micro mb-0.5"
                  style={{ color: "var(--text-2)" }}
                >
                  {format(day, "EEE").toUpperCase()}
                </p>
                <p
                  className="text-title flex h-7 w-7 items-center justify-center rounded-full"
                  style={{
                    color: isSameDay(day, new Date())
                      ? "#000"
                      : "var(--text-0)",
                    background: isSameDay(day, new Date())
                      ? "var(--accent)"
                      : "transparent",
                  }}
                >
                  {format(day, "d")}
                </p>
              </div>
              <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2">
                {dayEvents.map((event: any) => (
                  <div
                    key={event.id || event.entity_id}
                    className="cursor-pointer rounded p-2 transition-colors hover:opacity-80"
                    style={{
                      background: "var(--bg-3)",
                      border: "1px solid var(--border-1)",
                      borderLeft: "2px solid var(--accent)",
                    }}
                  >
                    <p
                      className="text-small mb-1 truncate font-medium"
                      style={{ color: "var(--text-0)" }}
                    >
                      {event.data?.summary || event.summary || "(No title)"}
                    </p>
                    <p
                      className="text-micro"
                      style={{ color: "var(--text-2)" }}
                    >
                      {event.data?.start?.dateTime || event.start?.dateTime
                        ? format(
                            new Date(
                              event.data?.start?.dateTime ||
                                event.start?.dateTime,
                            ),
                            "h:mm a",
                          )
                        : "All day"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {showModal && <CreateEventModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
