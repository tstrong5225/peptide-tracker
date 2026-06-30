"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type ResetRequestState = { error?: string; success?: boolean };

export async function requestPasswordReset(
  _prevState: ResetRequestState,
  formData: FormData,
): Promise<ResetRequestState> {
  const email = String(formData.get("email") || "").trim();
  if (!email) return { error: "Enter your email." };

  const supabase = await createClient();
  const headerList = await headers();
  const origin = headerList.get("origin");

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm?next=/reset-password/update`,
  });

  // Always report success — don't reveal whether an account exists for this email.
  if (error) {
    console.error("resetPasswordForEmail failed:", error.message);
  }
  return { success: true };
}
