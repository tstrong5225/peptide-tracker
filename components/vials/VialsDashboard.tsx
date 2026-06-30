"use client";

import { useMemo, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { ReminderBanner, type DueReminder } from "@/components/ReminderBanner";
import { compute, getExpiry, getCostPerDose, badge, barColor } from "@/lib/vial-math";
import type { DeviceRow } from "@/lib/vial-math";
import type { VialWithDoses } from "./types";
import { VialCard, type VialCardData } from "./VialCard";
import { AddEditVialModal } from "./AddEditVialModal";
import { LogDoseModal } from "./LogDoseModal";
import { RateVialModal } from "./RateVialModal";
import { ConfirmDeleteModal } from "./ConfirmDeleteModal";
import { ReorderModal, type ReorderItem } from "./ReorderModal";
import { deleteVial } from "@/app/vials/actions";
import styles from "./VialsDashboard.module.css";

export function VialsDashboard({
  email,
  isAdmin,
  vials,
  customDevices,
  lowVialThresholdPct,
  dueReminders = [],
}: {
  email: string;
  isAdmin: boolean;
  vials: VialWithDoses[];
  customDevices: DeviceRow[];
  lowVialThresholdPct: number;
  dueReminders?: DueReminder[];
}) {
  const [dashTab, setDashTab] = useState<"active" | "archive">("active");
  const [archiveFilter, setArchiveFilter] = useState({
    vendor: "",
    productName: "",
    batchNumber: "",
    coaNumber: "",
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVial, setEditingVial] = useState<VialWithDoses | null>(null);
  const [logVial, setLogVial] = useState<VialWithDoses | null>(null);
  const [rateVialTarget, setRateVialTarget] = useState<VialWithDoses | null>(null);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [confirmDeleteVial, setConfirmDeleteVial] = useState<VialWithDoses | null>(null);

  const allCards = useMemo(() => {
    return vials.map((vial) => {
      const c = compute(vial, vial.doses, customDevices);
      const pct = Math.max(0, Math.round(c.pct));
      const b = badge(pct, lowVialThresholdPct);
      const exp = getExpiry(vial);
      const cpd = getCostPerDose(vial);
      const last = vial.doses.length > 0 ? vial.doses[vial.doses.length - 1] : null;
      const isEmpty = c.remainingMl <= 0.00001;

      const data: VialCardData = {
        id: vial.id,
        name: vial.name,
        mgInVial: vial.mg_in_vial,
        deviceLabel: c.device.label,
        vendorLine: [vial.vendor, vial.product_name].filter(Boolean).join(" — ") || null,
        batchLine:
          [vial.batch_number && `Batch: ${vial.batch_number}`, vial.coa_number && `COA: ${vial.coa_number}`]
            .filter(Boolean)
            .join(" · ") || null,
        statusLabel: b.label,
        statusBg: b.bg,
        statusFg: b.fg,
        expiryLabel: exp?.label ?? null,
        expiryBg: exp?.bg ?? "",
        expiryFg: exp?.fg ?? "",
        pctLabel: isEmpty ? "0%" : `${pct}%`,
        barWidthPct: pct,
        barColor: barColor(pct, lowVialThresholdPct),
        mgLeft: c.mgLeft.toFixed(3),
        dosesLeft: Math.max(0, c.dosesLeft),
        costPerDose: cpd,
        effectivenessLabel: vial.effectiveness != null ? `${vial.effectiveness}/10 effective` : null,
        lastDoseText: last
          ? new Date(last.logged_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
          : "No doses yet",
        doseCount: vial.doses.length,
        canLog: !isEmpty,
        canRate: isEmpty && vial.effectiveness == null,
      };

      return { vial, data, isEmpty, exp };
    });
  }, [vials, customDevices, lowVialThresholdPct]);

  const isArchiveTab = dashTab === "archive";
  let visibleCards = isArchiveTab ? allCards.filter((c) => c.isEmpty) : allCards.filter((c) => !c.isEmpty);

  if (isArchiveTab) {
    const af = archiveFilter;
    if (af.vendor) {
      visibleCards = visibleCards.filter((c) => (c.data.vendorLine || "").toLowerCase().includes(af.vendor.toLowerCase()));
    }
    if (af.productName) {
      visibleCards = visibleCards.filter((c) => c.data.name.toLowerCase().includes(af.productName.toLowerCase()));
    }
    if (af.batchNumber) {
      visibleCards = visibleCards.filter((c) => (c.data.batchLine || "").toLowerCase().includes(af.batchNumber.toLowerCase()));
    }
    if (af.coaNumber) {
      visibleCards = visibleCards.filter((c) => (c.data.batchLine || "").toLowerCase().includes(af.coaNumber.toLowerCase()));
    }
  }

  const archiveCount = allCards.filter((c) => c.isEmpty).length;
  const hasActiveFilter = isArchiveTab && Object.values(archiveFilter).some((v) => v.trim());

  const reorderItems: ReorderItem[] = allCards
    .filter((c) => !c.isEmpty)
    .filter((c) => c.data.statusLabel === "Low" || (c.exp && (c.exp.state === "nearing" || c.exp.state === "expired")))
    .map((c) => {
      const reason = c.data.statusLabel === "Low" ? "Low vial" : c.exp?.label || "";
      return {
        name: c.data.name,
        sub: [c.vial.vendor, c.vial.batch_number && `Batch: ${c.vial.batch_number}`].filter(Boolean).join(" · "),
        badgeLabel: reason,
        badgeBg:
          c.exp?.state === "expired" || c.data.statusLabel === "Low"
            ? "var(--pt-danger-bg)"
            : "var(--pt-warning-bg)",
        badgeFg:
          c.exp?.state === "expired" || c.data.statusLabel === "Low"
            ? "var(--pt-danger-fg)"
            : "var(--pt-warning-fg)",
      };
    });

  const noVials = vials.length === 0;
  const hasVials = vials.length > 0;

  const logVialCompute = logVial ? compute(logVial, logVial.doses, customDevices) : null;
  const lastSite = logVial && logVial.doses.length > 0 ? logVial.doses[logVial.doses.length - 1].site : null;
  const recentSites =
    logVial?.doses
      .slice(-3)
      .reverse()
      .map((d) => ({
        site: d.site,
        dateStr: new Date(d.logged_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      })) ?? [];

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <AppHeader
        email={email}
        isAdmin={isAdmin}
        context={
          <div className={styles.contextActions}>
            <div className={styles.tabGroup}>
              <button
                type="button"
                className={`${styles.tabBtn} ${dashTab === "active" ? styles.tabBtnActive : ""}`}
                onClick={() => setDashTab("active")}
              >
                Active
              </button>
              <button
                type="button"
                className={`${styles.tabBtn} ${dashTab === "archive" ? styles.tabBtnActive : ""}`}
                onClick={() => setDashTab("archive")}
              >
                Archive{archiveCount > 0 ? ` (${archiveCount})` : ""}
              </button>
            </div>
            <button
              type="button"
              className={styles.addBtn}
              onClick={() => {
                setEditingVial(null);
                setShowAddModal(true);
              }}
            >
              <svg width="12" height="12" viewBox="0 0 13 13" fill="none">
                <line x1="6.5" y1="1" x2="6.5" y2="12" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
                <line x1="1" y1="6.5" x2="12" y2="6.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
              Add Vial
            </button>
          </div>
        }
      />

      <main className={styles.main}>
        {dueReminders.length > 0 ? <ReminderBanner reminders={dueReminders} /> : null}
        {reorderItems.length > 0 ? (
          <div className={styles.reorderAlert} onClick={() => setShowReorderModal(true)}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 2L1.5 15.5h15L9 2z" stroke="var(--pt-danger-fg)" strokeWidth="1.6" fill="none" strokeLinejoin="round" />
              <line x1="9" y1="7" x2="9" y2="11" stroke="var(--pt-danger-fg)" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="9" cy="13.5" r="0.9" fill="var(--pt-danger-fg)" />
            </svg>
            <div className={styles.reorderText}>
              {reorderItems.length} vial{reorderItems.length === 1 ? "" : "s"} need attention — low stock or nearing expiry.
            </div>
            <span className={styles.reorderLink}>View all →</span>
          </div>
        ) : null}

        {isArchiveTab ? (
          <div className={styles.filterBar}>
            <div className={styles.filterLabel}>Filter archive</div>
            <div className={styles.filterInputs}>
              <input
                type="text"
                value={archiveFilter.vendor}
                onChange={(e) => setArchiveFilter({ ...archiveFilter, vendor: e.target.value })}
                placeholder="Vendor / Manufacturer"
                className={styles.filterInput}
              />
              <input
                type="text"
                value={archiveFilter.productName}
                onChange={(e) => setArchiveFilter({ ...archiveFilter, productName: e.target.value })}
                placeholder="Product name"
                className={styles.filterInput}
              />
              <input
                type="text"
                value={archiveFilter.batchNumber}
                onChange={(e) => setArchiveFilter({ ...archiveFilter, batchNumber: e.target.value })}
                placeholder="Batch #"
                className={styles.filterInput}
              />
              <input
                type="text"
                value={archiveFilter.coaNumber}
                onChange={(e) => setArchiveFilter({ ...archiveFilter, coaNumber: e.target.value })}
                placeholder="COA #"
                className={styles.filterInput}
              />
            </div>
            {hasActiveFilter ? (
              <button
                type="button"
                className={styles.clearFilter}
                onClick={() => setArchiveFilter({ vendor: "", productName: "", batchNumber: "", coaNumber: "" })}
              >
                Clear filters
              </button>
            ) : null}
          </div>
        ) : null}

        {noVials ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                <rect x="14" y="2" width="8" height="7" rx="2.5" fill="var(--pt-accent)" />
                <rect x="10" y="9" width="16" height="23" rx="5" fill="var(--pt-accent)" opacity="0.2" />
                <rect x="10" y="9" width="16" height="13" rx="5" fill="var(--pt-accent)" opacity="0.65" />
              </svg>
            </div>
            <div className={styles.emptyHeading}>No vials yet</div>
            <div className={styles.emptyBody}>
              Add a vial to start tracking doses, reconstitution, and effectiveness.
            </div>
            <button
              type="button"
              className={styles.addBtn}
              style={{ padding: "13px 30px", fontSize: 14, borderRadius: 13 }}
              onClick={() => setShowAddModal(true)}
            >
              Add Your First Vial
            </button>
          </div>
        ) : null}

        {hasVials ? (
          <div className={styles.grid}>
            {visibleCards.map(({ vial, data }) => (
              <VialCard
                key={vial.id}
                data={data}
                onLog={() => setLogVial(vial)}
                onRate={() => setRateVialTarget(vial)}
                onEdit={() => {
                  setEditingVial(vial);
                  setShowAddModal(true);
                }}
                onDelete={() => setConfirmDeleteVial(vial)}
              />
            ))}
          </div>
        ) : null}
      </main>

      {showAddModal ? (
        <AddEditVialModal
          vial={editingVial}
          customDevices={customDevices}
          onClose={() => {
            setShowAddModal(false);
            setEditingVial(null);
          }}
          onSaved={() => {
            setShowAddModal(false);
            setEditingVial(null);
          }}
        />
      ) : null}

      {logVial && logVialCompute ? (
        <LogDoseModal
          vial={logVial}
          computeResult={logVialCompute}
          lastSite={lastSite}
          recentSites={recentSites}
          onClose={() => setLogVial(null)}
          onLogged={(depleted) => {
            const justLogged = logVial;
            setLogVial(null);
            if (depleted && justLogged) setRateVialTarget(justLogged);
          }}
        />
      ) : null}

      {rateVialTarget ? (
        <RateVialModal
          vial={rateVialTarget}
          onClose={() => setRateVialTarget(null)}
          onRated={() => setRateVialTarget(null)}
        />
      ) : null}

      {showReorderModal ? <ReorderModal items={reorderItems} onClose={() => setShowReorderModal(false)} /> : null}

      {confirmDeleteVial ? (
        <ConfirmDeleteModal
          name={confirmDeleteVial.name}
          description="All dose history will be permanently removed. This cannot be undone."
          onCancel={() => setConfirmDeleteVial(null)}
          onConfirm={async () => {
            await deleteVial(confirmDeleteVial.id);
            setConfirmDeleteVial(null);
          }}
        />
      ) : null}
    </div>
  );
}
