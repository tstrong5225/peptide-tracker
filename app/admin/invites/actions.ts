"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type CreateInviteState = { error?: string; link?: string };

export async function createInvite(
  _prevState: CreateInviteState,
  formData: FormData,
): Promise<CreateInviteState> {
  const email = String(formData.get("email") || "").trim();
  if (!email) return { error: "Enter an email address." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  // RLS (invites_admin_all policy) is the real enforcement boundary here —
  // a non-admin's insert is rejected by Postgres regardless of this app code.
  const { data: invite, error } = await supabase
    .from("invites")
    .insert({ email, created_by: user.id })
    .select()
    .single();

  if (error) {
    return { error: "Couldn't create invite — admins only." };
  }

  const headerList = await headers();
  const origin = headerList.get("origin");
  return { link: `${origin}/invite/${invite.token}` };
}
