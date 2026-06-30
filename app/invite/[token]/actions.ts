"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

export type RedeemInviteState = { error?: string };

export async function redeemInvite(
  token: string,
  _prevState: RedeemInviteState,
  formData: FormData,
): Promise<RedeemInviteState> {
  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirm") || "");

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password !== confirm) {
    return { error: "Passwords don't match." };
  }

  const admin = createAdminClient();

  const { data: invite, error: inviteError } = await admin
    .from("invites")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (inviteError || !invite) {
    return { error: "This invite link is invalid." };
  }
  if (invite.used_at) {
    return { error: "This invite link has already been used." };
  }
  if (!invite.email) {
    return { error: "This invite is missing an email address. Ask for a new one." };
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: invite.email,
    password,
    email_confirm: true,
  });

  if (createError || !created.user) {
    return { error: createError?.message || "Couldn't create your account." };
  }

  await admin
    .from("invites")
    .update({ used_at: new Date().toISOString(), used_by: created.user.id })
    .eq("token", token);

  redirect("/login?inviteRedeemed=1");
}
