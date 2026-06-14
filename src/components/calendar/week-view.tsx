"use client";

import { useState } from "react";
import { addDays, format, isSameDay, startOfWeek } from "date-fns";
import { CalendarPlus, ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex h-full max-w-7xl flex-col gap-6">
        <section className="border-border/70 bg-card flex flex-col gap-4 rounded-2xl border p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Badge variant="outline" className="mb-3 rounded-full">
              Scheduling
            </Badge>
            <h2 className="text-2xl font-semibold tracking-tight">
              Week of {format(currentWeek, "MMM d")}
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Coordinate meetings, focus blocks, and automated holds.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="icon"
              className="rounded-xl"
              onClick={() => setCurrentWeek((week) => addDays(week, -7))}
            >
              <ChevronLeft size={16} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-xl"
              onClick={() => setCurrentWeek((week) => addDays(week, 7))}
            >
              <ChevronRight size={16} />
            </Button>
            <Button onClick={() => setShowModal(true)} className="rounded-xl">
              <CalendarPlus size={16} /> New event
            </Button>
          </div>
        </section>

        <Card className="min-h-[640px] overflow-hidden">
          <CardContent className="grid h-full min-h-[640px] grid-cols-1 p-0 md:grid-cols-7">
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
                  className="border-border/70 min-h-[220px] border-b md:border-r md:border-b-0 last:md:border-r-0"
                >
                  <div className="border-border/70 bg-card/95 sticky top-0 z-10 border-b p-3 text-center backdrop-blur">
                    <p className="text-muted-foreground text-xs font-semibold tracking-[0.16em] uppercase">
                      {format(day, "EEE")}
                    </p>
                    <div className="mt-2 flex justify-center">
                      <span
                        className={`flex size-9 items-center justify-center rounded-full text-sm font-semibold ${isSameDay(day, new Date()) ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}
                      >
                        {format(day, "d")}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2 p-3">
                    {dayEvents.length === 0 ? (
                      <div className="border-border bg-muted/30 text-muted-foreground rounded-xl border border-dashed p-4 text-center text-xs">
                        Open for deep work
                      </div>
                    ) : (
                      dayEvents.map((event: any) => (
                        <button
                          key={event.id || event.entity_id}
                          className="border-border/70 bg-background/70 hover:bg-card w-full rounded-xl border border-l-4 border-l-blue-500 p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                        >
                          <p className="truncate text-sm font-semibold">
                            {event.data?.summary ||
                              event.summary ||
                              "(No title)"}
                          </p>
                          <p className="text-muted-foreground mt-1 font-mono text-xs">
                            {event.data?.start?.dateTime ||
                            event.start?.dateTime
                              ? format(
                                  new Date(
                                    event.data?.start?.dateTime ||
                                      event.start?.dateTime,
                                  ),
                                  "h:mm a",
                                )
                              : "All day"}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {showModal && <CreateEventModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
