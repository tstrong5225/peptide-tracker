"use client";

import formStyles from "@/components/ui/Form.module.css";
import type { WarningData } from "@/app/vials/actions";

export function OutlierWarningModal({
  data,
  onEdit,
  onLogAnyway,
}: {
  data: WarningData;
  onEdit: () => void;
  onLogAnyway: () => void;
}) {
  const { peptideName, enteredMcg, avgMcg, multiplier, sampleCount } = data;
  const multiplierStr = multiplier != null ? multiplier.toFixed(1) : "?";
  const avgStr = avgMcg != null ? Math.round(avgMcg).toString() : "?";
  const enteredStr = enteredMcg != null ? Math.round(enteredMcg).toString() : "?";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--pt-overlay)",
        backdropFilter: "blur(5px)",
        zIndex: 400,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        animation: "fadeIn 0.2s ease",
      }}
    >
      <div
        style={{
          background: "var(--pt-surface)",
          borderRadius: 24,
          width: "100%",
          maxWidth: 400,
          padding: 28,
          boxShadow: "var(--pt-modal-shadow)",
          animation: "fadeUp 0.25s ease",
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            background: "var(--pt-danger-bg)",
            borderRadius: 15,
            marginBottom: 18,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
            <circle cx="13" cy="13" r="11" stroke="var(--pt-danger-fg)" strokeWidth="2" fill="none" />
            <line x1="13" y1="7" x2="13" y2="15" stroke="var(--pt-danger-fg)" strokeWidth="2" strokeLinecap="round" />
            <circle cx="13" cy="19" r="1.2" fill="var(--pt-danger-fg)" />
          </svg>
        </div>

        <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 8, letterSpacing: "-0.01em", color: "var(--pt-ink)" }}>
          Unusual Dose Detected
        </div>
        <div style={{ fontSize: 14, color: "var(--pt-muted)", marginBottom: 18, lineHeight: 1.6 }}>
          This dose is significantly higher than your previous logged entries for {peptideName}.
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          <div
            style={{
              background: "var(--pt-danger-bg)",
              borderRadius: 12,
              padding: "14px 16px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--pt-danger-fg)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 5,
              }}
            >
              You entered
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "var(--pt-danger-fg)", letterSpacing: "-0.02em" }}>
              {enteredStr}
            </div>
            <div style={{ fontSize: 12, color: "var(--pt-danger-fg)", opacity: 0.8 }}>mcg</div>
          </div>
          <div
            style={{
              background: "var(--pt-surface-soft)",
              borderRadius: 12,
              padding: "14px 16px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--pt-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 5,
              }}
            >
              Your average
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--pt-ink)" }}>
              {avgStr}
            </div>
            <div style={{ fontSize: 12, color: "var(--pt-muted-2)" }}>
              mcg (last {sampleCount})
            </div>
          </div>
        </div>

        <div
          style={{
            fontSize: 13,
            color: "var(--pt-muted)",
            marginBottom: 20,
            textAlign: "center",
            fontWeight: 600,
          }}
        >
          This is {multiplierStr}× your typical dose for {peptideName}.
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" onClick={onEdit} className={formStyles.buttonSecondary} style={{ flex: 1, borderRadius: 12 }}>
            Edit Entry
          </button>
          <button
            type="button"
            onClick={onLogAnyway}
            style={{
              flex: 1,
              background: "var(--pt-danger-deep)",
              color: "white",
              border: "none",
              borderRadius: 12,
              padding: 12,
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Log Anyway
          </button>
        </div>
      </div>
    </div>
  );
}
