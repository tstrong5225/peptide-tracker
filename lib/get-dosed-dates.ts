import "server-only";
import { dateKey, matchesPeptide } from "@/lib/protocol-logic";
import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

// All vials for the user, fetched once and reused across protocols to avoid N+1 queries.
export async function getVialsForUser(supabase: SupabaseServerClient, userId: string) {
  const { data } = await supabase.from("vials").select("id, name").eq("user_id", userId);
  return data ?? [];
}

export async function getDosedDatesForPeptide(
  supabase: SupabaseServerClient,
  vials: { id: string; name: string }[],
  peptide: string,
): Promise<Set<string>> {
  const matchingIds = vials.filter((v) => matchesPeptide(v.name, peptide)).map((v) => v.id);
  if (matchingIds.length === 0) return new Set();

  const { data: doses } = await supabase.from("dose_logs").select("logged_at").in("vial_id", matchingIds);
  return new Set((doses ?? []).map((d) => dateKey(new Date(d.logged_at))));
}
