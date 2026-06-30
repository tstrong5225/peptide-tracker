"use client";

import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { PATTERN_LABELS, type Adherence, type CalendarDay, type ProtocolRow } from "@/lib/protocol-logic";
import styles from "./ProtocolDetail.module.css";

const STATUS_STYLE: Record<string, { bg: string; fg: string; label: string }> = {
  active: { bg: "var(--pt-success-bg)", fg: "var(--pt-success-fg)", label: "Active" },
  completed: { bg: "var(--pt-neutral-bg)", fg: "var(--pt-neutral-fg)", label: "Completed" },
  upcoming: { bg: "var(--pt-info-bg)", fg: "var(--pt-info-fg)", label: "Upcoming" },
};

const WEEK_HEADER = ["S", "M", "T", "W", "T", "F", "S"];

export function ProtocolDetail({
  email,
  isAdmin,
  protocol,
  adherence,
  status,
  calendar,
  streak,
}: {
  email: string;
  isAdmin: boolean;
  protocol: ProtocolRow;
  adherence: Adherence;
  status: "active" | "completed" | "upcoming";
  calendar: { leadingBlanks: number; days: CalendarDay[] };
  streak: number;
}) {
  const router = useRouter();
  const s = STATUS_STYLE[status];

  const startDate = new Date(`${protocol.start_date}T00:00:00`);
  const endDate = new Date(startDate.getTime() + protocol.duration * 86400000);
  const dateRange = `${startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <AppHeader email={email} isAdmin={isAdmin} />
      <main className={styles.main}>
        <button type="button" className={styles.backBtn} onClick={() => router.push("/protocols")}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          My Protocols
        </button>

        <div className={styles.card}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.01em" }}>{protocol.name}</div>
              <div style={{ fontSize: 13, color: "var(--pt-muted)", marginTop: 3 }}>
                {PATTERN_LABELS[protocol.pattern] || protocol.pattern} · {protocol.peptide} · {dateRange}
              </div>
              {protocol.notes ? (
                <div style={{ fontSize: 12, color: "var(--pt-muted-2)", marginTop: 2, fontStyle: "italic" }}>
                  Source: {protocol.notes}
                </div>
              ) : null}
            </div>
            <span
              style={{
                background: s.bg,
                color: s.fg,
                fontSize: 11,
                fontWeight: 700,
                padding: "4px 12px",
                borderRadius: 99,
                flexShrink: 0,
              }}
            >
              {s.label}
            </span>
          </div>

          <div className={styles.statGrid}>
            <div className={styles.statBox}>
              <div className={styles.statLabel}>Adherence</div>
              <div className={styles.statValue} style={{ color: "var(--pt-success-fg)" }}>
                {adherence.pct}%
              </div>
            </div>
            <div className={styles.statBox}>
              <div className={styles.statLabel}>Completed</div>
              <div className={styles.statValue}>
                {adherence.completed} / {adherence.total}
              </div>
            </div>
            <div className={styles.statBox}>
              <div className={styles.statLabel}>Streak</div>
              <div className={styles.statValue} style={{ color: "var(--pt-info-fg)" }}>
                {streak} day{streak === 1 ? "" : "s"}
              </div>
            </div>
          </div>

          <div className={styles.legend}>
            <div className={styles.legendItem}>
              <div className={styles.legendSwatch} style={{ background: "var(--pt-info-fg)" }} />
              <span className={styles.legendLabel}>Dosed</span>
            </div>
            <div className={styles.legendItem}>
              <div className={styles.legendSwatch} style={{ background: "var(--pt-danger-bg)" }} />
              <span className={styles.legendLabel}>Missed</span>
            </div>
            <div className={styles.legendItem}>
              <div className={styles.legendSwatch} style={{ background: "var(--pt-surface-soft)", border: "1px solid var(--pt-border-soft)" }} />
              <span className={styles.legendLabel}>Upcoming</span>
            </div>
          </div>

          <div className={styles.weekHeader}>
            {WEEK_HEADER.map((d, i) => (
              <div key={i} className={styles.weekHeaderCell}>
                {d}
              </div>
            ))}
          </div>
          <div className={styles.calGrid}>
            {Array.from({ length: calendar.leadingBlanks }, (_, i) => (
              <div key={`blank-${i}`} />
            ))}
            {calendar.days.map((d, i) => (
              <div key={i} className={styles.calCell} style={{ background: d.bg, border: `2px solid ${d.border}` }}>
                <span className={styles.calCellNum} style={{ color: d.fg }}>
                  {d.n}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
