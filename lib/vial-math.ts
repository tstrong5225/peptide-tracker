// Ported from the Claude Design prototype (Peptide Tracker v2.dc.html).
// Pure functions — no React, no Supabase. Same thresholds/formulas as the prototype.

import type { Database } from "@/lib/supabase/types";

export type VialRow = Database["public"]["Tables"]["vials"]["Row"];
export type DoseLogRow = Database["public"]["Tables"]["dose_logs"]["Row"];
export type DeviceRow = Database["public"]["Tables"]["devices"]["Row"];

export type Device = {
  id: string;
  label: string;
  unitsPerMl: number | null;
  unitLabel?: string;
  hint?: string;
};

export const BUILT_IN_DEVICES: Device[] = [
  { id: "u100", label: "100-unit insulin syringe (U-100)", unitsPerMl: 100, hint: "1 unit = 0.01 mL · most common for peptides" },
  { id: "u50", label: "50-unit insulin syringe (U-50)", unitsPerMl: 50, hint: "1 unit = 0.02 mL" },
  { id: "tb1", label: "1mL tuberculin syringe", unitsPerMl: 100, hint: "1 unit = 0.01 mL" },
  { id: "l1", label: "1mL luer-lock syringe", unitsPerMl: 10, hint: "1 unit = 0.1 mL" },
  { id: "l3", label: "3mL luer-lock syringe", unitsPerMl: 10, hint: "1 unit = 0.1 mL" },
  { id: "oral", label: "Oral / mL-scale syringe", unitsPerMl: 1, hint: "1 unit = 1 mL" },
  { id: "custom", label: "Custom device…", unitsPerMl: null, hint: "" },
];

export function getDevice(
  vial: Pick<VialRow, "device_id" | "custom_device_name" | "custom_unit_label" | "custom_units_per_ml">,
  customDevices: DeviceRow[],
): Device {
  if (vial.device_id === "custom") {
    return {
      id: "custom",
      label: vial.custom_device_name || "Custom",
      unitsPerMl: vial.custom_units_per_ml ?? 100,
      unitLabel: vial.custom_unit_label || "units",
    };
  }
  const saved = customDevices.find((d) => d.id === vial.device_id);
  if (saved) {
    return { id: saved.id, label: saved.label, unitsPerMl: saved.units_per_ml, unitLabel: saved.unit_label, hint: saved.hint ?? undefined };
  }
  return BUILT_IN_DEVICES.find((d) => d.id === (vial.device_id || "u100")) || BUILT_IN_DEVICES[0];
}

export type ComputeResult = {
  mcgPerMl: number;
  mlPerDose: number;
  unitsPerDose: number;
  remainingMl: number;
  pct: number;
  mgLeft: number;
  dosesLeft: number;
  device: Device;
  mLLiquid: number;
};

export function compute(
  vial: VialRow,
  doses: Pick<DoseLogRow, "ml_used">[],
  customDevices: DeviceRow[],
): ComputeResult {
  const device = getDevice(vial, customDevices);
  const mLLiquid = vial.ml_liquid || 0;
  const mg = vial.mg_in_vial || 0;
  const pd = vial.planned_dose_mcg || 0;

  if (!mLLiquid || !mg) {
    return { mcgPerMl: 0, mlPerDose: 0, unitsPerDose: 0, remainingMl: 0, pct: 0, mgLeft: 0, dosesLeft: 0, device, mLLiquid: 0 };
  }

  const mcgPerMl = (mg * 1000) / mLLiquid;
  const mlPerDose = pd > 0 ? pd / mcgPerMl : 0;
  const totalUsedMl = doses.reduce((s, d) => s + (d.ml_used || 0), 0);
  const remainingMl = Math.max(0, mLLiquid - totalUsedMl);
  const pct = (remainingMl / mLLiquid) * 100;

  return {
    mcgPerMl,
    mlPerDose,
    unitsPerDose: mlPerDose * (device.unitsPerMl || 0),
    remainingMl,
    pct,
    mgLeft: (remainingMl / mLLiquid) * mg,
    dosesLeft: mlPerDose > 0 ? Math.floor(remainingMl / mlPerDose) : 0,
    device,
    mLLiquid,
  };
}

export type ExpiryInfo = {
  state: "fresh" | "nearing" | "expired";
  daysLeft: number;
  useByStr: string;
  reconStr: string;
  daysSince: number;
  label: string;
  bg: string;
  fg: string;
};

