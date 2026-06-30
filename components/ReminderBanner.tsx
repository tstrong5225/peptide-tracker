"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PATTERN_LABELS } from "@/lib/protocol-logic";

export type DueReminder = { id: string; name: string; peptide: string; pattern: string; vialId: string | null };

export function ReminderBanner({ reminders }: { reminders: DueReminder[] }) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const visible = reminders.filter((r) => !dismissed.has(r.id));

  if (visible.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
      {visible.map((r) => (
        <div
          key={r.id}
          style={{
            background: "var(--pt-header-bg)",
            borderRadius: 16,
            padding: "14px 18px",
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              background: "var(--pt-accent)",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="8" y="1.5" width="4" height="4" rx="1.5" fill="white" opacity="0.95" />
              <rect x="6" y="5.5" width="8" height="13" rx="3" fill="white" opacity="0.65" />
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "white", marginBottom: 2 }}>
              Time to dose — {r.peptide}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)" }}>
              {PATTERN_LABELS[r.pattern] || r.pattern} · {r.name}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            {r.vialId ? (
              <button
                type="button"
                onClick={() => router.push(`/vials/${r.vialId}`)}
                style={{
                  background: "var(--pt-accent)",
                  color: "white",
                  border: "none",
                  borderRadius: 9,
                  padding: "8px 14px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                Log Now
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setDismissed((prev) => new Set(prev).add(r.id))}
              style={{
                background: "rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.8)",
                border: "1.5px solid rgba(255,255,255,0.15)",
                borderRadius: 9,
                padding: "8px 14px",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
