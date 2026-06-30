import { getCurrentUserOrRedirect } from "@/lib/get-current-user";
import { ExportPage } from "@/components/export/ExportPage";

export default async function Export() {
  const { supabase, user, profile } = await getCurrentUserOrRedirect();

  const { data: vials } = await supabase.from("vials").select("name").eq("user_id", user.id).order("created_at", { ascending: false });

  const uniqueNames = [...new Set((vials ?? []).map((v) => v.name))];

  return (
    <ExportPage
      email={user.email || ""}
      isAdmin={!!profile?.is_admin}
      vialNames={uniqueNames}
    />
  );
}
