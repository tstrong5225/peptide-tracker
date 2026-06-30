"use client";

import { useRouter } from "next/navigation";
import styles from "./VialCard.module.css";

export type VialCardData = {
  id: string;
  name: string;
  mgInVial: number;
  deviceLabel: string;
  vendorLine: string | null;
  batchLine: string | null;
  statusLabel: string;
  statusBg: string;
  statusFg: string;
  expiryLabel: string | null;
  expiryBg: string;
  expiryFg: string;
  pctLabel: string;
  barWidthPct: number;
  barColor: string;
  mgLeft: string;
  dosesLeft: number;
  costPerDose: string | null;
  effectivenessLabel: string | null;
  lastDoseText: string;
  doseCount: number;
  canLog: boolean;
  canRate: boolean;
};

export function VialCard({
  data,
  onLog,
  onRate,
  onEdit,
  onDelete,
}: {
  data: VialCardData;
  onLog: () => void;
  onRate: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const router = useRouter();

  return (
    <div className={styles.card}>
      <div className={styles.topRow}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className={styles.name}>{data.name}</div>
          <div className={styles.deviceLine}>
            {data.mgInVial}mg · {data.deviceLabel}
          </div>
          {data.vendorLine ? <div className={styles.vendorLine}>{data.vendorLine}</div> : null}
          {data.batchLine ? <div className={styles.batchLine}>{data.batchLine}</div> : null}
        </div>
        <div className={styles.badges}>
          <span
            className={styles.statusBadge}
            style={{ background: data.statusBg, color: data.statusFg }}
          >
            {data.statusLabel}
          </span>
          {data.expiryLabel ? (
            <span
              className={styles.expiryBadge}
              style={{ background: data.expiryBg, color: data.expiryFg }}
            >
              {data.expiryLabel}
            </span>
          ) : null}
        </div>
      </div>

      <div>
        <div className={styles.barRow}>
          <span className={styles.barLabel}>Remaining</span>
          <span className={styles.barPct}>{data.pctLabel}</span>
        </div>
        <div className={styles.barTrack}>
          <div
            className={styles.barFill}
            style={{ width: `${data.barWidthPct}%`, background: data.barColor }}
          />
        </div>
      </div>

      <div className={styles.statGrid}>
        <div className={styles.statBox}>
          <div className={styles.statLabel}>mg Left</div>
          <div className={styles.statValue}>
            {data.mgLeft}
            <span className={styles.statUnit}> mg</span>
          </div>
        </div>
        <div className={styles.statBox}>
          <div className={styles.statLabel}>Doses Left</div>
          <div className={styles.statValue}>
            {data.dosesLeft}
            <span className={styles.statUnit}> doses</span>
          </div>
        </div>
      </div>

      {data.costPerDose ? (
        <div className={styles.costBox}>
          <span className={styles.costLabel}>Cost / Dose</span>
          <span className={styles.costValue}>${data.costPerDose}</span>
        </div>
      ) : null}

      {data.effectivenessLabel ? (
        <div className={styles.effectBox}>
          <span className={styles.effectLabel}>Effectiveness</span>
          <span className={styles.effectValue}>{data.effectivenessLabel}</span>
        </div>
      ) : null}

      <div className={styles.lastDose}>
        Last: <strong>{data.lastDoseText}</strong> · {data.doseCount} logged
      </div>

      <div className={styles.actionsRow}>
        {data.canLog ? (
          <button type="button" className={styles.btnPrimary} onClick={onLog}>
            Log Dose
          </button>
        ) : null}
        {data.canRate ? (
          <button type="button" className={styles.btnSoft} onClick={onRate}>
            Rate Vial
          </button>
        ) : null}
        <button
          type="button"
          className={styles.btnSoft}
          onClick={() => router.push(`/vials/${data.id}`)}
        >
          History
        </button>
        <button type="button" className={styles.btnIcon} title="Edit" onClick={onEdit}>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <path
              d="M9.5 1.5l3 3L4 13H1v-3L9.5 1.5z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <button
          type="button"
          className={`${styles.btnIcon} ${styles.btnIconDanger}`}
          title="Delete"
          onClick={onDelete}
        >
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <path
              d="M2 4h10M5 4V2.5h4V4M6 7v4M8 7v4M3 4l.7 7.5h6.6L11 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
