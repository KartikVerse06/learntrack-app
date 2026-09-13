"use client";

import * as React from "react";
import { useState, useRef, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventClickArg } from "@fullcalendar/core";
import {
  CalendarDays,
  BookOpen,
  BrainCircuit,
  Timer,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getCalendarEventsAction } from "@/server/actions/calendar-actions";
import { EventDetailsDialog } from "./event-details-dialog";
import type { CalendarEventDTO, CalendarEventType } from "@/lib/calendar/calendar-event-mapper";

interface CalendarClientProps {
  userTimezone?: string;
}

export function CalendarClient({ userTimezone = "UTC" }: CalendarClientProps) {
  const calendarRef = useRef<FullCalendar | null>(null);

  const [selectedEvent, setSelectedEvent] = useState<CalendarEventDTO | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);

  // Filter toggles
  const [showTasks, setShowTasks] = useState(true);
  const [showRevisions, setShowRevisions] = useState(true);
  const [showFocusSessions, setShowFocusSessions] = useState(true);

  // Cached raw events from current range to filter client-side smoothly
  const rawEventsRef = useRef<CalendarEventDTO[]>([]);

  const fetchEvents = useCallback(
    async (
      fetchInfo: { startStr: string; endStr: string },
      successCallback: (events: CalendarEventDTO[]) => void,
      failureCallback: (error: Error) => void
    ) => {
      setIsLoadingEvents(true);
      try {
        const res = await getCalendarEventsAction(fetchInfo.startStr, fetchInfo.endStr);
        if (res.success) {
          rawEventsRef.current = res.data;
          const filtered = res.data.filter((e) => {
            if (e.extendedProps.type === "TASK" && !showTasks) return false;
            if (e.extendedProps.type === "REVISION" && !showRevisions) return false;
            if (e.extendedProps.type === "FOCUS_SESSION" && !showFocusSessions) return false;
            return true;
          });
          successCallback(filtered);
        } else {
          failureCallback(new Error(res.error.message));
        }
      } catch (err) {
        failureCallback(err instanceof Error ? err : new Error("Failed to load events"));
      } finally {
        setIsLoadingEvents(false);
      }
    },
    [showTasks, showRevisions, showFocusSessions]
  );

  // When filters toggle, refetch/re-render calendar
  const handleToggleFilter = (type: CalendarEventType) => {
    if (type === "TASK") setShowTasks((prev) => !prev);
    if (type === "REVISION") setShowRevisions((prev) => !prev);
    if (type === "FOCUS_SESSION") setShowFocusSessions((prev) => !prev);

    // Trigger FullCalendar refetch
    calendarRef.current?.getApi().refetchEvents();
  };

  // Event Click Handler
  const handleEventClick = (info: EventClickArg) => {
    const found = rawEventsRef.current.find((e) => e.id === info.event.id);
    if (found) {
      setSelectedEvent(found);
    } else {
      setSelectedEvent({
        id: info.event.id,
        title: info.event.title,
        start: info.event.startStr,
        end: info.event.endStr,
        allDay: info.event.allDay,
        backgroundColor: info.event.backgroundColor || "",
        borderColor: info.event.borderColor || "",
        textColor: info.event.textColor || "",
        extendedProps: (info.event.extendedProps || {}) as CalendarEventDTO["extendedProps"],
      });
    }
    setIsDialogOpen(true);
  };

  // Adapt view for mobile on mount
  React.useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 640) {
      calendarRef.current?.getApi().changeView("listWeek");
    }
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CalendarDays className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <span>Interactive Learning Calendar</span>
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Holistic perspective on planned topics, 45-minute focus blocks, and spaced revisions.
          </p>
        </div>

        {/* Filter Toggle Strip */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => handleToggleFilter("TASK")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all min-h-[38px] ${
              showTasks
                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                : "bg-background text-muted-foreground border-input hover:bg-muted/40"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Tasks</span>
          </button>

          <button
            type="button"
            onClick={() => handleToggleFilter("REVISION")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all min-h-[38px] ${
              showRevisions
                ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                : "bg-background text-muted-foreground border-input hover:bg-muted/40"
            }`}
          >
            <BrainCircuit className="h-3.5 w-3.5" />
            <span>Revisions</span>
          </button>

          <button
            type="button"
            onClick={() => handleToggleFilter("FOCUS_SESSION")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all min-h-[38px] ${
              showFocusSessions
                ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                : "bg-background text-muted-foreground border-input hover:bg-muted/40"
            }`}
          >
            <Timer className="h-3.5 w-3.5" />
            <span>Focus</span>
          </button>

          {isLoadingEvents && (
            <span className="p-1 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </span>
          )}
        </div>
      </div>

      {/* Calendar Card Container */}
      <Card className="shadow-sm overflow-hidden">
        <CardContent className="p-2 sm:p-6">
          <div className="learntrack-calendar-container overflow-x-auto">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,listWeek",
              }}
              events={fetchEvents}
              eventClick={handleEventClick}
              editable={false}
              selectable={false}
              dayMaxEvents={2}
              timeZone={userTimezone}
              height="auto"
              eventClassNames="cursor-pointer transition-transform hover:scale-[1.02] text-xs font-medium px-1.5 py-0.5 rounded shadow-xs truncate"
            />
          </div>
        </CardContent>
      </Card>

      {/* Event Details Popover / Dialog */}
      <EventDetailsDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        event={selectedEvent}
      />

      <style jsx global>{`
        .fc {
          --fc-border-color: hsl(var(--border));
          --fc-page-bg-color: transparent;
          --fc-neutral-bg-color: hsl(var(--muted));
          --fc-list-event-hover-bg-color: hsl(var(--muted));
          --fc-today-bg-color: hsl(var(--primary) / 0.05);
          font-family: inherit;
        }
        .fc .fc-toolbar {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          justify-content: space-between;
          align-items: center;
        }
        @media (max-width: 639px) {
          .fc .fc-toolbar {
            flex-direction: column;
            align-items: stretch;
            gap: 0.75rem;
          }
          .fc .fc-toolbar-chunk {
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
          }
          .fc .fc-toolbar-title {
            text-align: center;
            width: 100%;
          }
        }
        .fc .fc-toolbar-title {
          font-size: 1rem;
          font-weight: 700;
          color: hsl(var(--foreground));
        }
        @media (min-width: 640px) {
          .fc .fc-toolbar-title {
            font-size: 1.125rem;
          }
        }
        .fc .fc-button {
          background-color: hsl(var(--background));
          border-color: hsl(var(--border));
          color: hsl(var(--foreground));
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.4rem 0.75rem;
          border-radius: 0.5rem;
          text-transform: capitalize;
          box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
          transition: all 0.15s ease;
          min-height: 40px;
        }
        .fc .fc-button:hover {
          background-color: hsl(var(--muted));
          border-color: hsl(var(--border));
          color: hsl(var(--foreground));
        }
        .fc .fc-button-primary:not(:disabled).fc-button-active,
        .fc .fc-button-primary:not(:disabled):active {
          background-color: hsl(var(--primary));
          border-color: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
        }
        .fc .fc-button:disabled {
          opacity: 0.5;
        }
        .fc-theme-standard th {
          border-color: hsl(var(--border));
          padding: 0.4rem 0;
          font-size: 0.7rem;
          font-weight: 600;
          color: hsl(var(--muted-foreground));
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .fc-theme-standard td {
          border-color: hsl(var(--border));
        }
        .fc .fc-daygrid-day-number {
          font-size: 0.75rem;
          font-weight: 600;
          color: hsl(var(--foreground));
          padding: 0.25rem 0.375rem;
        }
        .fc .fc-daygrid-day.fc-day-today {
          background-color: hsl(var(--primary) / 0.06) !important;
        }
        .fc .fc-list-day-cdate,
        .fc .fc-list-day-text {
          font-size: 0.8125rem;
          font-weight: 700;
          color: hsl(var(--foreground));
        }
      `}</style>
    </div>
  );
}
