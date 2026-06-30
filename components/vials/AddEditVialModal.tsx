"use client";

import { useActionState, useState } from "react";
import { Modal, ModalHeader, ModalBody } from "@/components/ui/Modal";
import formStyles from "@/components/ui/Form.module.css";
import { BUILT_IN_DEVICES, type DeviceRow, type VialRow } from "@/lib/vial-math";
import { saveVial, type ActionState } from "@/app/vials/actions";

const SAVED_DEVICE_OPTIONS = BUILT_IN_DEVICES.filter((d) => d.id !== "custom");

export function AddEditVialModal({
  vial,
  customDevices,
  onClose,
  onSaved,
}: {
  vial: VialRow | null;
  customDevices: DeviceRow[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    async (prevState, formData) => {
      const result = await saveVial(prevState, formData);
      if (result.success) onSaved();
      return result;
    },
    {},
  );

  const [deviceId, setDeviceId] = useState(vial?.device_id || "u100");
  const [mgInVial, setMgInVial] = useState(vial ? String(vial.mg_in_vial) : "");
  const [mLLiquid, setMLLiquid] = useState(vial ? String(vial.ml_liquid) : "");
  const [plannedDoseMcg, setPlannedDoseMcg] = useState(vial ? String(vial.planned_dose_mcg) : "");
  const [customUnitsPerMl, setCustomUnitsPerMl] = useState(
    vial?.custom_units_per_ml ? String(vial.custom_units_per_ml) : "",
  );

  const mg = parseFloat(mgInVial) || 0;
  const ml = parseFloat(mLLiquid) || 0;
  const dose = parseFloat(plannedDoseMcg) || 0;
  const mcgPerMl = mg && ml ? (mg * 1000) / ml : 0;
  const unitsPerDose =
    mcgPerMl && dose
      ? (dose / mcgPerMl) *
        (deviceId === "custom"
          ? parseFloat(customUnitsPerMl) || 0
          : SAVED_DEVICE_OPTIONS.find((d) => d.id === deviceId)?.unitsPerMl ||
            customDevices.find((d) => d.id === deviceId)?.units_per_ml ||
            0)
      : 0;
  const hasCalc = mcgPerMl > 0;
  const showCustomDevice = deviceId === "custom";
  const selectedHint =
    !showCustomDevice
      ? SAVED_DEVICE_OPTIONS.find((d) => d.id === deviceId)?.hint ||
        customDevices.find((d) => d.id === deviceId)?.hint
      : "";

  const formValid = !!(mg && ml && dose && String(vial?.name ?? "").length >= 0);

  return (
    <Modal onClose={onClose} maxWidth={540}>
      <form action={formAction}>
        <input type="hidden" name="id" value={vial?.id || ""} />
        <ModalHeader
          title={vial ? "Edit Vial" : "Add New Vial"}
          subtitle="Reconstitution math calculates as you fill in fields."
        />
        <ModalBody>
          {state.error ? <div className={formStyles.error}>{state.error}</div> : null}

          <div className={formStyles.field}>
            <label className={formStyles.label}>Peptide Name</label>
            <input
              name="name"
              type="text"
              defaultValue={vial?.name || ""}
              placeholder="e.g. BPC-157, TB-500…"
              required
              className={formStyles.input}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 13 }}>
            <div className={formStyles.field}>
              <label className={formStyles.label}>Vial Amount (mg)</label>
              <input
                name="mgInVial"
                type="number"
                value={mgInVial}
                onChange={(e) => setMgInVial(e.target.value)}
                placeholder="e.g. 5"
                min={0}
                step="0.5"
                required
                className={formStyles.input}
              />
            </div>
            <div className={formStyles.field}>
              <label className={formStyles.label}>Planned Dose (mcg)</label>
              <input
                name="plannedDoseMcg"
                type="number"
                value={plannedDoseMcg}
                onChange={(e) => setPlannedDoseMcg(e.target.value)}
                placeholder="e.g. 250"
                min={0}
                step="1"
                required
                className={formStyles.input}
              />
            </div>
          </div>

          <div>
            <label className={formStyles.label}>Measurement Device</label>
            <select
              name="deviceId"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              className={formStyles.input}
              style={{ cursor: "pointer" }}
            >
              {SAVED_DEVICE_OPTIONS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label} — {d.unitsPerMl} {d.unitLabel || "units"}/mL
                </option>
              ))}
              {customDevices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
              <option value="custom">+ Create custom device…</option>
            </select>

            {showCustomDevice ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  marginTop: 10,
                  padding: 14,
                  background: "var(--pt-page-bg)",
                  borderRadius: 12,
                  border: "1.5px solid var(--pt-border)",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--pt-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Custom Device Setup
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  <div className={formStyles.field}>
                    <label className={formStyles.label}>Device name</label>
                    <input
                      name="customDeviceName"
                      type="text"
                      defaultValue={vial?.custom_device_name || ""}
                      placeholder="e.g. BD SafetyGlide"
                      className={formStyles.input}
                    />
                  </div>
                  <div className={formStyles.field}>
                    <label className={formStyles.label}>Unit label</label>
                    <input
                      name="customUnitLabel"
                      type="text"
                      defaultValue={vial?.custom_unit_label || "units"}
                      placeholder="e.g. units, IU, mL"
                      className={formStyles.input}
                    />
                  </div>
                  <div className={formStyles.field}>
                    <label className={formStyles.label}>Units per mL</label>
                    <input
                      name="customUnitsPerMl"
                      type="number"
                      value={customUnitsPerMl}
                      onChange={(e) => setCustomUnitsPerMl(e.target.value)}
                      placeholder="e.g. 100"
                      min={0.001}
                      step="any"
                      className={formStyles.input}
                    />
                  </div>
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input
                    name="saveCustomDevice"
                    type="checkbox"
                    style={{ accentColor: "var(--pt-accent)", width: 15, height: 15 }}
                  />
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--pt-accent-soft-fg)" }}>
                    Save as reusable device for future vials
                  </span>
                </label>
              </div>
            ) : null}
            {selectedHint ? (
              <div style={{ fontSize: 11, color: "var(--pt-info-fg-soft)", marginTop: 6, fontWeight: 600 }}>
                {selectedHint}
              </div>
            ) : null}
          </div>

          <div className={formStyles.field}>
            <label className={formStyles.label}>Diluent Added (mL)</label>
            <input
              name="mLLiquid"
              type="number"
              value={mLLiquid}
              onChange={(e) => setMLLiquid(e.target.value)}
              placeholder="e.g. 2 (mL of BAC water)"
              min={0}
              step="0.1"
              required
              className={formStyles.input}
            />
          </div>

          {hasCalc ? (
            <div style={{ background: "var(--pt-accent-soft-bg)", borderRadius: 14, padding: "15px 18px" }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--pt-info-fg)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 12,
                }}
              >
                Reconstitution Preview
              </div>
              <div style={{ display: "flex", gap: 22, flexWrap: "wrap", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 11, color: "var(--pt-info-fg-soft)", fontWeight: 600, marginBottom: 2 }}>
                    mcg per mL
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: "var(--pt-accent-deep)", letterSpacing: "-0.02em" }}>
                    {mcgPerMl.toFixed(2)}
                  </div>
                </div>
                <div style={{ width: 1, height: 36, background: "var(--pt-info-divider)" }} />
                <div>
                  <div style={{ fontSize: 11, color: "var(--pt-info-fg-soft)", fontWeight: 600, marginBottom: 2 }}>
                    units per planned dose
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: "var(--pt-accent-deep)", letterSpacing: "-0.02em" }}>
                    {unitsPerDose.toFixed(1)}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <div style={{ borderTop: "1.5px solid var(--pt-divider)", paddingTop: 16 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--pt-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 13,
              }}
            >
              Storage &amp; Costs <span style={{ fontWeight: 500, textTransform: "none" }}>(optional)</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 13 }}>
              <div className={formStyles.field}>
                <label className={formStyles.label}>Reconstituted On</label>
                <input
                  name="reconstitutedOn"
                  type="date"
                  defaultValue={vial?.reconstituted_on || ""}
                  className={formStyles.input}
                />
              </div>
              <div className={formStyles.field}>
                <label className={formStyles.label}>Stability (days)</label>
                <input
                  name="stabilityDays"
                  type="number"
                  defaultValue={vial?.stability_days ?? 28}
                  placeholder="28"
                  min={1}
                  max={90}
                  step="1"
                  className={formStyles.input}
                />
              </div>
              <div className={formStyles.field}>
                <label className={formStyles.label}>Vial Cost ($)</label>
                <input
                  name="vialCost"
                  type="number"
                  defaultValue={vial?.vial_cost ?? ""}
                  placeholder="e.g. 89.00"
                  min={0}
                  step="0.01"
                  className={formStyles.input}
                />
              </div>
            </div>
          </div>

          <div style={{ borderTop: "1.5px solid var(--pt-divider)", paddingTop: 16 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--pt-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 13,
              }}
            >
              Research Details <span style={{ fontWeight: 500, textTransform: "none" }}>(optional)</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 13 }}>
                <div className={formStyles.field}>
                  <label className={formStyles.label}>Vendor / Manufacturer</label>
                  <input
                    name="vendor"
                    type="text"
                    defaultValue={vial?.vendor || ""}
                    placeholder="e.g. Peptide Sciences"
                    className={formStyles.input}
                  />
                </div>
                <div className={formStyles.field}>
                  <label className={formStyles.label}>Product / Brand Name</label>
                  <input
                    name="productName"
                    type="text"
                    defaultValue={vial?.product_name || ""}
                    placeholder="e.g. BPC-157 Gold"
                    className={formStyles.input}
                  />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 13 }}>
                <div className={formStyles.field}>
                  <label className={formStyles.label}>Batch Number</label>
                  <input
                    name="batchNumber"
                    type="text"
                    defaultValue={vial?.batch_number || ""}
                    placeholder="e.g. LOT-2024-009"
                    className={formStyles.input}
                  />
                </div>
                <div className={formStyles.field}>
                  <label className={formStyles.label}>COA Number</label>
                  <input
                    name="coaNumber"
                    type="text"
                    defaultValue={vial?.coa_number || ""}
                    placeholder="e.g. COA-88421"
                    className={formStyles.input}
                  />
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
            <button type="button" onClick={onClose} className={formStyles.buttonSecondary} style={{ flex: 1 }}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !formValid}
              className={formStyles.buttonPrimary}
              style={{ flex: 2 }}
            >
              {isPending ? "Saving…" : vial ? "Save Changes" : "Add Vial"}
            </button>
          </div>
        </ModalBody>
      </form>
    </Modal>
  );
}
