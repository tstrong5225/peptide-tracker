import { AppHeader } from "@/components/AppHeader";
import { ComingSoon } from "@/components/ComingSoon";
import { getCurrentUserOrRedirect } from "@/lib/get-current-user";

export default async function ExportPage() {
  const { user, profile } = await getCurrentUserOrRedirect();

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <AppHeader email={user.email || ""} isAdmin={!!profile?.is_admin} />
      <ComingSoon
        title="Export is coming soon"
        body="CSV and PDF export of your dose history land in a later phase."
      />
    </div>
  );
}
