"use client";

import { useEffect, useState } from "react";
import type { Citation } from "@/app/api/research/[peptide]/route";

type State =
  | { status: "loading" }
  | { status: "ok"; citations: Citation[]; cached: boolean }
  | { status: "error" };

export function ResearchPanel({ vialName }: { vialName: string }) {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/research/${encodeURIComponent(vialName)}`)
      .then(async (res) => {
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok || data.error) {
          setState({ status: "error" });
        } else {
          setState({ status: "ok", citations: data.citations ?? [], cached: !!data.cached });
        }
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" });
      });

    return () => { cancelled = true; };
  }, [vialName]);

  return (
    <div
      style={{
        background: "var(--pt-surface)",
        borderRadius: 22,
        boxShadow: "var(--pt-card-shadow)",
        overflow: "hidden",
        animation: "fadeUp 0.37s ease",
        marginTop: 16,
      }}
    >
      <div style={{ padding: "17px 22px", borderBottom: "1.5px solid var(--pt-border)" }}>
        <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.01em" }}>Related Research</div>
        <div style={{ fontSize: 12, color: "var(--pt-muted-2)", marginTop: 3 }}>
          {state.status === "loading" ? "Fetching from PubMed…" : "Live citations from PubMed"}
        </div>
      </div>

      {state.status === "loading" ? (
        <div
          style={{
            padding: "28px 22px",
            display: "flex",
            gap: 12,
            flexDirection: "column",
          }}
        >
          {[...Array(2)].map((_, i) => (
            <div key={i} style={{ display: "flex", gap: 12 }}>
              <div
                style={{
                  flex: 1,
                  height: 14,
                  background: "var(--pt-surface-soft)",
                  borderRadius: 6,
                  animation: "fadeIn 1s ease infinite alternate",
                }}
              />
            </div>
          ))}
        </div>
      ) : state.status === "error" ? (
        <div style={{ padding: "24px 22px", fontSize: 13, color: "var(--pt-muted)", textAlign: "center" }}>
          Couldn&apos;t reach PubMed right now — check back later.
        </div>
      ) : state.citations.length === 0 ? (
        <div style={{ padding: "24px 22px", fontSize: 13, color: "var(--pt-muted)", textAlign: "center" }}>
          No PubMed citations found for &ldquo;{vialName}&rdquo;.
        </div>
      ) : (
        state.citations.map((ref, i) => (
          <div
            key={ref.pmid || i}
            style={{
              padding: "13px 22px",
              borderBottom: "1px solid var(--pt-divider)",
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.45, marginBottom: 3 }}>
                {ref.title}
              </div>
              <div style={{ fontSize: 12, color: "var(--pt-muted-2)" }}>
                {ref.source}
                {ref.source && ref.year ? " · " : ""}
                {ref.year}
              </div>
            </div>
            <a
              href={ref.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 12,
                color: "var(--pt-accent)",
                fontWeight: 700,
                textDecoration: "none",
                flexShrink: 0,
                marginTop: 2,
              }}
            >
              View →
            </a>
          </div>
        ))
      )}
    </div>
  );
}
