import { AuthShell } from "@/components/auth/AuthShell";
import { createAdminClient } from "@/lib/supabase/admin";
import { InviteRedeemForm } from "./InviteRedeemForm";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const admin = createAdminClient();

  const { data: invite } = await admin
    .from("invites")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (!invite) {
    return (
      <AuthShell title="Invite Not Found">
        <p style={{ fontSize: 14, color: "var(--pt-muted)" }}>
          This invite link doesn&apos;t exist. Ask whoever invited you to send a new one.
        </p>
      </AuthShell>
    );
  }

  if (invite.used_at) {
    return (
      <AuthShell title="Invite Already Used">
        <p style={{ fontSize: 14, color: "var(--pt-muted)" }}>
          This invite link has already been redeemed. If this was you, sign in instead.
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Create Your Account" subtitle="You've been invited to Peptide Tracker.">
      <InviteRedeemForm token={token} email={invite.email || ""} />
    </AuthShell>
  );
}
