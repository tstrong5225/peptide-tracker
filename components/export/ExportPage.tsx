"use client";

import { useCallback, useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import type { ExportRow } from "@/app/api/export/route";
import styles from "./ExportPage.module.css";

export function ExportPage({
  email,
  isAdmin,
  vialNames,
}: {
  email: string;
  isAdmin: boolean;
  vialNames: string[];
}) {
  const [format, setFormat] = useState<"csv" | "pdf">("csv");
  const [peptide, setPeptide] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [preview, setPreview] = useState<{ rows: ExportRow[]; total: number } | null>(null);

  const buildParams = useCallback(
    (fmt: string) =>
      new URLSearchParams({ format: fmt, peptide, dateFrom, dateTo }).toString(),
    [peptide, dateFrom, dateTo],
  );

  useEffect(() => {
    let cancelled = false;
    // Preview fetches as filters change; stale data stays visible until new data arrives.
    fetch(`/api/export?${buildParams("preview")}`)
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setPreview(d); })
      .catch(() => { /* leave stale preview on error */ });
    return () => { cancelled = true; };
  }, [buildParams]);

  function triggerDownload() {
    window.location.href = `/api/export?${buildParams(format)}`;
  }

  const total = preview?.total ?? 0;
  const previewSubtitle = preview === null
    ? "Loading preview…"
    : total === 0
      ? "No doses match the current filters"
      : `${total} entr${total === 1 ? "y" : "ies"} · showing first ${Math.min(total, 10)}`;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <AppHeader email={email} isAdmin={isAdmin} />
      <main className={styles.main}>
        <div className={styles.heading}>Export Summary</div>

        {/* Filter card */}
        <div className={styles.filterCard}>
          <div className={styles.filterRows}>
            {/* Format */}
            <div className={styles.filterRow}>
              <span className={styles.filterLabel}>Format</span>
              <div className={styles.tabGroup}>
                {(["csv", "pdf"] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    className={`${styles.tabBtn} ${format === f ? styles.tabBtnActive : ""}`}
                    onClick={() => setFormat(f)}
                  >
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Peptide */}
            <div className={styles.filterRow}>
              <span className={styles.filterLabel}>Peptide</span>
              <div style={{ position: "relative" }}>
                <select
                  value={peptide}
                  onChange={(e) => setPeptide(e.target.value)}
                  style={{
                    padding: "8px 36px 8px 12px",
                    border: "1.5px solid var(--pt-border-soft)",
                    borderRadius: 9,
                    fontSize: 13,
                    background: "var(--pt-surface)",
                    color: "var(--pt-ink)",
                    cursor: "pointer",
                    appearance: "none",
                  }}
                >
                  <option value="all">All peptides</option>
                  {vialNames.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <div
                  style={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                    color: "var(--pt-muted)",
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                    <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Date range */}
            <div className={styles.filterRow}>
              <span className={styles.filterLabel}>Date range</span>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className={styles.dateInput}
                />
                <span className={styles.dateSep}>to</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className={styles.dateInput}
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={triggerDownload}
            disabled={total === 0}
            className={styles.exportBtn}
          >
            Export {format.toUpperCase()}
          </button>
        </div>

        {/* Preview card */}
        <div className={styles.previewCard}>
          <div className={styles.previewHeader}>
            <div className={styles.previewTitle}>Preview</div>
            <div className={styles.previewSub}>{previewSubtitle}</div>
          </div>

          {total === 0 && preview !== null ? (
            <div className={styles.emptyState}>
              No doses logged yet. Add vials and log doses to generate an export.
            </div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Peptide</th>
                    <th>Dose (mcg)</th>
                    <th>Units</th>
                    <th>Site</th>
                    <th>Notes</th>
                    <th>Batch / COA</th>
                  </tr>
                </thead>
                <tbody>
                  {(preview?.rows ?? []).map((row, i) => (
                    <tr key={i}>
                      <td>{row.date}</td>
                      <td className="muted">{row.time}</td>
                      <td>{row.peptide}</td>
                      <td>{row.dose_mcg}</td>
                      <td>{row.units_used}</td>
                      <td>{row.site}</td>
                      <td className={`muted ${styles.truncate}`}>{row.notes || "—"}</td>
                      <td className="muted">
                        {row.batch_number || row.coa_number
                          ? [row.batch_number && `Batch: ${row.batch_number}`, row.coa_number && `COA: ${row.coa_number}`]
                              .filter(Boolean)
                              .join(" · ")
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
