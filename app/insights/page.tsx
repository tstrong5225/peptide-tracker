import { AppHeader } from "@/components/AppHeader";
import { ComingSoon } from "@/components/ComingSoon";
import { getCurrentUserOrRedirect } from "@/lib/get-current-user";

export default async function InsightsPage() {
  const { user, profile } = await getCurrentUserOrRedirect();

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <AppHeader email={user.email || ""} isAdmin={!!profile?.is_admin} />
      <ComingSoon
        title="Insights are coming soon"
        body="Batch/manufacturer comparison and the dose stack timeline land in a later phase."
      />
    </div>
  );
}
