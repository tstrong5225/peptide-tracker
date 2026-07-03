"use client";

import formStyles from "@/components/ui/Form.module.css";
import type { WarningData } from "@/app/vials/actions";

export function OverLimitWarningModal({
  data,
  onEdit,
  onLogAnyway,
}: {
  data: WarningData;
  onEdit: () => void;
  onLogAnyway: () => void;
}) {
  const enteredStr = data.enteredMcg != null ? Math.round(data.enteredMcg).toString() : "?";
  const remainingStr = data.remainingMcg != null ? Math.round(data.remainingMcg).toString() : "0";

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
            <path d="M13 3L23.4 22H2.6L13 3z" stroke="var(--pt-danger-fg)" strokeWidth="2" strokeLinejoin="round" fill="none" />
            <line x1="13" y1="10" x2="13" y2="16" stroke="var(--pt-danger-fg)" strokeWidth="2" strokeLinecap="round" />
            <circle cx="13" cy="19.5" r="1.2" fill="var(--pt-danger-fg)" />
          </svg>
        </div>

        <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 8, letterSpacing: "-0.01em", color: "var(--pt-ink)" }}>
          Exceeds Remaining Volume
        </div>
        <div style={{ fontSize: 14, color: "var(--pt-muted)", marginBottom: 18, lineHeight: 1.6 }}>
          The dose you entered is more than what&apos;s left in this vial. You can edit it or log it anyway — the vial will be marked as empty.
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "var(--grid-2col)", gap: 10, marginBottom: 22 }}>
          <div
            style={{
              background: "var(--pt-danger-bg)",
              borderRadius: 12,
              padding: "14px 16px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--pt-danger-fg)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>
              You entered
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "var(--pt-danger-fg)", letterSpacing: "-0.02em" }}>{enteredStr}</div>
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
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--pt-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>
              Remaining
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--pt-ink)" }}>{remainingStr}</div>
            <div style={{ fontSize: 12, color: "var(--pt-muted-2)" }}>mcg</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" onClick={onEdit} className={formStyles.buttonSecondary} style={{ flex: 1, borderRadius: 12 }}>
            Edit Dose
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
            Log &amp; Empty Vial
          </button>
        </div>
      </div>
    </div>
  );
}
