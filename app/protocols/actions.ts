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

  const name = str(formData, "name");
  const peptide = str(formData, "peptide");
  const pattern = str(formData, "pattern") || "daily";
  const startDate = str(formData, "startDate");
  const duration = num(formData, "duration") || 28;
  const notes = str(formData, "notes") || null;
  const reminderTime = str(formData, "reminderTime") || null;
  const selectedDaysRaw = str(formData, "selectedDays");

  if (!name || !peptide || !startDate) {
    return { error: "Protocol name, peptide, and start date are required." };
  }

  let selectedDays: number[] = [];
  try {
    selectedDays = selectedDaysRaw ? (JSON.parse(selectedDaysRaw) as number[]) : [];
  } catch {
    selectedDays = [];
  }

  const { error } = await supabase.from("protocols").insert({
    user_id: user.id,
    name,
    peptide,
    pattern,
    selected_days: selectedDays,
    start_date: startDate,
    duration,
    notes,
    reminder_time: reminderTime,
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
