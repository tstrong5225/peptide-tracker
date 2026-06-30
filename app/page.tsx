import { getCurrentUserOrRedirect } from "@/lib/get-current-user";
import { VialsDashboard } from "@/components/vials/VialsDashboard";
import type { DoseWithEffects, VialWithDoses } from "@/components/vials/types";
import type { DoseLogRow } from "@/lib/vial-math";
import { dateKey, isReminderDue, matchesPeptide } from "@/lib/protocol-logic";

export default async function HomePage() {
  const { supabase, user, profile } = await getCurrentUserOrRedirect();

  const { data: vials } = await supabase
    .from("vials")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const vialIds = (vials ?? []).map((v) => v.id);

  const { data: doses } =
    vialIds.length > 0
      ? await supabase.from("dose_logs").select("*").in("vial_id", vialIds).order("logged_at", { ascending: true })
      : { data: [] as DoseLogRow[] };

  const { data: customDevices } = await supabase.from("devices").select("*").eq("user_id", user.id);
  const { data: protocols } = await supabase.from("protocols").select("*").eq("user_id", user.id);

  const dosesByVial = new Map<string, DoseWithEffects[]>();
  for (const d of doses ?? []) {
    const arr = dosesByVial.get(d.vial_id) ?? [];
    arr.push({ ...(d as DoseLogRow), effect: null }); // effects not needed on dashboard cards
    dosesByVial.set(d.vial_id, arr);
  }

  const vialsWithDoses: VialWithDoses[] = (vials ?? []).map((v) => ({
    ...v,
    doses: dosesByVial.get(v.id) ?? [],
  }));

  const todayKey = dateKey(new Date());
  const dueReminders = (protocols ?? [])
    .filter((proto) => {
      const matchingVialIds = new Set((vials ?? []).filter((v) => matchesPeptide(v.name, proto.peptide)).map((v) => v.id));
      const dosedToday = (doses ?? []).some(
        (d) => matchingVialIds.has(d.vial_id) && dateKey(new Date(d.logged_at)) === todayKey,
      );
      return isReminderDue(proto, dosedToday);
    })
    .map((p) => ({
      id: p.id,
      name: p.name,
      peptide: p.peptide,
      pattern: p.pattern,
      vialId: (vials ?? []).find((v) => matchesPeptide(v.name, p.peptide))?.id ?? null,
    }));

  return (
    <VialsDashboard
      email={user.email || ""}
      isAdmin={!!profile?.is_admin}
      vials={vialsWithDoses}
      customDevices={customDevices ?? []}
      lowVialThresholdPct={profile?.low_vial_threshold_pct ?? 20}
      dueReminders={dueReminders}
    />
  );
}
