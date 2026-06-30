import { notFound } from "next/navigation";
import { getCurrentUserOrRedirect } from "@/lib/get-current-user";
import { VialDetail } from "@/components/vials/VialDetail";
import type { VialWithDoses } from "@/components/vials/types";

export default async function VialDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user, profile } = await getCurrentUserOrRedirect();

  const { data: vial } = await supabase.from("vials").select("*").eq("id", id).maybeSingle();
  if (!vial) notFound();

  const { data: doses } = await supabase
    .from("dose_logs")
    .select("*")
    .eq("vial_id", id)
    .order("logged_at", { ascending: true });

  const { data: customDevices } = await supabase.from("devices").select("*").eq("user_id", user.id);

  const vialWithDoses: VialWithDoses = { ...vial, doses: doses ?? [] };

  return (
    <VialDetail
      email={user.email || ""}
      isAdmin={!!profile?.is_admin}
      vial={vialWithDoses}
      customDevices={customDevices ?? []}
      lowVialThresholdPct={profile?.low_vial_threshold_pct ?? 20}
    />
  );
}
