import type { Timeline } from "@/lib/insights-logic";
import styles from "./InsightsPage.module.css";

export function StackTimelineView({ timeline }: { timeline: Timeline }) {
  if (timeline.rows.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyTitle}>No dose history yet</div>
        <div className={styles.emptyBody}>
          Log doses to your vials and the timeline will populate with your dosing history.
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "var(--pt-surface)",
        borderRadius: 22,
        boxShadow: "var(--pt-card-shadow)",
        padding: 24,
        overflowX: "auto",
        animation: "fadeUp 0.3s ease",
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--pt-muted)", marginBottom: 16 }}>
        Last 28 days · color-coded by vial
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 10, paddingLeft: 114 }}>
        {timeline.dayLabels.map((dl, i) => (
          <div key={i} style={{ width: 24, flexShrink: 0, textAlign: "center", fontSize: 9, fontWeight: 700, color: "var(--pt-muted-2)" }}>
            {dl.n}
          </div>
        ))}
      </div>

      {timeline.rows.map((row, ri) => (
        <div key={ri} style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 7 }}>
          <div style={{ width: 110, flexShrink: 0, display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: row.color, flexShrink: 0 }} />
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--pt-ink)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {row.name}
            </span>
          </div>
          {row.cells.map((cell, ci) => (
            <div
              key={ci}
              style={{
                width: 24,
                height: 24,
                flexShrink: 0,
                borderRadius: 5,
                background: cell.bg,
                border: `1.5px solid ${cell.bdr}`,
              }}
            />
          ))}
        </div>
      ))}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 14,
          marginTop: 14,
          paddingLeft: 114,
          borderTop: "1px solid var(--pt-divider)",
          paddingTop: 14,
        }}
      >
        {timeline.legend.map((leg, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: leg.color }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--pt-muted)" }}>{leg.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
