"use client";

import { useActionState, useState } from "react";
import { Modal, ModalHeader, ModalBody } from "@/components/ui/Modal";
import formStyles from "@/components/ui/Form.module.css";
import { type ComputeResult, type VialRow } from "@/lib/vial-math";
import { logDose, type LogDoseState } from "@/app/vials/actions";
import { UnitMismatchModal } from "./UnitMismatchModal";
import { OutlierWarningModal } from "./OutlierWarningModal";

const SITES = [
  { key: "Abdomen", label: "Abdomen" },
  { key: "Left Thigh", label: "L Thigh" },
  { key: "Right Thigh", label: "R Thigh" },
  { key: "Left Arm", label: "L Arm" },
  { key: "Right Arm", label: "R Arm" },
  { key: "Left Glute", label: "L Glute" },
  { key: "Right Glute", label: "R Glute" },
  { key: "Subcutaneous", label: "Sub-Q" },
];

const EFFECT_TAGS = [
  { key: "energy", label: "Energy" },
  { key: "sleep", label: "Sleep" },
  { key: "appetite", label: "Appetite" },
  { key: "mood", label: "Mood" },
  { key: "isr", label: "ISR" },
];

export function LogDoseModal({
  vial,
  computeResult,
  lastSite,
  recentSites,
  onClose,
  onLogged,
}: {
  vial: VialRow;
  computeResult: ComputeResult;
  lastSite: string | null;
  recentSites: { site: string; dateStr: string }[];
  onClose: () => void;
  onLogged: (depleted: boolean) => void;
}) {
  const [state, formAction, isPending] = useActionState<LogDoseState, FormData>(
    async (prevState, formData) => {
      const result = await logDose(prevState, formData);
      if (result.success) onLogged(!!result.depleted);
      return result;
    },
    {},
  );

  const [unit, setUnit] = useState<"mcg" | "mg">("mcg");
  const [mcgDose, setMcgDose] = useState(String(vial.planned_dose_mcg));
  const [site, setSite] = useState(lastSite || "Abdomen");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState<Record<string, boolean>>(
    Object.fromEntries(EFFECT_TAGS.map((t) => [t.key, false])),
  );
  const [rating, setRating] = useState(0);
  const [warningDismissed, setWarningDismissed] = useState(false);

  function switchUnit(newUnit: "mcg" | "mg") {
    if (newUnit === unit) return;
    const current = parseFloat(mcgDose) || 0;
    setMcgDose(newUnit === "mg" ? String(current / 1000) : String(current * 1000));
    setUnit(newUnit);
    setWarningDismissed(true);
  }

  const actualMcg = unit === "mg" ? (parseFloat(mcgDose) || 0) * 1000 : parseFloat(mcgDose) || 0;
  const mlUsed = computeResult.mcgPerMl > 0 ? actualMcg / computeResult.mcgPerMl : 0;
  const unitsDisplay = mlUsed * (computeResult.device.unitsPerMl || 0);
  const overLimit = mlUsed > computeResult.remainingMl + 0.0001;
  const remainUnits = (computeResult.remainingMl * (computeResult.device.unitsPerMl || 0)).toFixed(1);
  const remainMcg = (computeResult.remainingMl * computeResult.mcgPerMl).toFixed(0);

  const placeholder =
    unit === "mg"
      ? `${(vial.planned_dose_mcg / 1000).toFixed(4)} mg (planned)`
      : `${vial.planned_dose_mcg} mcg (planned)`;

  const activeWarning = !warningDismissed ? state.warning : undefined;

  function buildConfirmedFormData() {
    const fd = new FormData();
    fd.set("vialId", vial.id);
    fd.set("mcgDose", mcgDose);
    fd.set("unit", unit);
    fd.set("site", site);
    fd.set("notes", notes);
    fd.set("tags", JSON.stringify(tags));
    fd.set("rating", String(rating));
    fd.set("confirmed", "true");
    return fd;
  }

  const siteActiveStyle = {
    background: "var(--pt-info-bg)",
    color: "var(--pt-info-fg)",
    border: "2px solid var(--pt-info-fg)",
    borderRadius: 10,
    padding: "9px 6px",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  } as const;

  const siteInactiveStyle = {
    background: "var(--pt-surface)",
    color: "var(--pt-muted)",
    border: "1.5px solid var(--pt-border-soft)",
    borderRadius: 10,
    padding: "9px 6px",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  } as const;

  const tagActiveStyle = {
    background: "var(--pt-info-bg)",
    color: "var(--pt-info-fg)",
    border: "2px solid var(--pt-info-fg)",
    borderRadius: 99,
    padding: "8px 15px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  } as const;

  const tagInactiveStyle = {
    background: "var(--pt-surface)",
    color: "var(--pt-muted)",
    border: "1.5px solid var(--pt-border-soft)",
    borderRadius: 99,
    padding: "8px 15px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  } as const;

  return (
    <>
      <Modal onClose={onClose} maxWidth={480}>
        <form action={formAction}>
          <input type="hidden" name="vialId" value={vial.id} />
          <input type="hidden" name="unit" value={unit} />
          <input type="hidden" name="confirmed" value="false" />
          <input type="hidden" name="tags" value={JSON.stringify(tags)} />
          <input type="hidden" name="rating" value={String(rating)} />
          <ModalHeader title="Log Dose" subtitle={vial.name} />
          <ModalBody>
            {state.error ? <div className={formStyles.error}>{state.error}</div> : null}

            {/* Dose amount + unit toggle */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <label className={formStyles.label}>Dose Amount</label>
                <div style={{ display: "flex", background: "var(--pt-surface-soft)", borderRadius: 8, padding: 3, gap: 2 }}>
                  {(["mcg", "mg"] as const).map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => switchUnit(u)}
                      style={{
                        border: "none",
                        borderRadius: 6,
                        padding: "4px 10px",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                        background: unit === u ? "var(--pt-accent)" : "transparent",
                        color: unit === u ? "white" : "var(--pt-muted)",
                      }}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>
              <input
                name="mcgDose"
                type="number"
                value={mcgDose}
                onChange={(e) => { setMcgDose(e.target.value); setWarningDismissed(true); }}
                placeholder={placeholder}
                min={0}
                step="any"
                className={formStyles.input}
              />
              <div
                style={{
                  marginTop: 9,
                  background: "var(--pt-accent-soft-bg)",
                  borderRadius: 11,
                  padding: "11px 15px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ fontSize: 12, color: "var(--pt-accent-soft-fg)", fontWeight: 600 }}>Draw on syringe</span>
                <span style={{ fontSize: 22, fontWeight: 800, color: "var(--pt-accent-deep)", letterSpacing: "-0.02em" }}>
                  {unitsDisplay.toFixed(1)} <span style={{ fontSize: 12, fontWeight: 600 }}>units</span>
                </span>
              </div>
            </div>

            {/* Injection site — 4×2 button grid */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <label className={formStyles.label}>Injection Site</label>
                {lastSite ? (
                  <span style={{ fontSize: 12, color: "var(--pt-muted-2)" }}>
                    Last: <strong style={{ color: "var(--pt-accent-soft-fg)" }}>{lastSite}</strong>
                  </span>
                ) : null}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 7, marginBottom: 10 }}>
                {SITES.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setSite(s.key)}
                    style={site === s.key ? siteActiveStyle : siteInactiveStyle}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              {/* Hidden site field so FormData picks it up */}
              <input type="hidden" name="site" value={site} />
              {recentSites.length > 0 ? (
                <div
                  style={{
                    background: "var(--pt-surface-soft)",
                    borderRadius: 10,
                    padding: "10px 14px",
                  }}
                >
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--pt-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                    Recent Rotation
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {recentSites.map((rs, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: "var(--pt-muted)",
                          background: "var(--pt-border-soft)",
                          padding: "2px 9px",
                          borderRadius: 99,
                        }}
                      >
                        {rs.site} · {rs.dateStr}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Effect & side-effect tagging */}
            <div>
              <label className={formStyles.label} style={{ display: "block", marginBottom: 10 }}>
                Effects &amp; Side Effects
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 16 }}>
                {EFFECT_TAGS.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTags((prev) => ({ ...prev, [t.key]: !prev[t.key] }))}
                    style={tags[t.key] ? tagActiveStyle : tagInactiveStyle}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <label className={formStyles.label} style={{ display: "block", marginBottom: 10 }}>
                Overall Rating <span style={{ fontWeight: 500, textTransform: "none", letterSpacing: 0, fontSize: 11 }}>(optional)</span>
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(rating === n ? 0 : n)}
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 10,
                      fontSize: 15,
                      fontWeight: 800,
                      border: "none",
                      cursor: "pointer",
                      background: n <= rating ? "var(--pt-info-fg)" : "var(--pt-track)",
                      color: n <= rating ? "white" : "var(--pt-muted)",
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className={formStyles.field}>
              <label className={formStyles.label}>Notes (optional)</label>
              <textarea
                name="notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="How you feel, observations, any side effects…"
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  border: "1.5px solid var(--pt-border-soft)",
                  borderRadius: 11,
                  fontSize: 14,
                  color: "var(--pt-ink)",
                  background: "var(--pt-surface)",
                  resize: "vertical",
                  minHeight: 78,
                }}
              />
            </div>

            {overLimit ? (
              <div
                style={{
                  background: "var(--pt-danger-bg)",
                  border: "1.5px solid var(--pt-danger-border)",
                  borderRadius: 12,
                  padding: "12px 15px",
                  fontSize: 13,
                  color: "var(--pt-danger-icon)",
                  fontWeight: 600,
                  lineHeight: 1.5,
                }}
              >
                Not enough left — {remainUnits} units (≈{remainMcg} mcg) remaining.
              </div>
            ) : null}

            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={onClose} className={formStyles.buttonSecondary} style={{ flex: 1 }}>
                Cancel
              </button>
              <button type="submit" disabled={isPending || overLimit} className={formStyles.buttonPrimary} style={{ flex: 2 }}>
                {isPending ? "Recording…" : "Record Dose"}
              </button>
            </div>
          </ModalBody>
        </form>
      </Modal>

      {activeWarning === "unit_mismatch" && state.warningData ? (
        <UnitMismatchModal
          data={state.warningData}
          onChangeToCorrected={() => {
            const { convertedMcg } = state.warningData!;
            if (convertedMcg != null) { setMcgDose(String(convertedMcg)); setUnit("mcg"); }
            setWarningDismissed(true);
          }}
          onKeepAsEntered={() => formAction(buildConfirmedFormData())}
        />
      ) : null}

      {activeWarning === "outlier" && state.warningData ? (
        <OutlierWarningModal
          data={state.warningData}
          onEdit={() => setWarningDismissed(true)}
          onLogAnyway={() => formAction(buildConfirmedFormData())}
        />
      ) : null}
    </>
  );
}
