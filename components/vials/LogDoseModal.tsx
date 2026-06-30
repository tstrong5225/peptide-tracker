"use client";

import { useActionState, useState } from "react";
import { Modal, ModalHeader, ModalBody } from "@/components/ui/Modal";
import formStyles from "@/components/ui/Form.module.css";
import { INJECTION_SITES, type ComputeResult, type VialRow } from "@/lib/vial-math";
import { logDose, type LogDoseState } from "@/app/vials/actions";
import { UnitMismatchModal } from "./UnitMismatchModal";
import { OutlierWarningModal } from "./OutlierWarningModal";

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
  const [warningDismissed, setWarningDismissed] = useState(false);

  function switchUnit(newUnit: "mcg" | "mg") {
    if (newUnit === unit) return;
    const current = parseFloat(mcgDose) || 0;
    setMcgDose(newUnit === "mg" ? String(current / 1000) : String(current * 1000));
    setUnit(newUnit);
    setWarningDismissed(true);
  }

  // Always compute preview in mcg
  const actualMcg = unit === "mg" ? (parseFloat(mcgDose) || 0) * 1000 : parseFloat(mcgDose) || 0;
  const mlUsed = computeResult.mcgPerMl > 0 ? actualMcg / computeResult.mcgPerMl : 0;
  const unitsDisplay = mlUsed * (computeResult.device.unitsPerMl || 0);
  const overLimit = mlUsed > computeResult.remainingMl + 0.0001;
  const remainUnits = (computeResult.remainingMl * (computeResult.device.unitsPerMl || 0)).toFixed(1);
  const remainMcg = (computeResult.remainingMl * computeResult.mcgPerMl).toFixed(0);

  const placeholderMcg = vial.planned_dose_mcg;
  const placeholder =
    unit === "mg"
      ? `${(placeholderMcg / 1000).toFixed(4)} mg (planned)`
      : `${placeholderMcg} mcg (planned)`;

  const activeWarning = !warningDismissed ? state.warning : undefined;

  function buildConfirmedFormData() {
    const fd = new FormData();
    fd.set("vialId", vial.id);
    fd.set("mcgDose", mcgDose);
    fd.set("unit", unit);
    fd.set("site", site);
    fd.set("notes", notes);
    fd.set("confirmed", "true");
    return fd;
  }

  return (
    <>
      <Modal onClose={onClose} maxWidth={440}>
        <form action={formAction}>
          <input type="hidden" name="vialId" value={vial.id} />
          <input type="hidden" name="unit" value={unit} />
          <input type="hidden" name="confirmed" value="false" />
          <ModalHeader title="Log Dose" subtitle={vial.name} />
          <ModalBody>
            {state.error ? <div className={formStyles.error}>{state.error}</div> : null}

            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <label className={formStyles.label}>Dose Amount</label>
                <div
                  style={{
                    display: "flex",
                    background: "var(--pt-surface-soft)",
                    borderRadius: 8,
                    padding: 3,
                    gap: 2,
                  }}
                >
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
                onChange={(e) => {
                  setMcgDose(e.target.value);
                  setWarningDismissed(true);
                }}
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
                <span style={{ fontSize: 12, color: "var(--pt-accent-soft-fg)", fontWeight: 600 }}>
                  Draw on syringe
                </span>
                <span
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: "var(--pt-accent-deep)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {unitsDisplay.toFixed(1)}{" "}
                  <span style={{ fontSize: 12, fontWeight: 600 }}>units</span>
                </span>
              </div>
            </div>

            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <label className={formStyles.label}>Injection Site</label>
                {lastSite ? (
                  <span style={{ fontSize: 12, color: "var(--pt-muted-2)" }}>
                    Last: <strong style={{ color: "var(--pt-accent-soft-fg)" }}>{lastSite}</strong>
                  </span>
                ) : null}
              </div>
              <select
                name="site"
                value={site}
                onChange={(e) => setSite(e.target.value)}
                className={formStyles.input}
                style={{ cursor: "pointer" }}
              >
                {INJECTION_SITES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              {recentSites.length > 0 ? (
                <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {recentSites.map((rs, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: "var(--pt-muted)",
                        background: "var(--pt-track)",
                        padding: "2px 9px",
                        borderRadius: 99,
                      }}
                    >
                      {rs.site} · {rs.dateStr}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            <div className={formStyles.field}>
              <label className={formStyles.label}>Notes (optional)</label>
              <textarea
                name="notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observations, how you feel…"
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
              <button
                type="submit"
                disabled={isPending || overLimit}
                className={formStyles.buttonPrimary}
                style={{ flex: 2 }}
              >
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
            if (convertedMcg != null) {
              setMcgDose(String(convertedMcg));
              setUnit("mcg");
            }
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
