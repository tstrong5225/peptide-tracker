import type { VialRow, DoseLogRow } from "@/lib/vial-math";
import type { Database } from "@/lib/supabase/types";

export type DoseEffectRow = Database["public"]["Tables"]["dose_effects"]["Row"];

export type DoseWithEffects = DoseLogRow & { effect: DoseEffectRow | null };

export type VialWithDoses = VialRow & { doses: DoseWithEffects[] };
