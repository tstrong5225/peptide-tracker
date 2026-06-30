"use client";

import { Modal } from "@/components/ui/Modal";
import formStyles from "@/components/ui/Form.module.css";

export type ReorderItem = {
  name: string;
  sub: string;
  badgeLabel: string;
  badgeBg: string;
  badgeFg: string;
};

export function ReorderModal({ items, onClose }: { items: ReorderItem[]; onClose: () => void }) {
  return (
    <Modal onClose={onClose} maxWidth={480} zIndex={300}>
      <div style={{ padding: "24px 26px", borderBottom: "1.5px solid var(--pt-border)" }}>
        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em" }}>Reorder Queue</div>
        <div style={{ fontSize: 13, color: "var(--pt-muted)", marginTop: 3 }}>
          Vials that are low or nearing expiry
        </div>
      </div>
      {items.map((item, i) => (
        <div
          key={i}
          style={{
            padding: "15px 26px",
            borderBottom: "1px solid oklch(0.96 0.005 222)",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{item.name}</div>
            <div style={{ fontSize: 12, color: "oklch(0.58 0.02 225)" }}>{item.sub}</div>
          </div>
          <span
            style={{
              background: item.badgeBg,
              color: item.badgeFg,
              fontSize: 11,
              fontWeight: 700,
              padding: "3px 10px",
              borderRadius: 99,
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {item.badgeLabel}
          </span>
        </div>
      ))}
      <div style={{ padding: 18 }}>
        <button type="button" onClick={onClose} className={formStyles.buttonSecondary} style={{ width: "100%" }}>
          Close
        </button>
      </div>
    </Modal>
  );
}
