import type { VialRow, DoseLogRow } from "@/lib/vial-math";

export type VialWithDoses = VialRow & { doses: DoseLogRow[] };
