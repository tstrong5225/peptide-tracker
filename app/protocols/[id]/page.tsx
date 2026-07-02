import { notFound } from "next/navigation";
import { getCurrentUserOrRedirect } from "@/lib/get-current-user";
import { getVialsForUser, getDosedDatesForPeptide } from "@/lib/get-dosed-dates";
import { getProtocolAdherence, getProtocolStatus, buildProtocolCalendar, getStreak } from "@/lib/protocol-logic";
import { ProtocolDetail } from "@/components/protocols/ProtocolDetail";

export default async function ProtocolDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user, profile } = await getCurrentUserOrRedirect();

  const { data: protocol } = await supabase.from("protocols").select("*").eq("id", id).maybeSingle();
  if (!protocol) notFound();

  const vials = await getVialsForUser(supabase, user.id);
  const dosedDates = await getDosedDatesForPeptide(supabase, vials, protocol.peptide);

  const adherence = getProtocolAdherence(protocol, dosedDates);
  const status = getProtocolStatus(protocol);
  const calendar = buildProtocolCalendar(protocol, dosedDates);
  const streak = getStreak(dosedDates);

  const vialOptions = vials.map((v) => ({ id: v.id, name: v.name }));
  const linkedVial = protocol.vial_id ? (vialOptions.find((v) => v.id === protocol.vial_id) ?? null) : null;

  return (
    <ProtocolDetail
      email={user.email || ""}
      isAdmin={!!profile?.is_admin}
      protocol={protocol}
      adherence={adherence}
      status={status}
      calendar={calendar}
      streak={streak}
      linkedVial={linkedVial}
      vialOptions={vialOptions}
    />
  );
}
