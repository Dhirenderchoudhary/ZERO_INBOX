"use client";

import { useState, useMemo } from "react";
import {
  addDays,
  format,
  isSameDay,
  startOfWeek,
  startOfMonth,
  addMonths,
  isSameMonth,
} from "date-fns";
import { CalendarPlus, ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CreateEventModal } from "./create-event-modal";
import { EventDetailModal } from "./event-detail-modal";
import { cn } from "@/lib/utils";

export function WeekView() {
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("week");
  const [baseDate, setBaseDate] = useState(() => new Date());
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const days = useMemo(() => {
    if (viewMode === "day") {
      return [baseDate];
    }
    if (viewMode === "week") {
      const start = startOfWeek(baseDate, { weekStartsOn: 1 });
      return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
    }
    if (viewMode === "month") {
      const start = startOfWeek(startOfMonth(baseDate), { weekStartsOn: 1 });
      return Array.from({ length: 35 }).map((_, i) => addDays(start, i));
    }
    return [];
  }, [viewMode, baseDate]);

  const { data: events = [] } = api.calendar.getEventsRange.useQuery(
    {
      start: days[0]?.toISOString() || "",
      end: days[days.length - 1]
        ? addDays(days[days.length - 1]!, 1).toISOString()
        : "",
    },
    { enabled: days.length > 0 },
  );

  const nextRange = () => {
    if (viewMode === "day") setBaseDate(addDays(baseDate, 1));
    if (viewMode === "week") setBaseDate(addDays(baseDate, 7));
    if (viewMode === "month") setBaseDate(addMonths(baseDate, 1));
  };

  const prevRange = () => {
    if (viewMode === "day") setBaseDate(addDays(baseDate, -1));
    if (viewMode === "week") setBaseDate(addDays(baseDate, -7));
    if (viewMode === "month") setBaseDate(addMonths(baseDate, -1));
  };

  const COLORS = [
    { solid: "bg-[#039be5] text-white", dot: "bg-[#039be5]" }, // Google Blue
    { solid: "bg-[#33b679] text-white", dot: "bg-[#33b679]" }, // Google Green (Buddha Purnima)
    { solid: "bg-[#d50000] text-white", dot: "bg-[#d50000]" }, // Google Red
    { solid: "bg-[#f4511e] text-white", dot: "bg-[#f4511e]" }, // Google Orange
    { solid: "bg-[#8e24aa] text-white", dot: "bg-[#8e24aa]" }, // Google Purple
  ];

  const getColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return COLORS[Math.abs(hash) % COLORS.length] || COLORS[0]!;
  };

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex h-full max-w-7xl flex-col gap-6">
        <section className="border-border/70 bg-card flex flex-col gap-4 rounded-2xl border p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Badge variant="outline" className="mb-3 rounded-full">
              Scheduling
            </Badge>
            <h2 className="text-2xl font-semibold tracking-tight">
              {viewMode === "day" && format(baseDate, "MMMM d, yyyy")}
              {viewMode === "week" &&
                `Week of ${format(startOfWeek(baseDate, { weekStartsOn: 1 }), "MMM d")}`}
              {viewMode === "month" && format(baseDate, "MMMM yyyy")}
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Coordinate meetings, focus blocks, and automated holds.
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {/* View Switcher */}
            <div className="bg-muted/50 flex rounded-lg p-1 text-sm">
              {(["day", "week", "month"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setViewMode(v)}
                  className={cn(
                    "rounded-md px-3 py-1.5 font-medium capitalize transition-colors",
                    viewMode === v
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {v}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="icon"
                className="rounded-xl"
                onClick={prevRange}
              >
                <ChevronLeft size={16} />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="rounded-xl"
                onClick={nextRange}
              >
                <ChevronRight size={16} />
              </Button>
              <Button onClick={() => setShowModal(true)} className="rounded-xl">
                <CalendarPlus size={16} /> New event
              </Button>
            </div>
          </div>
        </section>

        <Card className="min-h-[640px] overflow-hidden">
          <CardContent
            className={cn(
              "grid h-full min-h-[640px] p-0",
              viewMode === "day" ? "grid-cols-1" : "grid-cols-1 md:grid-cols-7",
            )}
          >
            {days.map((day) => {
              const dayEvents = (events as any[]).filter((e) =>
                isSameDay(
                  new Date(
                    e.data?.start?.dateTime ||
                      e.data?.start?.date ||
                      e.start?.dateTime ||
                      e.start?.date ||
                      e.updated_at ||
                      e.updated ||
                      new Date(),
                  ),
                  day,
                ),
              );

              const allDayEvents = dayEvents.filter(
                (e) => !(e.data?.start?.dateTime || e.start?.dateTime),
              );
              const timedEvents = dayEvents
                .filter((e) => e.data?.start?.dateTime || e.start?.dateTime)
                .sort((a, b) => {
                  const dateA = new Date(
                    a.data?.start?.dateTime || a.start?.dateTime,
                  ).getTime();
                  const dateB = new Date(
                    b.data?.start?.dateTime || b.start?.dateTime,
                  ).getTime();
                  return dateA - dateB;
                });

              const isCurrentMonth =
                viewMode === "month" ? isSameMonth(day, baseDate) : true;

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "border-border/70 border-b md:border-r md:border-b-0 last:md:border-r-0",
                    viewMode === "month" && "border-b md:border-b", // Months have borders on all sides
                    viewMode === "month" &&
                      !isCurrentMonth &&
                      "bg-muted/10 opacity-60",
                    viewMode === "month" ? "min-h-[120px]" : "min-h-[220px]",
                  )}
                >
                  <div className="border-border/70 bg-card/95 sticky top-0 z-10 border-b p-2 text-center backdrop-blur">
                    {viewMode !== "month" && (
                      <p className="text-muted-foreground text-[10px] font-semibold tracking-[0.16em] uppercase">
                        {format(day, "EEE")}
                      </p>
                    )}
                    {viewMode === "month" &&
                      day.getDay() === 1 &&
                      days.indexOf(day) < 7 && (
                        <p className="text-muted-foreground hidden text-[10px] font-semibold tracking-[0.16em] uppercase md:block">
                          {format(day, "EEE")}
                        </p>
                      )}
                    <div
                      className={cn(
                        "flex justify-center",
                        viewMode !== "month" && "mt-1",
                      )}
                    >
                      <span
                        className={cn(
                          "flex items-center justify-center rounded-full text-sm font-semibold",
                          isSameDay(day, new Date())
                            ? "size-7 bg-blue-600 text-white"
                            : "text-foreground size-7 bg-transparent",
                        )}
                      >
                        {format(day, "d")}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 p-1.5">
                    {dayEvents.length === 0 ? (
                      viewMode !== "month" && (
                        <div className="text-muted-foreground/50 mt-2 text-center text-xs font-medium">
                          No events
                        </div>
                      )
                    ) : (
                      <>
                        {/* All-Day Events */}
                        {allDayEvents.map((event: any) => {
                          const title =
                            event.data?.summary ||
                            event.summary ||
                            "(No title)";
                          const color = getColor(title);
                          return (
                            <button
                              key={event.id || event.entity_id}
                              className={`w-full rounded-[4px] px-1.5 py-0.5 text-left text-[10px] font-bold tracking-tight shadow-sm transition-all hover:brightness-110 sm:text-[11px] ${color.solid}`}
                              onClick={() => setSelectedEvent(event)}
                            >
                              <p className="truncate">{title}</p>
                            </button>
                          );
                        })}

                        {/* Timed Events */}
                        {timedEvents.map((event: any) => {
                          const title =
                            event.data?.summary ||
                            event.summary ||
                            "(No title)";
                          const color = getColor(title);
                          const startDateTime =
                            event.data?.start?.dateTime ||
                            event.start?.dateTime;
                          return (
                            <button
                              key={event.id || event.entity_id}
                              className="group hover:bg-muted/50 flex w-full items-start gap-1 rounded-md px-1 py-0.5 text-left text-[10px] transition-colors sm:text-[11px]"
                              onClick={() => setSelectedEvent(event)}
                            >
                              <span
                                className={`mt-[5px] size-1.5 shrink-0 rounded-full ${color.dot}`}
                              />
                              <div className="flex flex-col overflow-hidden leading-tight">
                                <span
                                  className={cn(
                                    "text-foreground/80 group-hover:text-foreground font-semibold",
                                    viewMode === "month" && "hidden",
                                  )}
                                >
                                  {format(new Date(startDateTime), "h:mm a")}
                                </span>
                                <span
                                  className={cn(
                                    "text-muted-foreground group-hover:text-foreground/90 truncate font-medium",
                                    viewMode === "month" &&
                                      "text-foreground/80",
                                  )}
                                >
                                  {viewMode === "month"
                                    ? `${format(new Date(startDateTime), "h:mm")} ${title}`
                                    : title}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {showModal && <CreateEventModal onClose={() => setShowModal(false)} />}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
}
