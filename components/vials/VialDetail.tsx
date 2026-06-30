"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AppHeader } from "@/components/AppHeader";
import { compute, getExpiry, getCostPerDose, badge, barColor } from "@/lib/vial-math";
import type { DeviceRow } from "@/lib/vial-math";
import type { VialWithDoses } from "./types";
import { AddEditVialModal } from "./AddEditVialModal";
import { LogDoseModal } from "./LogDoseModal";
import { ReconCalcModal } from "./ReconCalcModal";
import { RateVialModal } from "./RateVialModal";
import { ConfirmDeleteModal } from "./ConfirmDeleteModal";
import { deleteVial, deleteDose } from "@/app/vials/actions";
import styles from "./VialDetail.module.css";
import dashboardStyles from "./VialsDashboard.module.css";

export function VialDetail({
  email,
  isAdmin,
  vial,
  customDevices,
  lowVialThresholdPct,
}: {
  email: string;
  isAdmin: boolean;
  vial: VialWithDoses;
  customDevices: DeviceRow[];
  lowVialThresholdPct: number;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showReconModal, setShowReconModal] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const c = compute(vial, vial.doses, customDevices);
  const pct = Math.max(0, Math.round(c.pct));
  const b = badge(pct, lowVialThresholdPct);
  const exp = getExpiry(vial);
  const cpd = getCostPerDose(vial);
  const totalDosesEst = vial.planned_dose_mcg ? Math.round((vial.mg_in_vial * 1000) / vial.planned_dose_mcg) : 0;
  const hasEffectiveness = vial.effectiveness != null;
  const lastSite = vial.doses.length > 0 ? vial.doses[vial.doses.length - 1].site : null;
  const recentSites = vial.doses
    .slice(-3)
    .reverse()
    .map((d) => ({
      site: d.site,
      dateStr: new Date(d.logged_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    }));

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <AppHeader
        email={email}
        isAdmin={isAdmin}
        context={
          <div style={{ display: "flex", gap: 7, flexShrink: 0 }}>
            <button type="button" className={dashboardStyles.addBtn} onClick={() => setShowLogModal(true)}>
              Log Dose
            </button>
            <button
              type="button"
              className={dashboardStyles.tabBtn}
              style={{
                background: "rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.8)",
                border: "1.5px solid rgba(255,255,255,0.15)",
              }}
              onClick={() => setShowReconModal(true)}
            >
              Recon Calc
            </button>
            <button
              type="button"
              className={dashboardStyles.tabBtn}
              style={{
                background: "rgba(255,255,255,0.1)",
                color: "white",
                border: "1.5px solid rgba(255,255,255,0.15)",
              }}
              onClick={() => setShowAddModal(true)}
            >
              Edit
            </button>
            <button
              type="button"
              className={dashboardStyles.tabBtn}
              style={{
                background: "rgba(255,255,255,0.06)",
                color: "oklch(0.72 0.18 22)",
                border: "1.5px solid rgba(255,255,255,0.1)",
              }}
              onClick={() => setConfirmDelete(true)}
            >
              Delete
            </button>
          </div>
        }
      />

      <main className={styles.main}>
        <button type="button" className={styles.backBtn} onClick={() => router.push("/")}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Dashboard
        </button>

        <div className={styles.card}>
          <div className={styles.headerTop}>
            <div>
              <div className={styles.vialName}>{vial.name}</div>
              <div className={styles.vialSub}>
                {vial.mg_in_vial}mg · {c.device.label}
              </div>
              {vial.vendor || vial.product_name ? (
                <div className={styles.vendorLine}>
                  {[vial.vendor, vial.product_name].filter(Boolean).join(" — ")}
                </div>
              ) : null}
              {vial.batch_number || vial.coa_number ? (
                <div className={styles.batchLine}>
                  {[vial.batch_number && `Batch: ${vial.batch_number}`, vial.coa_number && `COA: ${vial.coa_number}`]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
              ) : null}
            </div>
            <span className={styles.statusBadge} style={{ background: b.bg, color: b.fg }}>
              {b.label}
            </span>
          </div>

          <div style={{ margin: "16px 0" }}>
            <div className={styles.barRow}>
              <span className={styles.barLabel}>Vial Remaining</span>
              <span className={styles.barPct}>{pct}%</span>
            </div>
            <div className={styles.barTrack}>
              <div
                className={styles.barFill}
                style={{ width: `${pct}%`, background: barColor(pct, lowVialThresholdPct) }}
              />
            </div>
          </div>

          <div className={styles.statGrid}>
            <div className={styles.statBox}>
              <div className={styles.statLabel}>mcg / mL</div>
              <div className={styles.statValue}>{c.mcgPerMl ? c.mcgPerMl.toFixed(0) : "—"}</div>
            </div>
            <div className={styles.statBox}>
              <div className={styles.statLabel}>Units / Dose</div>
              <div className={styles.statValue}>{c.unitsPerDose ? c.unitsPerDose.toFixed(1) : "—"}</div>
            </div>
            <div className={styles.statBox}>
              <div className={styles.statLabel}>mg Remaining</div>
              <div className={styles.statValue}>{c.mgLeft.toFixed(3)}</div>
            </div>
            <div className={styles.statBox}>
              <div className={styles.statLabel}>Doses Left</div>
              <div className={styles.statValue}>{Math.max(0, c.dosesLeft)}</div>
            </div>
            {cpd ? (
              <div className={styles.statBoxHighlight}>
                <div className={styles.statLabel} style={{ color: "var(--pt-accent-soft-fg)" }}>
                  Cost / Dose
                </div>
                <div className={styles.statValue} style={{ color: "oklch(0.40 0.19 38)" }}>
                  ${cpd}
                </div>
              </div>
            ) : null}
          </div>

          {cpd ? (
            <div className={styles.costNote}>
              Vial cost: <strong style={{ color: "oklch(0.38 0.02 225)" }}>${vial.vial_cost?.toFixed(2)}</strong> ·{" "}
              {totalDosesEst} est. doses
            </div>
          ) : null}
        </div>

        {exp ? (
          <div className={styles.card}>
            <div className={styles.cardTitle}>Stability &amp; Expiry</div>
            <div className={styles.stabilityGrid}>
              <div className={styles.statBox}>
                <div className={styles.statLabel}>Reconstituted On</div>
                <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 3 }}>{exp.reconStr}</div>
                <div style={{ fontSize: 12, color: "oklch(0.6 0.02 225)" }}>{exp.daysSince} days ago</div>
              </div>
              <div
                className={styles.statBox}
                style={{ background: exp.bg, border: `2px solid ${exp.fg}22` }}
              >
                <div className={styles.statLabel} style={{ color: exp.fg }}>
                  Use By
                </div>
                <div style={{ fontSize: 17, fontWeight: 800, color: exp.fg, marginBottom: 6 }}>{exp.useByStr}</div>
                <span
                  style={{
                    background: exp.bg,
                    color: exp.fg,
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "3px 10px",
                    borderRadius: 99,
                    display: "inline-block",
                  }}
                >
                  {exp.label}
                </span>
              </div>
            </div>
            <div
              className={styles.fridgeNote}
              style={{
                background: exp.state === "fresh" ? "oklch(0.95 0.04 222)" : exp.bg,
                border: `1.5px solid ${exp.fg}33`,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
                <rect x="4" y="2" width="10" height="14" rx="3" stroke={exp.fg} strokeWidth="1.4" fill="none" />
                <line x1="4" y1="7" x2="14" y2="7" stroke={exp.fg} strokeWidth="1.4" />
                <line x1="9" y1="3.5" x2="9" y2="5.5" stroke={exp.fg} strokeWidth="1.4" strokeLinecap="round" />
                <line x1="9" y1="10" x2="9" y2="13" stroke={exp.fg} strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: exp.fg }}>
                  {exp.state === "expired"
                    ? "Do not use — past stability window"
                    : exp.state === "nearing"
                      ? "Refrigeration critical"
                      : "Store refrigerated at 2–8°C"}
                </div>
                <div style={{ fontSize: 11, color: exp.fg, marginTop: 1, opacity: 0.8 }}>
                  {exp.state === "expired"
                    ? "Discard safely per local regulations"
                    : `Stable for ${vial.stability_days || 28} days after reconstitution`}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {hasEffectiveness ? (
          <div className={styles.card}>
            <div className={styles.cardTitle}>Vial Effectiveness</div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  background: "var(--pt-accent-soft-bg)",
                  borderRadius: 18,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: 26, fontWeight: 800, color: "oklch(0.44 0.16 38)", letterSpacing: "-0.02em" }}>
                  {vial.effectiveness}
                </span>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 3 }}>{vial.effectiveness} / 10</div>
                {vial.effectiveness_note ? (
                  <div style={{ fontSize: 13, color: "var(--pt-muted)", lineHeight: 1.5, fontStyle: "italic" }}>
                    &ldquo;{vial.effectiveness_note}&rdquo;
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        <div className={styles.card} style={{ padding: 0, overflow: "hidden" }}>
          <div className={styles.cardTitleRow}>
            <div className={styles.cardTitleRowText}>Dose History</div>
          </div>
          {vial.doses.length === 0 ? (
            <div className={styles.emptyHistory}>No doses logged yet. Press &ldquo;Log Dose&rdquo; to record your first dose.</div>
          ) : (
            [...vial.doses].reverse().map((dose) => (
              <div key={dose.id} className={styles.doseRow}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 7, marginBottom: 4 }}>
                    <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.01em" }}>{dose.mcg_dose} mcg</span>
                    <span style={{ fontSize: 12, color: "var(--pt-muted)", fontWeight: 500 }}>
                      {dose.units_used.toFixed(1)} units
                    </span>
                    <span className={styles.doseSiteBadge}>{dose.site}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "oklch(0.6 0.02 225)" }}>
                    {new Date(dose.logged_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}{" "}
                    ·{" "}
                    {new Date(dose.logged_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                  </div>
                  {dose.notes ? (
                    <div style={{ fontSize: 13, color: "oklch(0.48 0.02 225)", marginTop: 5, lineHeight: 1.5, fontStyle: "italic" }}>
                      &ldquo;{dose.notes}&rdquo;
                    </div>
                  ) : null}
                </div>
                <button
                  type="button"
                  title="Remove"
                  onClick={() =>
                    startTransition(async () => {
                      await deleteDose(dose.id, vial.id);
                    })
                  }
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "oklch(0.72 0.02 225)",
                    padding: 6,
                    borderRadius: 8,
                    flexShrink: 0,
                    display: "flex",
                  }}
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
            ))
          )}
        </div>
      </main>

      {showAddModal ? (
        <AddEditVialModal
          vial={vial}
          customDevices={customDevices}
          onClose={() => setShowAddModal(false)}
          onSaved={() => setShowAddModal(false)}
        />
      ) : null}

      {showLogModal ? (
        <LogDoseModal
          vial={vial}
          computeResult={c}
          lastSite={lastSite}
          recentSites={recentSites}
          onClose={() => setShowLogModal(false)}
          onLogged={(depleted) => {
            setShowLogModal(false);
            if (depleted) setShowRateModal(true);
          }}
        />
      ) : null}

      {showRateModal ? (
        <RateVialModal vial={vial} onClose={() => setShowRateModal(false)} onRated={() => setShowRateModal(false)} />
      ) : null}

      {showReconModal ? (
        <ReconCalcModal
          initialVialMg={vial.mg_in_vial}
          initialBacMl={vial.ml_liquid}
          initialTargetMcg={vial.planned_dose_mcg}
          onClose={() => setShowReconModal(false)}
        />
      ) : null}

      {confirmDelete ? (
        <ConfirmDeleteModal
          name={vial.name}
          description="All dose history will be permanently removed. This cannot be undone."
          onCancel={() => setConfirmDelete(false)}
          onConfirm={async () => {
            await deleteVial(vial.id);
            router.push("/");
          }}
        />
      ) : null}
    </div>
  );
}
