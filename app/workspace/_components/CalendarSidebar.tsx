"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import type { ReactElement } from "react";
import { ChevronLeft, ChevronRight, Plus } from "../../_components/voyage/shared/icons";

export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO datetime
  end: string;   // ISO datetime
  allDay: boolean;
}

const HOUR_PX = 48;
const DAY_START_HOUR = 6;
const DAY_END_HOUR = 22;

// --- Create Event modal -----------------------------------------------------

function CreateEventModal({
  open,
  onClose,
  selectedDate,
}: {
  open: boolean;
  onClose: () => void;
  selectedDate: Date;
}): ReactElement | null {
  const [summary, setSummary] = useState("");
  const [startHour, setStartHour] = useState("09:00");
  const [endHour, setEndHour] = useState("10:00");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const summaryRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setSummary("");
      setStartHour("09:00");
      setEndHour("10:00");
      setResult(null);
      setTimeout(() => summaryRef.current?.focus(), 50);
    }
  }, [open]);

  if (!open) return null;

  const toISO = (date: Date, time: string): string => {
    const [h, m] = time.split(":").map(Number);
    const d = new Date(date);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  };

  const handleCreate = (): void => {
    if (!summary.trim()) return;
    setSaving(true);
    setResult(null);

    const startISO = toISO(selectedDate, startHour);
    const endISO = toISO(selectedDate, endHour);

    fetch("/api/calendar/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ summary, start: startISO, end: endISO }),
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Failed to create event");
        setResult("Event created!");
        setTimeout(onClose, 1200);
      })
      .catch((err) => setResult(err.message || "Failed to create event."))
      .finally(() => setSaving(false));
  };

  const dateLabel = selectedDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#0a0a0f] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <h3 className="text-[15px] font-semibold text-white">New Event</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/40 hover:bg-white/[0.06] hover:text-white transition-colors"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Fields */}
        <div className="flex flex-col gap-0 border-b border-white/[0.06]">
          <div className="flex items-center border-b border-white/[0.04] px-5 py-3">
            <label className="w-20 text-[12px] text-white/45">Title</label>
            <input
              ref={summaryRef}
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Event summary"
              className="flex-1 bg-transparent text-[13px] text-white placeholder:text-white/30 outline-none"
            />
          </div>
          <div className="px-5 py-3 text-[12px] text-white/55">{dateLabel}</div>
          <div className="flex items-center border-b border-white/[0.04] px-5 py-3">
            <label className="w-20 text-[12px] text-white/45">Start</label>
            <input
              type="time"
              value={startHour}
              onChange={(e) => setStartHour(e.target.value)}
              className="flex-1 bg-transparent text-[13px] text-white outline-none [color-scheme:dark]"
            />
          </div>
          <div className="flex items-center px-5 py-3">
            <label className="w-20 text-[12px] text-white/45">End</label>
            <input
              type="time"
              value={endHour}
              onChange={(e) => setEndHour(e.target.value)}
              className="flex-1 bg-transparent text-[13px] text-white outline-none [color-scheme:dark]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/[0.06] px-5 py-3">
          <div className="text-[12px]">
            {result && (
              <span className={result.includes("created") ? "text-green-400" : "text-red-400"}>
                {result}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-[13px] text-white/60 hover:bg-white/[0.06] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={saving || !summary.trim()}
              className="flex items-center gap-2 rounded-lg bg-[var(--accent-neon)] px-4 py-2 text-[13px] font-semibold text-black hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" />
              {saving ? "Creating..." : "Create"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CalendarSidebar({
  events,
  selectedDate,
  onSelectDate,
}: {
  events: CalendarEvent[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}): ReactElement {
  const today = useMemo(() => new Date(), []);
  const [viewMonth, setViewMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [nowMs, setNowMs] = useState(Date.now());
  const [createOpen, setCreateOpen] = useState(false);

  // Tick the now-line every 30 seconds
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  // Month grid
  const monthGrid = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDow = firstDay.getDay(); // 0=Sun
    const totalDays = lastDay.getDate();

    const cells: Array<{ day: number; date: Date; muted: boolean; isToday: boolean }> = [];
    // Leading muted days
    for (let i = 0; i < startDow; i++) {
      const d = new Date(year, month, -(startDow - 1 - i));
      cells.push({ day: d.getDate(), date: d, muted: true, isToday: false });
    }
    // Actual days
    for (let d = 1; d <= totalDays; d++) {
      const date = new Date(year, month, d);
      const isToday =
        d === today.getDate() &&
        month === today.getMonth() &&
        year === today.getFullYear();
      cells.push({ day: d, date, muted: false, isToday });
    }
    // Trailing muted days
    const remaining = 42 - cells.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      cells.push({ day: d.getDate(), date: d, muted: true, isToday: false });
    }
    return cells;
  }, [viewMonth, today]);

  const monthLabel = viewMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  // Events for selected day
  const dayEvents = useMemo(() => {
    const selYear = selectedDate.getFullYear();
    const selMonth = selectedDate.getMonth();
    const selDay = selectedDate.getDate();

    return events
      .filter((evt) => {
        const start = new Date(evt.start);
        return (
          start.getFullYear() === selYear &&
          start.getMonth() === selMonth &&
          start.getDate() === selDay
        );
      })
      .map((evt) => {
        const start = new Date(evt.start);
        const end = new Date(evt.end);
        const startHour = start.getHours() + start.getMinutes() / 60;
        const endHour = end.getHours() + end.getMinutes() / 60;
        return { ...evt, startHour, endHour };
      });
  }, [events, selectedDate]);

  // Day label
  const dayLabel = selectedDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // Now-line offset
  const nowDate = new Date(nowMs);
  const nowHour = nowDate.getHours() + nowDate.getMinutes() / 60;
  const showNowLine =
    nowDate.getFullYear() === selectedDate.getFullYear() &&
    nowDate.getMonth() === selectedDate.getMonth() &&
    nowDate.getDate() === selectedDate.getDate() &&
    nowHour >= DAY_START_HOUR &&
    nowHour <= DAY_END_HOUR;
  const nowOffsetPx = showNowLine ? (nowHour - DAY_START_HOUR) * HOUR_PX : -1;

  const goToToday = (): void => {
    setViewMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    onSelectDate(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
  };

  const prevMonth = (): void => {
    setViewMonth((v) => new Date(v.getFullYear(), v.getMonth() - 1, 1));
  };

  const nextMonth = (): void => {
    setViewMonth((v) => new Date(v.getFullYear(), v.getMonth() + 1, 1));
  };

  return (
    <div className="flex h-full flex-col">
      {/* Mini month */}
      <div className="px-5 pt-5 pb-3 border-b border-white/[0.05]">
        <div className="flex items-center justify-between">
          <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-white">
            {monthLabel}
          </h3>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={goToToday}
              className="rounded-md border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-white/85 hover:bg-white/[0.07] transition-colors"
            >
              Today
            </button>
            <button
              type="button"
              aria-label="Previous month"
              onClick={prevMonth}
              className="rounded-md p-1.5 text-white/55 hover:bg-white/[0.05] hover:text-white transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              aria-label="Next month"
              onClick={nextMonth}
              className="rounded-md p-1.5 text-white/55 hover:bg-white/[0.05] hover:text-white transition-colors"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Weekday header */}
        <div className="mt-4 grid grid-cols-7 text-center text-[10.5px] font-medium uppercase tracking-[0.15em] text-white/40">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="mt-1 grid grid-cols-7 gap-y-0.5 text-center text-[12.5px]">
          {monthGrid.map((d, i) => {
            const isSelected =
              !d.muted &&
              d.day === selectedDate.getDate() &&
              viewMonth.getMonth() === selectedDate.getMonth();
            return (
              <button
                type="button"
                key={i}
                onClick={() => {
                  if (!d.muted) onSelectDate(d.date);
                }}
                className={
                  "mx-auto flex h-7 w-7 items-center justify-center rounded-full transition-colors " +
                  (isSelected
                    ? "bg-[var(--accent-neon)] text-black"
                    : d.isToday
                    ? "border border-[var(--accent-neon)] text-white"
                    : d.muted
                    ? "text-white/25 hover:text-white/45"
                    : "text-white/70 hover:text-white")
                }
              >
                {d.day}
              </button>
            );
          })}
        </div>
      </div>

      {/* Day timeline */}
      <div className="flex-1 overflow-y-auto px-5 pt-5 pb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-[14px] font-semibold text-white">{dayLabel}</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-white/[0.12] bg-white/[0.06] px-3 py-1.5 text-[11.5px] font-medium text-white hover:bg-white/[0.10] transition-colors"
            >
              <Plus className="h-3 w-3" />
              Event
            </button>
          </div>
        </div>

        <div className="relative mt-4">
          {/* Hours */}
          <div className="flex flex-col">
            {Array.from(
              { length: DAY_END_HOUR - DAY_START_HOUR },
              (_, i) => DAY_START_HOUR + i,
            ).map((h) => (
              <div
                key={h}
                className="flex items-start gap-3"
                style={{ height: `${HOUR_PX}px` }}
              >
                <div className="w-9 shrink-0 -translate-y-1.5 text-[10.5px] uppercase tracking-wide text-white/35">
                  {formatHour(h)}
                </div>
                <div className="relative flex-1 border-t border-white/[0.05]" />
              </div>
            ))}
          </div>

          {/* Now-line */}
          {showNowLine && (
            <div
              className="absolute left-9 right-0 h-px bg-[var(--accent-neon)]/60"
              style={{ top: `${nowOffsetPx}px` }}
            />
          )}

          {/* Events */}
          {dayEvents.map((evt) => {
            const top = (evt.startHour - DAY_START_HOUR) * HOUR_PX;
            const height = Math.max((evt.endHour - evt.startHour) * HOUR_PX - 6, 24);
            return (
              <div
                key={evt.id}
                className="absolute"
                style={{
                  top: `${top + 4}px`,
                  left: "44px",
                  right: "0px",
                  height: `${height}px`,
                }}
              >
                <div className="h-full w-full rounded-lg border border-[var(--accent-neon)]/40 bg-[var(--accent-neon)]/20 p-2 text-[12px] leading-tight text-white">
                  <p className="font-semibold">{evt.title}</p>
                  <p className="mt-0.5 text-white/70 text-[11px]">
                    {formatHour(evt.startHour)} – {formatHour(evt.endHour)}
                  </p>
                </div>
              </div>
            );
          })}

          {/* Empty state */}
          {dayEvents.length === 0 && (
            <div className="flex items-center justify-center py-10 text-[12px] text-white/40">
              No events on this day.
            </div>
          )}
        </div>
      </div>

      <CreateEventModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        selectedDate={selectedDate}
      />
    </div>
  );
}

function formatHour(h: number): string {
  const hr = Math.floor(h);
  const min = Math.round((h - hr) * 60);
  const period = hr >= 12 ? "PM" : "AM";
  const display = hr > 12 ? hr - 12 : hr === 0 ? 12 : hr;
  return `${display}:${min.toString().padStart(2, "0")} ${period}`;
}
