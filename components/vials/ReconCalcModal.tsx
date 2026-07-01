"use client";

import { useState } from "react";
import { Modal, ModalHeader, ModalBody } from "@/components/ui/Modal";
import formStyles from "@/components/ui/Form.module.css";
import { reconCalc } from "@/lib/vial-math";

const RECON_DEVICES = [
  { id: "u100", label: "U-100 (100 u/mL)", unitsPerMl: 100 },
  { id: "u50", label: "U-50 (50 u/mL)", unitsPerMl: 50 },
  { id: "tb1", label: "Tuberculin 1mL", unitsPerMl: 100 },
];

export function ReconCalcModal({
  initialVialMg,
  initialBacMl,
  initialTargetMcg,
  onClose,
}: {
  initialVialMg?: number;
  initialBacMl?: number;
  initialTargetMcg?: number;
  onClose: () => void;
}) {
  const [vialMg, setVialMg] = useState(String(initialVialMg ?? 5));
  const [bacMl, setBacMl] = useState(String(initialBacMl ?? 2));
  const [targetMcg, setTargetMcg] = useState(String(initialTargetMcg ?? 250));
  const [device, setDevice] = useState("u100");

  const unitsPerMl = RECON_DEVICES.find((d) => d.id === device)?.unitsPerMl ?? 100;
  const result = reconCalc(parseFloat(vialMg), parseFloat(bacMl), parseFloat(targetMcg), unitsPerMl);

  return (
    <Modal onClose={onClose} maxWidth={480} zIndex={300}>
      <ModalHeader
        title="Reconstitution Calculator"
        subtitle="Calculate exact draw amount for any dilution or target dose"
      />
      <ModalBody>
        <div style={{ display: "grid", gridTemplateColumns: "var(--grid-2col)", gap: 13 }}>
          <div className={formStyles.field}>
            <label className={formStyles.label}>Vial Total (mg)</label>
            <input
              type="number"
              value={vialMg}
              onChange={(e) => setVialMg(e.target.value)}
              className={formStyles.input}
            />
          </div>
          <div className={formStyles.field}>
            <label className={formStyles.label}>BAC Water (mL)</label>
            <input
              type="number"
              value={bacMl}
              onChange={(e) => setBacMl(e.target.value)}
              className={formStyles.input}
            />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "var(--grid-2col)", gap: 13 }}>
          <div className={formStyles.field}>
            <label className={formStyles.label}>Target Dose (mcg)</label>
            <input
              type="number"
              value={targetMcg}
              onChange={(e) => setTargetMcg(e.target.value)}
              className={formStyles.input}
            />
          </div>
          <div className={formStyles.field}>
            <label className={formStyles.label}>Device</label>
            <select
              value={device}
              onChange={(e) => setDevice(e.target.value)}
              className={formStyles.input}
              style={{ cursor: "pointer" }}
            >
              {RECON_DEVICES.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ background: "var(--pt-accent-soft-bg)", borderRadius: 16, padding: "18px 20px" }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--pt-info-fg)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 14,
            }}
          >
            Result
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap", marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 52, fontWeight: 800, color: "var(--pt-accent-deep)", letterSpacing: "-0.03em", lineHeight: 1 }}>
                {result.units}
              </div>
              <div style={{ fontSize: 13, color: "var(--pt-info-fg-soft)", fontWeight: 600, marginTop: 2 }}>
                units to draw
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <div style={{ fontSize: 12, color: "var(--pt-info-fg-soft)" }}>{result.conc} mcg/mL concentration</div>
              <div style={{ fontSize: 12, color: "var(--pt-info-fg-soft)" }}>{result.ml} mL per dose</div>
            </div>
          </div>
          <div
            style={{
              borderTop: "1px solid var(--pt-info-divider)",
              paddingTop: 12,
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--pt-info-fg-soft)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>
              Calculation
            </div>
            <div style={{ fontSize: 12, color: "var(--pt-info-fg-faint)" }}>① {result.step1}</div>
            <div style={{ fontSize: 12, color: "var(--pt-info-fg-faint)" }}>② {result.step2}</div>
            <div style={{ fontSize: 12, color: "var(--pt-info-fg-faint)" }}>③ {result.step3}</div>
            <div style={{ fontSize: 12, color: "var(--pt-info-fg-faint)" }}>④ {result.step4}</div>
          </div>
        </div>

        <button type="button" onClick={onClose} className={formStyles.buttonPrimary} style={{ width: "100%" }}>
          Done
        </button>
      </ModalBody>
    </Modal>
  );
}
