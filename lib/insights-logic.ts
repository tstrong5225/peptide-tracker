// Ported from v2's buildBatchGroups() and buildTimeline().

import { dateKey } from "@/lib/protocol-logic";
import type { VialRow } from "@/lib/vial-math";

export type ChartColor = { solid: string; light: string };

export const TL_COLORS: ChartColor[] = [
  { solid: "var(--pt-accent)", light: "var(--pt-accent-soft-bg)" },
  { solid: "var(--pt-success-fg)", light: "var(--pt-success-bg)" },
  { solid: "var(--pt-chart-purple)", light: "var(--pt-chart-purple-soft)" },
  { solid: "var(--pt-chart-amber)", light: "var(--pt-chart-amber-soft)" },
];

export type BatchRow = {
  batch: string;
  vendor: string;
  coa: string;
  avgLabel: string;
  barPct: string;
  vialCount: number;
  vialCountS: string;
};

export type BatchGroup = {
  name: string;
  rows: BatchRow[];
  hasRatings: boolean;
};

export function buildBatchGroups(vials: VialRow[]): BatchGroup[] {
  const names = [...new Set(vials.map((v) => v.name.trim()))];

  return names.map((name) => {
    const pvials = vials.filter((v) => v.name.trim() === name);
    const map = new Map<string, { batch: string; vendor: string; coa: string; ratings: number[]; count: number }>();

    for (const v of pvials) {
      const key = `${v.batch_number || "—"}|${v.vendor || "—"}`;
      if (!map.has(key)) {
        map.set(key, { batch: v.batch_number || "—", vendor: v.vendor || "—", coa: v.coa_number || "—", ratings: [], count: 0 });
      }
      const entry = map.get(key)!;
      entry.count++;
      if (v.effectiveness != null) entry.ratings.push(v.effectiveness);
    }

    const rows: BatchRow[] = Array.from(map.values()).map((r) => {
      const avg = r.ratings.length > 0 ? r.ratings.reduce((s, x) => s + x, 0) / r.ratings.length : null;
      return {
        batch: r.batch,
        vendor: r.vendor,
        coa: r.coa,
        avgLabel: avg != null ? `${avg.toFixed(1)}/10` : "—",
        barPct: avg != null ? `${((avg / 10) * 100).toFixed(0)}%` : "0%",
        vialCount: r.count,
        vialCountS: r.count === 1 ? "" : "s",
      };
    });

    return { name, rows, hasRatings: rows.some((r) => r.avgLabel !== "—") };
  });
}

export type TimelineCell = { bg: string; bdr: string };
export type TimelineRow = { name: string; color: string; cells: TimelineCell[] };

export type Timeline = {
  rows: TimelineRow[];
  dayLabels: { n: string }[];
  legend: { name: string; color: string }[];
};

export function buildTimeline(vials: (VialRow & { doses: { logged_at: string }[] })[], today: Date = new Date()): Timeline {
  const now = new Date(today);
  now.setHours(0, 0, 0, 0);
  const topVials = vials.slice(0, 4);

  const rows: TimelineRow[] = topVials.map((v, i) => {
    const c = TL_COLORS[i % TL_COLORS.length];
    const dosed = new Set(v.doses.map((d) => dateKey(new Date(d.logged_at))));
    const cells: TimelineCell[] = Array.from({ length: 28 }, (_, j) => {
      const d = new Date(now);
      d.setDate(d.getDate() - 27 + j);
      const hit = dosed.has(dateKey(d));
      return { bg: hit ? c.light : "transparent", bdr: hit ? c.solid : "var(--pt-border)" };
    });
    return { name: v.name, color: c.solid, cells };
  });

  const dayLabels = Array.from({ length: 28 }, (_, j) => {
    const d = new Date(now);
    d.setDate(d.getDate() - 27 + j);
    return { n: String(d.getDate()) };
  });

  const legend = topVials.map((v, i) => ({ name: v.name, color: TL_COLORS[i % TL_COLORS.length].solid }));

  return { rows, dayLabels, legend };
}
