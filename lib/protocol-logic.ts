import type { Database } from "@/lib/supabase/types";

export type ProtocolRow = Database["public"]["Tables"]["protocols"]["Row"];

export const PROTOCOL_PATTERNS = [
  { value: "daily", label: "Daily", sub: "Every day" },
  { value: "xony", label: "X on / Y off", sub: "Repeating cycle (e.g. 5 on, 2 off)" },
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

// Returns a human-readable label for a protocol's pattern, including cycle numbers.
export function patternLabel(proto: Pick<ProtocolRow, "pattern" | "cycle_on" | "cycle_off">): string {
  if (proto.pattern === "xony") {
    const on = proto.cycle_on ?? 5;
    const off = proto.cycle_off ?? 2;
    return `${on} on / ${off} off`;
  }
  return PATTERN_LABELS[proto.pattern] ?? proto.pattern;
}

// Whether a given day-index (0 = start_date) is a scheduled dose day.
export function isDoseDay(
  proto: Pick<ProtocolRow, "pattern" | "cycle_on" | "cycle_off" | "selected_days">,
  dayIndex: number,
  dayOfWeek?: number,
): boolean {
  if (proto.pattern === "xony") {
    const on = proto.cycle_on ?? 5;
    const off = proto.cycle_off ?? 2;
    return dayIndex % (on + off) < on;
  }
  if (proto.pattern === "weekly" && dayOfWeek !== undefined) {
    return (proto.selected_days as number[]).includes(dayOfWeek);
  }
  return true;
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
  proto: Pick<ProtocolRow, "start_date" | "duration" | "pattern" | "cycle_on" | "cycle_off" | "selected_days">,
  dosedDates: Set<string>,
  today: Date = new Date(),
): Adherence {
  const start = new Date(`${proto.start_date}T00:00:00`);
  const now = new Date(today);
  now.setHours(0, 0, 0, 0);
  const total = proto.duration;
  const elapsed = Math.min(total, Math.max(0, Math.round((now.getTime() - start.getTime()) / 86400000)));

  let scheduled = 0;
  let completed = 0;

  for (let i = 0; i < elapsed; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    if (!isDoseDay(proto, i, d.getDay())) continue;
    scheduled++;
    if (dosedDates.has(dateKey(d))) completed++;
  }

  // For daily/fixed: remaining = total - elapsed; for others: count future dose days
  let remaining = 0;
  if (proto.pattern === "daily" || proto.pattern === "fixed") {
    remaining = Math.max(0, total - elapsed);
  } else {
    for (let i = elapsed; i < total; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      if (isDoseDay(proto, i, d.getDay())) remaining++;
    }
  }

  return {
    scheduled,
    completed,
    total,
    pct: scheduled > 0 ? Math.round((completed / scheduled) * 100) : 0,
    remaining,
  };
}

export type CalendarDay = {
  n: number;
  state: "completed" | "missed" | "upcoming" | "off";
  bg: string;
  fg: string;
  border: string;
};

export function buildProtocolCalendar(
  proto: Pick<ProtocolRow, "start_date" | "duration" | "pattern" | "cycle_on" | "cycle_off" | "selected_days">,
  dosedDates: Set<string>,
  today: Date = new Date(),
): { leadingBlanks: number; days: CalendarDay[] } {
  const start = new Date(`${proto.start_date}T00:00:00`);
  const now = new Date(today);
  now.setHours(0, 0, 0, 0);
  const leadingBlanks = start.getDay();
  const days: CalendarDay[] = [];

  for (let i = 0; i < proto.duration; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const doseDay = isDoseDay(proto, i, d.getDay());
    const dosed = dosedDates.has(dateKey(d));
    const isFutureOrToday = d.getTime() >= now.getTime();

    let state: CalendarDay["state"];
    if (!doseDay) {
      state = "off";
    } else if (dosed) {
      state = "completed";
    } else if (!isFutureOrToday) {
      state = "missed";
    } else {
      state = "upcoming";
    }

    days.push({
      n: d.getDate(),
      state,
      bg:
        state === "completed" ? "var(--pt-info-fg)" :
        state === "missed"    ? "var(--pt-danger-bg)" :
        state === "off"       ? "var(--pt-track)" :
                                "var(--pt-surface-soft)",
      fg:
        state === "completed" ? "white" :
        state === "missed"    ? "var(--pt-danger-fg)" :
        state === "off"       ? "var(--pt-muted-2)" :
                                "var(--pt-muted-2)",
      border:
        state === "completed" ? "var(--pt-info-fg)" :
        state === "missed"    ? "var(--pt-danger-border)" :
        state === "off"       ? "transparent" :
                                "var(--pt-border-soft)",
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
  proto: Pick<ProtocolRow, "start_date" | "duration" | "reminder_time" | "pattern" | "cycle_on" | "cycle_off" | "selected_days">,
  dosedToday: boolean,
  now: Date = new Date(),
): boolean {
  if (!proto.reminder_time || dosedToday) return false;
  if (getProtocolStatus(proto, now) !== "active") return false;

  // For xony, only remind on dose days
  if (proto.pattern === "xony") {
    const start = new Date(`${proto.start_date}T00:00:00`);
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const dayIndex = Math.round((todayStart.getTime() - start.getTime()) / 86400000);
    if (!isDoseDay(proto, dayIndex)) return false;
  }

  const [h, m] = proto.reminder_time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return false;
  const reminderMinutes = h * 60 + m;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return nowMinutes >= reminderMinutes;
}
