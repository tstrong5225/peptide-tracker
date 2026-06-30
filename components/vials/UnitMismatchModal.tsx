"use client";

import formStyles from "@/components/ui/Form.module.css";
import type { WarningData } from "@/app/vials/actions";

export function UnitMismatchModal({
  data,
  onChangeToCorrected,
  onKeepAsEntered,
}: {
  data: WarningData;
  onChangeToCorrected: () => void;
  onKeepAsEntered: () => void;
}) {
  const { peptideName, enteredUnit, priorUnit, enteredValue, convertedMcg } = data;
  const correctedLabel =
    enteredUnit === "mg"
      ? `${convertedMcg} mcg`
      : `${((enteredValue ?? 0) / 1000).toFixed(4)} mg`;
  const keepLabel = `${enteredValue} ${enteredUnit}`;

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
            background: "var(--pt-warning-bg)",
            borderRadius: 15,
            marginBottom: 18,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
            <path
              d="M13 3L2 22h22L13 3z"
              stroke="var(--pt-warning-fg)"
              strokeWidth="2"
              strokeLinejoin="round"
              fill="none"
            />
            <line x1="13" y1="10" x2="13" y2="17" stroke="var(--pt-warning-fg)" strokeWidth="2" strokeLinecap="round" />
            <circle cx="13" cy="20.5" r="1.2" fill="var(--pt-warning-fg)" />
          </svg>
        </div>

        <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 14, letterSpacing: "-0.01em", lineHeight: 1.3, color: "var(--pt-ink)" }}>
          Unit Convention Mismatch
        </div>

        <div
          style={{
            background: "var(--pt-surface-soft)",
            borderRadius: 12,
            padding: "14px 16px",
            marginBottom: 10,
          }}
        >
          <div style={{ fontSize: 12, color: "var(--pt-muted)", marginBottom: 4 }}>
            Most entries for {peptideName} use:
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--pt-info-fg)" }}>
            {priorUnit === "mcg" ? "mcg (micrograms)" : "mg (milligrams)"}
          </div>
        </div>

        <div
          style={{
            background: "var(--pt-warning-bg)",
            borderRadius: 12,
            padding: "14px 16px",
            marginBottom: 20,
          }}
        >
          <div style={{ fontSize: 12, color: "var(--pt-warning-fg)", marginBottom: 4 }}>You entered:</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--pt-warning-fg)" }}>{keepLabel}</div>
          <div style={{ fontSize: 13, color: "var(--pt-warning-fg)", marginTop: 6 }}>
            Did you mean <strong>{correctedLabel}</strong>?
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={onChangeToCorrected}
            style={{
              flex: 1,
              background: "var(--pt-info-fg)",
              color: "white",
              border: "none",
              borderRadius: 12,
              padding: 12,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Change to {correctedLabel}
          </button>
          <button type="button" onClick={onKeepAsEntered} className={formStyles.buttonSecondary} style={{ flex: 1, borderRadius: 12 }}>
            Keep {keepLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
