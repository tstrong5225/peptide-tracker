"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { NotificationToggle } from "./NotificationToggle";
import { CreateProtocolModal } from "./CreateProtocolModal";
import { patternLabel, formatReminderDisplay, type Adherence, type CalendarDay, type ProtocolRow } from "@/lib/protocol-logic";
import styles from "./ProtocolDetail.module.css";

const STATUS_STYLE: Record<string, { bg: string; fg: string; label: string }> = {
  active: { bg: "var(--pt-success-bg)", fg: "var(--pt-success-fg)", label: "Active" },
  completed: { bg: "var(--pt-neutral-bg)", fg: "var(--pt-neutral-fg)", label: "Completed" },
  upcoming: { bg: "var(--pt-info-bg)", fg: "var(--pt-info-fg)", label: "Upcoming" },
};

const WEEK_HEADER = ["S", "M", "T", "W", "T", "F", "S"];

type VialOption = { id: string; name: string };

export function ProtocolDetail({
  email,
  isAdmin,
  protocol,
  adherence,
  status,
  calendar,
  streak,
  linkedVial,
  vialOptions,
}: {
  email: string;
  isAdmin: boolean;
  protocol: ProtocolRow;
  adherence: Adherence;
  status: "active" | "completed" | "upcoming";
  calendar: { leadingBlanks: number; days: CalendarDay[] };
  streak: number;
  linkedVial?: VialOption | null;
  vialOptions?: VialOption[];
}) {
  const router = useRouter();
  const [showEdit, setShowEdit] = useState(false);
  const s = STATUS_STYLE[status];
  const isCycle = protocol.pattern === "xony";

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
                {patternLabel(protocol)} · {protocol.peptide} · {dateRange}
              </div>
              {protocol.notes ? (
                <div style={{ fontSize: 12, color: "var(--pt-muted-2)", marginTop: 2, fontStyle: "italic" }}>
                  Source: {protocol.notes}
                </div>
              ) : null}
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span
                  style={{
                    background: s.bg,
                    color: s.fg,
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "4px 12px",
                    borderRadius: 99,
                  }}
                >
                  {s.label}
                </span>
                {/* Edit button */}
                <button
                  type="button"
                  title="Edit protocol"
                  onClick={() => setShowEdit(true)}
                  style={{
                    background: "none",
                    border: "1.5px solid var(--pt-border-soft)",
                    borderRadius: 8,
                    padding: "5px 8px",
                    cursor: "pointer",
                    color: "var(--pt-muted)",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                    <path d="M11.5 2.5a1.5 1.5 0 0 1 2.121 2.121L5.5 12.743l-3 .757.757-3L11.5 2.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Edit
                </button>
              </div>
              {protocol.reminder_time ? (
                <NotificationToggle />
              ) : null}
            </div>
          </div>

          {/* Linked vial row */}
          {linkedVial ? (
            <div
              style={{
                fontSize: 12,
                color: "var(--pt-muted)",
                marginBottom: 10,
                padding: "8px 12px",
                background: "var(--pt-surface-soft)",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <svg width="13" height="13" viewBox="0 0 22 22" fill="none">
                  <rect x="8" y="1" width="6" height="5" rx="2" fill="currentColor" opacity="0.9" />
                  <rect x="5.5" y="5.5" width="11" height="15" rx="3.5" fill="currentColor" opacity="0.3" />
                  <rect x="5.5" y="5.5" width="11" height="9" rx="3.5" fill="currentColor" opacity="0.7" />
                </svg>
                Linked to <strong style={{ color: "var(--pt-ink)" }}>{linkedVial.name}</strong>
              </div>
              <button
                type="button"
                onClick={() => router.push(`/vials/${linkedVial.id}?logDose=1`)}
                style={{
                  background: "var(--pt-accent)",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  padding: "5px 12px",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                Log Dose
              </button>
            </div>
          ) : null}

          {protocol.reminder_time ? (
            <div
              style={{
                fontSize: 12,
                color: "var(--pt-muted)",
                marginBottom: 14,
                padding: "8px 12px",
                background: "var(--pt-surface-soft)",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="8" stroke="var(--pt-muted)" strokeWidth="1.5" />
                <path d="M10 6v4l3 2" stroke="var(--pt-muted)" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Reminder set for {formatReminderDisplay(protocol.reminder_time, protocol.reminder_timezone)}
              {isCycle ? ` · dose days only (${protocol.cycle_on} on / ${protocol.cycle_off} off)` : ""}
            </div>
          ) : null}

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
                {adherence.completed} / {adherence.scheduled}
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
              <div className={styles.legendSwatch} style={{ background: "var(--pt-danger-bg)", border: "1px solid var(--pt-danger-border)" }} />
              <span className={styles.legendLabel}>Missed</span>
            </div>
            <div className={styles.legendItem}>
              <div className={styles.legendSwatch} style={{ background: "var(--pt-surface-soft)", border: "1px solid var(--pt-border-soft)" }} />
              <span className={styles.legendLabel}>Upcoming</span>
            </div>
            {isCycle ? (
              <div className={styles.legendItem}>
                <div className={styles.legendSwatch} style={{ background: "var(--pt-track)", border: "none" }} />
                <span className={styles.legendLabel}>Off day</span>
              </div>
            ) : null}
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
              <div
                key={i}
                className={styles.calCell}
                style={{
                  background: d.bg,
                  border: d.state === "off" ? "none" : `2px solid ${d.border}`,
                  opacity: d.state === "off" ? 0.5 : 1,
                }}
              >
                <span className={styles.calCellNum} style={{ color: d.fg, fontSize: d.state === "off" ? 10 : undefined }}>
                  {d.n}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {showEdit ? (
        <CreateProtocolModal
          initialData={protocol}
          editMode
          vials={vialOptions}
          onClose={() => setShowEdit(false)}
          onSaved={() => {
            setShowEdit(false);
            router.refresh();
          }}
        />
      ) : null}
    </div>
  );
}
