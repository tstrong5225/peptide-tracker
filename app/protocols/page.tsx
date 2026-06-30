import { AppHeader } from "@/components/AppHeader";
import { ComingSoon } from "@/components/ComingSoon";
import { getCurrentUserOrRedirect } from "@/lib/get-current-user";

export default async function ProtocolsPage() {
  const { user, profile } = await getCurrentUserOrRedirect();

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <AppHeader email={user.email || ""} isAdmin={!!profile?.is_admin} />
      <ComingSoon
        title="Protocols are coming soon"
        body="Saved dosing protocols, adherence tracking, and reminders land in a later phase."
      />
    </div>
  );
}
