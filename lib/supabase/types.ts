// Hand-written types mirroring supabase/migrations/0001_init.sql.
// Regenerate with `supabase gen types typescript` once the Supabase CLI is linked,
// and this file can be replaced wholesale.

type Profile = {
  id: string;
  email: string;
  is_admin: boolean;
  low_vial_threshold_pct: number;
  created_at: string;
};

type Invite = {
  token: string;
  email: string | null;
  created_by: string;
  used_at: string | null;
  used_by: string | null;
  created_at: string;
};

type Device = {
  id: string;
  user_id: string;
  label: string;
  units_per_ml: number;
  unit_label: string;
  hint: string | null;
  created_at: string;
};

type Vial = {
  id: string;
  user_id: string;
  name: string;
  mg_in_vial: number;
  ml_liquid: number;
  device_id: string;
  custom_device_name: string | null;
  custom_unit_label: string | null;
  custom_units_per_ml: number | null;
  planned_dose_mcg: number;
  vendor: string | null;
  product_name: string | null;
  batch_number: string | null;
  coa_number: string | null;
  vial_cost: number | null;
  reconstituted_on: string | null;
  stability_days: number;
  effectiveness: number | null;
  effectiveness_note: string | null;
  created_at: string;
};

type DoseLog = {
  id: string;
  vial_id: string;
  user_id: string;
  mcg_dose: number;
  ml_used: number;
  units_used: number;
  site: string;
  notes: string | null;
  unit_convention: string;
  logged_at: string;
};

type DoseEffect = {
  id: string;
  dose_log_id: string;
  user_id: string;
  tags: Record<string, boolean>;
  rating: number | null;
  notes: string | null;
  created_at: string;
};

type Protocol = {
  id: string;
  user_id: string;
  name: string;
  peptide: string;
  pattern: string;
  selected_days: number[];
  start_date: string;
  duration: number;
  notes: string | null;
  reminder_time: string | null;
  created_at: string;
};

type BodyMetric = {
  id: string;
  user_id: string;
  recorded_on: string;
  weight: number | null;
  notes: string | null;
  created_at: string;
};

type ReferenceLink = {
  id: string;
  peptide: string;
  title: string;
  source: string | null;
  year: number | null;
  pmid: string | null;
  url: string;
  fetched_at: string;
};

type TableDef<Row, RequiredInsert extends keyof Row> = {
  Row: Row;
  Insert: Partial<Row> & Pick<Row, RequiredInsert>;
  Update: Partial<Row>;
  Relationships: never[];
};

export type Database = {
  public: {
    Tables: {
      profiles: TableDef<Profile, "id" | "email">;
      invites: TableDef<Invite, "created_by">;
      devices: TableDef<Device, "id" | "user_id" | "label" | "units_per_ml">;
      vials: TableDef<Vial, "user_id" | "name" | "mg_in_vial" | "ml_liquid" | "planned_dose_mcg">;
      dose_logs: TableDef<
        DoseLog,
        "vial_id" | "user_id" | "mcg_dose" | "ml_used" | "units_used" | "site"
      >;
      dose_effects: TableDef<DoseEffect, "dose_log_id" | "user_id">;
      protocols: TableDef<Protocol, "user_id" | "name" | "peptide" | "pattern" | "start_date">;
      body_metrics: TableDef<BodyMetric, "user_id">;
      reference_links: TableDef<ReferenceLink, "peptide" | "title" | "url">;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
