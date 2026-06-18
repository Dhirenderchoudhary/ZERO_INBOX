"use client";

import { api as trpc } from "@/trpc/react";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
} from "lucide-react";
import { LoadingDots } from "@/components/ui/LoadingDots";
import { motion, AnimatePresence } from "framer-motion";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });

  const { data: events, isLoading } = trpc.calendar.getWeekEvents.useQuery({
    weekStart: weekStart.toISOString(),
  });

  const nextWeek = () => setCurrentDate(addDays(currentDate, 7));
  const prevWeek = () => setCurrentDate(addDays(currentDate, -7));
  const today = () => setCurrentDate(new Date());

  const days = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  return (
    <div className="flex h-full flex-col">
      <header className="border-border/50 bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10 flex items-center justify-between border-b px-6 py-4 backdrop-blur">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <CalendarIcon size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Calendar</h1>
            <p className="text-muted-foreground text-sm">
              Manage your schedule seamlessly
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={today}>
            Today
          </Button>
          <div className="border-border/50 ml-2 flex items-center gap-1 rounded-md border">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={prevWeek}
            >
              <ChevronLeft size={16} />
            </Button>
            <div className="w-32 px-2 text-center text-sm font-medium">
              {format(weekStart, "MMM d")} -{" "}
              {format(addDays(weekStart, 6), "MMM d")}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={nextWeek}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </header>

      <main className="bg-muted/20 flex-1 overflow-auto p-6">
        <div className="grid h-full min-w-[800px] grid-cols-7 gap-4">
          {days.map((day) => {
            const dayEvents =
              events?.filter((e: any) => {
                const eventDate = e.start?.dateTime
                  ? new Date(e.start.dateTime)
                  : e.start?.date
                    ? new Date(e.start.date)
                    : null;
                return eventDate && isSameDay(eventDate, day);
              }) || [];

            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={day.toISOString()}
                className="flex h-full min-h-[600px] flex-col"
              >
                <div
                  className={`mb-4 border-b-2 pb-2 text-center ${isToday ? "border-indigo-500 text-indigo-600 dark:text-indigo-400" : "border-border/50 text-muted-foreground"}`}
                >
                  <div className="text-sm font-medium tracking-wider uppercase">
                    {format(day, "EEE")}
                  </div>
                  <div
                    className={`mt-1 text-2xl ${isToday ? "font-bold" : "font-semibold"}`}
                  >
                    {format(day, "d")}
                  </div>
                </div>

                <div className="relative flex-1 space-y-3">
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <LoadingDots />
                    </div>
                  )}

                  <AnimatePresence mode="popLayout">
                    {dayEvents.map((event: any) => (
                      <motion.div
                        key={event.id}
                        layout
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className="bg-background border-border/60 group cursor-pointer rounded-lg border p-3 shadow-sm transition-shadow hover:shadow-md"
                      >
                        <div className="mb-1 flex items-center gap-1 text-xs font-semibold text-indigo-500">
                          <Clock size={12} />
                          {event.start?.dateTime
                            ? format(new Date(event.start.dateTime), "h:mm a")
                            : "All Day"}
                        </div>
                        <h3 className="mb-2 line-clamp-2 text-sm leading-tight font-medium transition-colors group-hover:text-indigo-600">
                          {event.summary || "Untitled Event"}
                        </h3>
                        {event.location && (
                          <div className="text-muted-foreground mt-2 flex items-start gap-1 text-xs">
                            <MapPin size={12} className="mt-0.5 shrink-0" />
                            <span className="line-clamp-1">
                              {event.location}
                            </span>
                          </div>
                        )}
                        {event.attendees && event.attendees.length > 0 && (
                          <div className="mt-2 flex items-center gap-1">
                            <Badge
                              variant="secondary"
                              className="rounded-sm px-1.5 py-0 text-[10px]"
                            >
                              {event.attendees.length} attendees
                            </Badge>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {!isLoading && dayEvents.length === 0 && (
                    <div className="border-border/50 bg-muted/10 flex h-full w-full items-center justify-center rounded-lg border border-dashed opacity-50"></div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
