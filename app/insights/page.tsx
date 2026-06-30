import { getCurrentUserOrRedirect } from "@/lib/get-current-user";
import { buildBatchGroups, buildTimeline } from "@/lib/insights-logic";
import { InsightsPage } from "@/components/insights/InsightsPage";

export default async function Insights() {
  const { supabase, user, profile } = await getCurrentUserOrRedirect();

  const { data: vials } = await supabase
    .from("vials")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const vialIds = (vials ?? []).map((v) => v.id);

  const { data: doses } =
    vialIds.length > 0
      ? await supabase.from("dose_logs").select("vial_id, logged_at").in("vial_id", vialIds)
      : { data: [] as { vial_id: string; logged_at: string }[] };

  const dosesByVial = new Map<string, { logged_at: string }[]>();
  for (const d of doses ?? []) {
    const arr = dosesByVial.get(d.vial_id) ?? [];
    arr.push({ logged_at: d.logged_at });
    dosesByVial.set(d.vial_id, arr);
  }

  const batchGroups = buildBatchGroups(vials ?? []);
  const timeline = buildTimeline(
    (vials ?? []).map((v) => ({ ...v, doses: dosesByVial.get(v.id) ?? [] })),
  );

  return (
    <InsightsPage
      email={user.email || ""}
      isAdmin={!!profile?.is_admin}
      batchGroups={batchGroups}
      timeline={timeline}
    />
  );
}
