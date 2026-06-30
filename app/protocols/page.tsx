import { getCurrentUserOrRedirect } from "@/lib/get-current-user";
import { getVialsForUser, getDosedDatesForPeptide } from "@/lib/get-dosed-dates";
import { getProtocolAdherence, getProtocolStatus } from "@/lib/protocol-logic";
import { ProtocolsPage } from "@/components/protocols/ProtocolsPage";
import type { ProtocolCardData } from "@/components/protocols/ProtocolsPage";

export default async function Protocols() {
  const { supabase, user, profile } = await getCurrentUserOrRedirect();

  const { data: protocols } = await supabase
    .from("protocols")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const vials = await getVialsForUser(supabase, user.id);

  const cards: ProtocolCardData[] = await Promise.all(
    (protocols ?? []).map(async (proto) => {
      const dosedDates = await getDosedDatesForPeptide(supabase, vials, proto.peptide);
      const adherence = getProtocolAdherence(proto, dosedDates);
      const status = getProtocolStatus(proto);
      return { protocol: proto, adherence, status };
    }),
  );

  return (
    <ProtocolsPage
      email={user.email || ""}
      isAdmin={!!profile?.is_admin}
      cards={cards}
    />
  );
}
