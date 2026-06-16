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
                        className={`flex size-9 items-center justify-center rounded-full text-sm font-semibold ${isSameDay(day, new Date()) ? "bg-blue-600 text-white" : "text-foreground bg-transparent"}`}
                      >
                        {format(day, "d")}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 p-2">
                    {dayEvents.length === 0 ? (
                      <div className="text-muted-foreground/50 mt-2 text-center text-xs font-medium">
                        No events
                      </div>
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
                              className={`w-full rounded-[4px] px-2 py-1 text-left text-[11px] font-bold tracking-tight shadow-sm transition-all hover:brightness-110 ${color.solid}`}
                              onClick={() => {
                                const link =
                                  event.data?.htmlLink || event.htmlLink;
                                if (link) window.open(link, "_blank");
                              }}
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
                              className="group hover:bg-muted/50 flex w-full items-start gap-1.5 rounded-md px-1.5 py-1 text-left text-[11px] transition-colors"
                              onClick={() => {
                                const link =
                                  event.data?.htmlLink || event.htmlLink;
                                if (link) window.open(link, "_blank");
                              }}
                            >
                              <span
                                className={`mt-[5px] size-2 shrink-0 rounded-full ${color.dot}`}
                              />
                              <div className="flex flex-col overflow-hidden">
                                <span className="text-foreground/80 group-hover:text-foreground font-semibold">
                                  {format(new Date(startDateTime), "h:mm a")}
                                </span>
                                <span className="text-muted-foreground group-hover:text-foreground/90 truncate font-medium">
                                  {title}
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
    </div>
  );
}
