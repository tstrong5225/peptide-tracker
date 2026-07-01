"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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

export async function saveProtocol(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const id = str(formData, "id") || null;
  const name = str(formData, "name");
  const peptide = str(formData, "peptide");
  const pattern = str(formData, "pattern") || "daily";
  const startDate = str(formData, "startDate");
  const duration = num(formData, "duration") || 28;
  const notes = str(formData, "notes") || null;
  const reminderTime = str(formData, "reminderTime") || null;
  const selectedDaysRaw = str(formData, "selectedDays");
  const cycleOn = num(formData, "cycleOn");
  const cycleOff = num(formData, "cycleOff");

  if (!name || !peptide || !startDate) {
    return { error: "Protocol name, peptide, and start date are required." };
  }

  let selectedDays: number[] = [];
  try {
    selectedDays = selectedDaysRaw ? (JSON.parse(selectedDaysRaw) as number[]) : [];
  } catch {
    selectedDays = [];
  }

  const payload = {
    user_id: user.id,
    name,
    peptide,
    pattern,
    selected_days: selectedDays,
    cycle_on: pattern === "xony" ? (cycleOn ?? 5) : null,
    cycle_off: pattern === "xony" ? (cycleOff ?? 2) : null,
    start_date: startDate,
    duration,
    notes,
    reminder_time: reminderTime,
  };

  const { error } = id
    ? await supabase.from("protocols").update(payload).eq("id", id).eq("user_id", user.id)
    : await supabase.from("protocols").insert(payload);

  if (error) return { error: error.message };

  revalidatePath("/protocols");
  return { success: true };
}

export async function cloneProtocol(id: string): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { data: source, error: fetchErr } = await supabase
    .from("protocols")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchErr || !source) return { error: "Protocol not found." };

  const today = new Date().toISOString().slice(0, 10);
  const { error } = await supabase.from("protocols").insert({
    user_id: user.id,
    name: `${source.name} (copy)`,
    peptide: source.peptide,
    pattern: source.pattern,
    selected_days: source.selected_days,
    cycle_on: source.cycle_on,
    cycle_off: source.cycle_off,
    start_date: today,
    duration: source.duration,
    notes: source.notes,
    reminder_time: source.reminder_time,
  });

  if (error) return { error: error.message };

  revalidatePath("/protocols");
  return { success: true };
}

export async function deleteProtocol(id: string): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("protocols").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/protocols");
  return { success: true };
}
