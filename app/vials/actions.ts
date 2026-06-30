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

export type LogDoseState = ActionState & { depleted?: boolean };

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
  const notes = str(formData, "notes") || null;
  const mcgDoseInput = num(formData, "mcgDose");

  const [{ data: vial, error: vialError }, { data: doses, error: dosesError }, { data: customDevices }] =
    await Promise.all([
      supabase.from("vials").select("*").eq("id", vialId).single(),
      supabase.from("dose_logs").select("ml_used").eq("vial_id", vialId),
      supabase.from("devices").select("*").eq("user_id", user.id),
    ]);

  if (vialError || !vial) return { error: "Vial not found." };
  if (dosesError) return { error: dosesError.message };

  const c = compute(vial, doses ?? [], customDevices ?? []);
  const mcgDose = mcgDoseInput ?? vial.planned_dose_mcg;
  if (!mcgDose || mcgDose <= 0) return { error: "Enter a dose amount." };

  const mlUsed = c.mcgPerMl > 0 ? mcgDose / c.mcgPerMl : 0;
  if (mlUsed > c.remainingMl + 0.0001) {
    return { error: "Not enough left in this vial for that dose." };
  }

  const { error: insertError } = await supabase.from("dose_logs").insert({
    vial_id: vialId,
    user_id: user.id,
    mcg_dose: mcgDose,
    ml_used: mlUsed,
    units_used: mlUsed * (c.device.unitsPerMl || 0),
    site,
    notes,
    unit_convention: "mcg",
  });
  if (insertError) return { error: insertError.message };

  const remainingAfter = c.remainingMl - mlUsed;
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
