import type { BatchGroup } from "@/lib/insights-logic";
import styles from "./InsightsPage.module.css";

export function BatchCompareView({ batchGroups }: { batchGroups: BatchGroup[] }) {
  // Matches v2's noBatchData: empty only when there are no vials at all —
  // groups with unrated vials still render with "—" placeholders.
  if (batchGroups.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyTitle}>No comparison data yet</div>
        <div className={styles.emptyBody}>
          When vials are depleted and rated for effectiveness, comparisons across batches and manufacturers
          will appear here.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeUp 0.3s ease" }}>
      {batchGroups.map((grp) => (
          <div
            key={grp.name}
            style={{
              background: "var(--pt-surface)",
              borderRadius: 22,
              boxShadow: "var(--pt-card-shadow)",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "17px 22px", borderBottom: "1.5px solid var(--pt-border)" }}>
              <div style={{ fontSize: 16, fontWeight: 800 }}>{grp.name}</div>
            </div>
            <div
              style={{
                padding: "13px 22px",
                background: "var(--pt-surface-soft)",
                borderBottom: "1px solid var(--pt-border)",
                display: "grid",
                gridTemplateColumns: "1.2fr 1.2fr 0.8fr 1fr 1fr",
                gap: 10,
              }}
            >
              {["Batch", "Manufacturer", "COA", "Avg Effectiveness", "Vials Used"].map((h) => (
                <div
                  key={h}
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "var(--pt-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  {h}
                </div>
              ))}
            </div>
            {grp.rows.map((row, i) => (
              <div
                key={i}
                style={{
                  padding: "12px 22px",
                  borderBottom: "1px solid var(--pt-divider)",
                  display: "grid",
                  gridTemplateColumns: "1.2fr 1.2fr 0.8fr 1fr 1fr",
                  gap: 10,
                  alignItems: "center",
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, fontFamily: "monospace", color: "var(--pt-ink)" }}>
                  {row.batch}
                </div>
                <div style={{ fontSize: 13 }}>{row.vendor}</div>
                <div style={{ fontSize: 12, color: "var(--pt-muted)" }}>{row.coa}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <div
                    style={{
                      flex: 1,
                      height: 6,
                      background: "var(--pt-track)",
                      borderRadius: 99,
                      overflow: "hidden",
                      maxWidth: 52,
                    }}
                  >
                    <div style={{ height: "100%", width: row.barPct, background: "var(--pt-accent)", borderRadius: 99 }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>{row.avgLabel}</span>
                </div>
                <div style={{ fontSize: 13, color: "var(--pt-muted-2)" }}>
                  {row.vialCount} vial{row.vialCountS}
                </div>
              </div>
            ))}
          </div>
        ))}
    </div>
  );
}
