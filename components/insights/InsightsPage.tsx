"use client";

import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import type { BatchGroup, Timeline } from "@/lib/insights-logic";
import { BatchCompareView } from "./BatchCompareView";
import { StackTimelineView } from "./StackTimelineView";
import styles from "./InsightsPage.module.css";

export function InsightsPage({
  email,
  isAdmin,
  batchGroups,
  timeline,
}: {
  email: string;
  isAdmin: boolean;
  batchGroups: BatchGroup[];
  timeline: Timeline;
}) {
  const [tab, setTab] = useState<"batch" | "timeline">("batch");

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <AppHeader email={email} isAdmin={isAdmin} />
      <main className={styles.main}>
        <div className={styles.headerRow}>
          <div className={styles.heading}>Insights</div>
          <div className={styles.tabGroup}>
            <button
              type="button"
              className={`${styles.tabBtn} ${tab === "batch" ? styles.tabBtnActive : ""}`}
              onClick={() => setTab("batch")}
            >
              Batch Compare
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${tab === "timeline" ? styles.tabBtnActive : ""}`}
              onClick={() => setTab("timeline")}
            >
              Stack Timeline
            </button>
          </div>
        </div>

        {tab === "batch" ? <BatchCompareView batchGroups={batchGroups} /> : <StackTimelineView timeline={timeline} />}
      </main>
    </div>
  );
}
