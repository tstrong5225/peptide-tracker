"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { compute } from "@/lib/vial-math";

export type ActionState = { error?: string; success?: boolean };

function num(formData: FormData, key: string): number | null {
  const raw = formData.get(key);
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export async function saveVial(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const id = str(formData, "id");
  const name = str(formData, "name");
  const mgInVial = num(formData, "mgInVial");
  const mLLiquid = num(formData, "mLLiquid");
  const plannedDoseMcg = num(formData, "plannedDoseMcg");

  if (!name || !mgInVial || !mLLiquid || !plannedDoseMcg) {
    return { error: "Name, vial amount, diluent, and planned dose are required." };
  }

  let deviceId = str(formData, "deviceId") || "u100";
  let customDeviceName = "";
  let customUnitLabel = "";
  let customUnitsPerMl: number | null = null;

  if (deviceId === "custom") {
    const saveCustomDevice = formData.get("saveCustomDevice") === "on";
    const formCustomName = str(formData, "customDeviceName");
    const formUnitLabel = str(formData, "customUnitLabel") || "units";
    const formUnitsPerMl = num(formData, "customUnitsPerMl");

    if (saveCustomDevice && formCustomName && formUnitsPerMl) {
      const newDeviceId = `cd${Date.now()}`;
      const { error: deviceError } = await supabase.from("devices").insert({
        id: newDeviceId,
        user_id: user.id,
        label: `${formCustomName} — ${formUnitsPerMl} ${formUnitLabel}/mL`,
        units_per_ml: formUnitsPerMl,
        unit_label: formUnitLabel,
        hint: `1 ${formUnitLabel} = ${(1 / formUnitsPerMl).toFixed(4)} mL`,
      });
      if (deviceError) return { error: `Couldn't save device: ${deviceError.message}` };
      deviceId = newDeviceId;
    } else {
      customDeviceName = formCustomName;
      customUnitLabel = formUnitLabel;
      customUnitsPerMl = formUnitsPerMl;
    }
  }

  const row = {
    user_id: user.id,
    name,
    mg_in_vial: mgInVial,
    ml_liquid: mLLiquid,
    planned_dose_mcg: plannedDoseMcg,
    device_id: deviceId,
    custom_device_name: deviceId === "custom" ? customDeviceName : null,
    custom_unit_label: deviceId === "custom" ? customUnitLabel : null,
    custom_units_per_ml: deviceId === "custom" ? customUnitsPerMl : null,
    vendor: str(formData, "vendor") || null,
    product_name: str(formData, "productName") || null,
    batch_number: str(formData, "batchNumber") || null,
    coa_number: str(formData, "coaNumber") || null,
    vial_cost: num(formData, "vialCost"),
    reconstituted_on: str(formData, "reconstitutedOn") || null,
    stability_days: num(formData, "stabilityDays") || 28,
  };

  const { error } = id
    ? await supabase.from("vials").update(row).eq("id", id)
    : await supabase.from("vials").insert(row);

  if (error) return { error: error.message };

  revalidatePath("/");
  if (id) revalidatePath(`/vials/${id}`);
  return { success: true };
}

export async function deleteVial(id: string): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("vials").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/");
  return { success: true };
}

export type WarningData = {
  peptideName: string;
  // unit mismatch
  enteredUnit?: string;
  priorUnit?: string;
  enteredValue?: number;
  convertedMcg?: number;
  // outlier
  enteredMcg?: number;
  avgMcg?: number;
  multiplier?: number;
  sampleCount?: number;
  // over limit
  remainingMcg?: number;
};

export type LogDoseState = ActionState & {
  depleted?: boolean;
  warning?: "unit_mismatch" | "outlier" | "over_limit";
  warningData?: WarningData;
};

