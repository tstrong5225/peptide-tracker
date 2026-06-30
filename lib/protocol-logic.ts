// Adherence/calendar math ported from the v2 prototype's getProtoAdherence(),
// plus the calendar + reminder logic shown in the Extended Features design.

import type { Database } from "@/lib/supabase/types";

export type ProtocolRow = Database["public"]["Tables"]["protocols"]["Row"];

export const PROTOCOL_PATTERNS = [
  { value: "daily", label: "Daily", sub: "Every day" },
  { value: "xony", label: "X on / Y off", sub: "Repeating cycle" },
  { value: "fixed", label: "Fixed-duration course", sub: "Defined start & end date" },
  { value: "weekly", label: "Weekly schedule", sub: "Choose specific days" },
] as const;

export const PATTERN_LABELS: Record<string, string> = Object.fromEntries(
  PROTOCOL_PATTERNS.map((p) => [p.value, p.label]),
);

// 0 = Sunday, matching Date.getDay()
export const WEEKDAYS = [
  { value: 0, label: "S" },
  { value: 1, label: "M" },
  { value: 2, label: "T" },
  { value: 3, label: "W" },
  { value: 4, label: "T" },
  { value: 5, label: "F" },
  { value: 6, label: "S" },
];

export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function getProtocolStatus(
  proto: Pick<ProtocolRow, "start_date" | "duration">,
  today: Date = new Date(),
): "active" | "completed" | "upcoming" {
  const start = new Date(`${proto.start_date}T00:00:00`);
  const now = new Date(today);
  now.setHours(0, 0, 0, 0);
  const end = new Date(start.getTime() + proto.duration * 86400000);
  if (now < start) return "upcoming";
  if (now >= end) return "completed";
  return "active";
}

export type Adherence = {
  scheduled: number;
  completed: number;
  total: number;
  pct: number;
  remaining: number;
};

export function getProtocolAdherence(
  proto: Pick<ProtocolRow, "start_date" | "duration">,
  dosedDates: Set<string>,
  today: Date = new Date(),
): Adherence {
  const start = new Date(`${proto.start_date}T00:00:00`);
  const now = new Date(today);
  now.setHours(0, 0, 0, 0);
  const total = proto.duration;
  const elapsed = Math.min(total, Math.max(0, Math.round((now.getTime() - start.getTime()) / 86400000)));

  let completed = 0;
  for (let i = 0; i < elapsed; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    if (dosedDates.has(dateKey(d))) completed++;
  }

  return {
    scheduled: elapsed,
    completed,
    total,
    pct: elapsed > 0 ? Math.round((completed / elapsed) * 100) : 0,
    remaining: Math.max(0, total - elapsed),
  };
}

export type CalendarDay = {
  n: number;
  state: "completed" | "missed" | "upcoming";
  bg: string;
  fg: string;
  border: string;
};

export function buildProtocolCalendar(
  proto: Pick<ProtocolRow, "start_date" | "duration">,
  dosedDates: Set<string>,
  today: Date = new Date(),
): { leadingBlanks: number; days: CalendarDay[] } {
  const start = new Date(`${proto.start_date}T00:00:00`);
  const now = new Date(today);
  now.setHours(0, 0, 0, 0);
  const leadingBlanks = start.getDay(); // 0 = Sunday
  const days: CalendarDay[] = [];

  for (let i = 0; i < proto.duration; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const dosed = dosedDates.has(dateKey(d));
    const isFutureOrToday = d.getTime() >= now.getTime();

    let state: CalendarDay["state"];
    if (dosed) state = "completed";
    else if (!isFutureOrToday) state = "missed";
    else state = "upcoming";

    days.push({
      n: d.getDate(),
      state,
      bg: state === "completed" ? "var(--pt-info-fg)" : state === "missed" ? "var(--pt-danger-bg)" : "var(--pt-surface-soft)",
      fg: state === "completed" ? "white" : state === "missed" ? "var(--pt-danger-fg)" : "var(--pt-muted-2)",
      border: state === "completed" ? "var(--pt-info-fg)" : state === "missed" ? "var(--pt-danger-border)" : "var(--pt-border-soft)",
    });
  }

  return { leadingBlanks, days };
}

export function getStreak(dosedDates: Set<string>, today: Date = new Date()): number {
  let streak = 0;
  const d = new Date(today);
  d.setHours(0, 0, 0, 0);
  while (dosedDates.has(dateKey(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export function matchesPeptide(vialName: string, protocolPeptide: string): boolean {
  const a = vialName.trim().toLowerCase();
  const b = protocolPeptide.trim().toLowerCase();
  if (!a || !b) return false;
  return a.includes(b) || b.includes(a);
}

export function isReminderDue(
  proto: Pick<ProtocolRow, "start_date" | "duration" | "reminder_time">,
  dosedToday: boolean,
  now: Date = new Date(),
): boolean {
  if (!proto.reminder_time || dosedToday) return false;
  if (getProtocolStatus(proto, now) !== "active") return false;
  const [h, m] = proto.reminder_time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return false;
  const reminderMinutes = h * 60 + m;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return nowMinutes >= reminderMinutes;
}
