"use client";

import { useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import formStyles from "@/components/ui/Form.module.css";

export function ConfirmDeleteModal({
  name,
  description,
  onCancel,
  onConfirm,
}: {
  name: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => Promise<void> | void;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Modal onClose={onCancel} maxWidth={360} zIndex={300}>
      <div style={{ padding: 28, textAlign: "center" }}>
        <div
          style={{
            width: 50,
            height: 50,
            background: "var(--pt-danger-bg)",
            borderRadius: 15,
            margin: "0 auto 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
            <path
              d="M4 8h20M9 8V5.5h10V8M11 13v8M17 13v8M5.5 8L7 22.5h14L22.5 8"
              stroke="oklch(0.52 0.18 22)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 8, letterSpacing: "-0.01em" }}>
          Delete {name}?
        </div>
        <div style={{ fontSize: 13, color: "var(--pt-muted)", lineHeight: 1.7, marginBottom: 24 }}>
          {description}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" onClick={onCancel} className={formStyles.buttonSecondary} style={{ flex: 1 }}>
            Cancel
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => startTransition(async () => onConfirm())}
            style={{
              flex: 1,
              background: "oklch(0.52 0.18 22)",
              color: "white",
              border: "none",
              borderRadius: 12,
              padding: 12,
              fontSize: 14,
              fontWeight: 700,
              cursor: isPending ? "not-allowed" : "pointer",
            }}
          >
            {isPending ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
