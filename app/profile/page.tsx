import { getCurrentUserOrRedirect } from "@/lib/get-current-user";
import { ProfilePage } from "@/components/profile/ProfilePage";

export default async function Profile() {
  const { user, profile } = await getCurrentUserOrRedirect();

  return (
    <ProfilePage
      email={user.email || ""}
      isAdmin={!!profile?.is_admin}
      joinedAt={profile?.created_at ?? user.created_at ?? ""}
    />
  );
}