export async function logDose(
  _prevState: LogDoseState,
  formData: FormData,
): Promise<LogDoseState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const vialId = str(formData, "vialId");
  const site = str(formData, "site") || "Abdomen";
  const tagsRaw = str(formData, "tags");
  const ratingInput = num(formData, "rating");
  const notes = str(formData, "notes") || null;
  const unit = str(formData, "unit") || "mcg";
  const confirmed = formData.get("confirmed") === "true";
  const rawDose = num(formData, "mcgDose");
  const loggedAtRaw = str(formData, "loggedAt");

  const [{ data: vial, error: vialError }, { data: doses, error: dosesError }, { data: customDevices }] =
    await Promise.all([
      supabase.from("vials").select("*").eq("id", vialId).single(),
      supabase.from("dose_logs").select("ml_used").eq("vial_id", vialId),
      supabase.from("devices").select("*").eq("user_id", user.id),
    ]);

  if (vialError || !vial) return { error: "Vial not found." };
  if (dosesError) return { error: dosesError.message };

  const c = compute(vial, doses ?? [], customDevices ?? []);

  const enteredValue = rawDose ?? vial.planned_dose_mcg;
  const mcgDose = unit === "mg" ? enteredValue * 1000 : enteredValue;
  if (!mcgDose || mcgDose <= 0) return { error: "Enter a dose amount." };

  const mlUsed = c.mcgPerMl > 0 ? mcgDose / c.mcgPerMl : 0;

  // Over-limit: warn the user before proceeding (skip check when confirmed)
  if (!confirmed && mlUsed > c.remainingMl + 0.0001) {
    return {
      warning: "over_limit",
      warningData: {
        peptideName: vial.name,
        enteredMcg: mcgDose,
        remainingMcg: Math.max(0, c.remainingMl * c.mcgPerMl),
      },
    };
  }

  // --- Safety checks (skipped when user has already confirmed) ---
  if (!confirmed) {
    const { data: matchingVials } = await supabase
      .from("vials")
      .select("id")
      .eq("user_id", user.id)
      .ilike("name", vial.name);

    const matchingIds = (matchingVials ?? []).map((v) => v.id).filter((id) => id !== vialId);
    const allIds = [vialId, ...matchingIds];

    const { data: priorDoses } = await supabase
      .from("dose_logs")
      .select("mcg_dose, unit_convention")
      .in("vial_id", allIds);

    if (priorDoses && priorDoses.length > 0) {
      const priorConventions = priorDoses.map((d) => d.unit_convention);
      const mostCommonPrior = priorConventions
        .sort((a, b) => priorConventions.filter((v) => v === b).length - priorConventions.filter((v) => v === a).length)[0];
      if (mostCommonPrior && mostCommonPrior !== unit) {
        return {
          warning: "unit_mismatch",
          warningData: {
            peptideName: vial.name,
            enteredUnit: unit,
            priorUnit: mostCommonPrior,
            enteredValue,
            convertedMcg: unit === "mg" ? enteredValue * 1000 : enteredValue / 1000,
          },
        };
      }

      const priorMcgDoses = priorDoses.map((d) => d.mcg_dose).filter(Boolean);
      if (priorMcgDoses.length > 0) {
        const avg = priorMcgDoses.reduce((s, x) => s + x, 0) / priorMcgDoses.length;
        const multiplier = mcgDose / avg;
        if (multiplier >= 3) {
          return {
            warning: "outlier",
            warningData: {
              peptideName: vial.name,
              enteredMcg: mcgDose,
              avgMcg: avg,
              multiplier,
              sampleCount: priorMcgDoses.length,
            },
          };
        }
      }
    }
  }
  // --- End safety checks ---

  // Cap ml_used at remaining to avoid negative inventory (confirmed over-limit)
  const actualMlUsed = Math.min(mlUsed, c.remainingMl);

  const loggedAt = loggedAtRaw
    ? new Date(`${loggedAtRaw}T12:00:00`).toISOString()
    : new Date().toISOString();

  const { data: newDose, error: insertError } = await supabase
    .from("dose_logs")
    .insert({
      vial_id: vialId,
      user_id: user.id,
      mcg_dose: mcgDose,
      ml_used: actualMlUsed,
      units_used: actualMlUsed * (c.device.unitsPerMl || 0),
      site,
      notes,
      unit_convention: unit,
      logged_at: loggedAt,
    })
    .select("id")
    .single();
  if (insertError) return { error: insertError.message };

  if (newDose?.id) {
    let tags: Record<string, boolean> = {};
    try { tags = tagsRaw ? (JSON.parse(tagsRaw) as Record<string, boolean>) : {}; } catch { /* ignore */ }
    const hasEffects = Object.values(tags).some(Boolean) || (ratingInput != null && ratingInput > 0);
    if (hasEffects) {
      await supabase.from("dose_effects").insert({
        dose_log_id: newDose.id,
        user_id: user.id,
        tags,
        rating: ratingInput && ratingInput > 0 ? ratingInput : null,
      });
    }
  }

  const remainingAfter = c.remainingMl - actualMlUsed;
  const depleted = remainingAfter <= 0.0001 && vial.effectiveness == null;

  revalidatePath("/");
  revalidatePath(`/vials/${vialId}`);
  return { success: true, depleted };
}

export async function deleteDose(doseLogId: string, vialId: string): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("dose_logs").delete().eq("id", doseLogId);
  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath(`/vials/${vialId}`);
  return { success: true };
}

export async function rateVial(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();
  const vialId = str(formData, "vialId");
  const rating = num(formData, "rating");
  const note = str(formData, "note") || null;

  if (!rating) return { error: "Pick a rating." };

  const { error } = await supabase
    .from("vials")
    .update({ effectiveness: rating, effectiveness_note: note })
    .eq("id", vialId);
  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath(`/vials/${vialId}`);
  return { success: true };
}
