"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { ConfirmDeleteModal } from "@/components/vials/ConfirmDeleteModal";
import { PATTERN_LABELS, type Adherence, type ProtocolRow } from "@/lib/protocol-logic";
import { deleteProtocol } from "@/app/protocols/actions";
import { CreateProtocolModal } from "./CreateProtocolModal";
import styles from "./ProtocolsPage.module.css";

export type ProtocolCardData = {
  protocol: ProtocolRow;
  adherence: Adherence;
  status: "active" | "completed" | "upcoming";
};

const STATUS_STYLE: Record<string, { bg: string; fg: string; label: string }> = {
  active: { bg: "var(--pt-success-bg)", fg: "var(--pt-success-fg)", label: "Active" },
  completed: { bg: "var(--pt-neutral-bg)", fg: "var(--pt-neutral-fg)", label: "Completed" },
  upcoming: { bg: "var(--pt-info-bg)", fg: "var(--pt-info-fg)", label: "Upcoming" },
};

export function ProtocolsPage({
  email,
  isAdmin,
  cards,
}: {
  email: string;
  isAdmin: boolean;
  cards: ProtocolCardData[];
}) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<ProtocolRow | null>(null);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <AppHeader
        email={email}
        isAdmin={isAdmin}
        context={
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            style={{
              background: "var(--pt-accent)",
              color: "white",
              border: "none",
              borderRadius: 10,
              padding: "9px 16px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 13 13" fill="none">
              <line x1="6.5" y1="1" x2="6.5" y2="12" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
              <line x1="1" y1="6.5" x2="12" y2="6.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
            New Protocol
          </button>
        }
      />

      <main className={styles.main}>
        <div className={styles.heading}>Protocols</div>

        {cards.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
                <rect x="5" y="4" width="20" height="22" rx="4" stroke="var(--pt-accent)" strokeWidth="1.8" fill="none" />
                <line x1="10" y1="10" x2="20" y2="10" stroke="var(--pt-accent)" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="10" y1="15" x2="20" y2="15" stroke="var(--pt-accent)" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="10" y1="20" x2="16" y2="20" stroke="var(--pt-accent)" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div className={styles.emptyHeading}>No protocols yet</div>
            <div className={styles.emptyBody}>
              Create a protocol to track your dosing schedule and adherence over time.
            </div>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              style={{
                background: "var(--pt-accent)",
                color: "white",
                border: "none",
                borderRadius: 13,
                padding: "13px 28px",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Create First Protocol
            </button>
          </div>
        ) : (
          <div className={styles.list}>
            {cards.map(({ protocol, adherence, status }) => {
              const s = STATUS_STYLE[status];
              const startStr = new Date(`${protocol.start_date}T00:00:00`).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });
              return (
                <div
                  key={protocol.id}
                  className={`${styles.card} ${status === "completed" ? styles.cardCompleted : ""}`}
                  onClick={() => router.push(`/protocols/${protocol.id}`)}
                >
                  <div className={styles.cardTop}>
                    <div>
                      <div className={styles.cardName}>{protocol.name}</div>
                      <div className={styles.cardSub}>
                        {PATTERN_LABELS[protocol.pattern] || protocol.pattern} · {protocol.peptide} · Started {startStr}
                      </div>
                      {protocol.notes ? <div className={styles.cardSource}>Source: {protocol.notes}</div> : null}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      <span className={styles.statusBadge} style={{ background: s.bg, color: s.fg }}>
                        {s.label}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDelete(protocol);
                        }}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--pt-muted-2)", padding: 4, display: "flex" }}
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

                  {status !== "completed" ? (
                    <div className={styles.barRow}>
                      <div className={styles.barTrack}>
                        <div className={styles.barFill} style={{ width: `${adherence.pct}%` }} />
                      </div>
                      <span className={styles.barLabel}>
                        {adherence.completed} / {adherence.scheduled || adherence.total} days
                      </span>
                    </div>
                  ) : null}

                  <div className={styles.footRow}>
                    {status === "completed" ? (
                      <>
                        {adherence.completed}/{adherence.total} days · {adherence.pct}% adherence
                      </>
                    ) : (
                      <>
                        Adherence: <strong style={{ color: "var(--pt-ink)" }}>{adherence.pct}%</strong> ·{" "}
                        {adherence.remaining} days remaining
                      </>
                    )}
                  </div>
                </div>
              );
            })}

            <button type="button" className={styles.addBtn} onClick={() => setShowCreate(true)}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <line x1="6" y1="1" x2="6" y2="11" stroke="white" strokeWidth="2" strokeLinecap="round" />
                <line x1="1" y1="6" x2="11" y2="6" stroke="white" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Create Protocol
            </button>
          </div>
        )}
      </main>

      {showCreate ? (
        <CreateProtocolModal onClose={() => setShowCreate(false)} onSaved={() => setShowCreate(false)} />
      ) : null}

      {confirmDelete ? (
        <ConfirmDeleteModal
          name={confirmDelete.name}
          description="This protocol and its schedule will be permanently removed. Logged doses are not affected."
          onCancel={() => setConfirmDelete(null)}
          onConfirm={async () => {
            await deleteProtocol(confirmDelete.id);
            setConfirmDelete(null);
          }}
        />
      ) : null}
    </div>
  );
}