export function getExpiry(
  vial: Pick<VialRow, "reconstituted_on" | "stability_days">,
  today: Date = new Date(),
): ExpiryInfo | null {
  if (!vial.reconstituted_on) return null;
  const days = vial.stability_days || 28;
  const reconDate = new Date(`${vial.reconstituted_on}T00:00:00`);
  const useByDate = new Date(reconDate.getTime() + days * 86400000);
  const now = new Date(today);
  now.setHours(0, 0, 0, 0);
  const daysLeft = Math.round((useByDate.getTime() - now.getTime()) / 86400000);
  const useByStr = useByDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const reconStr = reconDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const daysSince = Math.round((now.getTime() - reconDate.getTime()) / 86400000);

  if (daysLeft <= 0) {
    return { state: "expired", daysLeft, useByStr, reconStr, daysSince, label: `Expired ${Math.abs(daysLeft)}d ago`, bg: "oklch(0.93 0.07 22)", fg: "oklch(0.45 0.18 22)" };
  }
  if (daysLeft <= 7) {
    return { state: "nearing", daysLeft, useByStr, reconStr, daysSince, label: `Exp. ${daysLeft}d`, bg: "oklch(0.95 0.06 65)", fg: "oklch(0.44 0.15 65)" };
  }
  return { state: "fresh", daysLeft, useByStr, reconStr, daysSince, label: `${daysLeft}d left`, bg: "oklch(0.91 0.07 155)", fg: "oklch(0.42 0.16 155)" };
}

export function getCostPerDose(vial: Pick<VialRow, "vial_cost" | "planned_dose_mcg" | "mg_in_vial">): string | null {
  if (!vial.vial_cost || !vial.planned_dose_mcg || !vial.mg_in_vial) return null;
  const totalDoses = (vial.mg_in_vial * 1000) / vial.planned_dose_mcg;
  return totalDoses > 0 ? (vial.vial_cost / totalDoses).toFixed(2) : null;
}

export function badge(pct: number, lowThresholdPct: number): { bg: string; fg: string; label: string } {
  if (pct <= 0) return { bg: "oklch(0.91 0.01 38)", fg: "oklch(0.45 0.02 225)", label: "Empty" };
  if (pct <= lowThresholdPct) return { bg: "oklch(0.93 0.07 25)", fg: "oklch(0.48 0.19 25)", label: "Low" };
  return { bg: "oklch(0.91 0.07 155)", fg: "oklch(0.42 0.16 155)", label: "Active" };
}

export function barColor(pct: number, lowThresholdPct: number): string {
  if (pct <= 0) return "oklch(0.78 0.02 222)";
  if (pct <= lowThresholdPct) return "oklch(0.55 0.18 25)";
  if (pct <= 50) return "oklch(0.65 0.15 65)";
  return "oklch(0.60 0.20 38)";
}

export type ReconResult = {
  units: string;
  conc: string;
  ml: string;
  step1: string;
  step2: string;
  step3: string;
  step4: string;
};

export function reconCalc(vialMg: number, bacMl: number, targetMcg: number, unitsPerMl: number): ReconResult {
  const mg = vialMg || 5;
  const ml = bacMl || 2;
  const mcg = targetMcg || 250;
  const upm = unitsPerMl || 100;
  const conc = (mg * 1000) / ml;
  const mlPD = mcg / conc;
  const units = mlPD * upm;
  return {
    units: units.toFixed(1),
    conc: conc.toFixed(0),
    ml: mlPD.toFixed(4),
    step1: `${mg} mg × 1000 = ${mg * 1000} mcg total in vial`,
    step2: `${mg * 1000} mcg ÷ ${ml} mL = ${conc.toFixed(0)} mcg/mL`,
    step3: `${mcg} mcg ÷ ${conc.toFixed(0)} mcg/mL = ${mlPD.toFixed(4)} mL`,
    step4: `${mlPD.toFixed(4)} mL × ${upm} u/mL = ${units.toFixed(1)} units`,
  };
}

export const INJECTION_SITES = [
  "Abdomen",
  "Left Thigh",
  "Right Thigh",
  "Left Arm",
  "Right Arm",
  "Left Glute",
  "Right Glute",
  "Subcutaneous",
];

export const RATING_DESCS = [
  "",
  "Not effective",
  "Poor",
  "Below average",
  "Fair",
  "Average",
  "Good",
  "Very good",
  "Excellent",
  "Outstanding",
];
