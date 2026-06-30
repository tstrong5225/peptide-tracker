-- Peptide Tracker initial schema + RLS
-- Run via Supabase SQL editor or `supabase db push` once the project is linked.

-- ───────────────────────── profiles ─────────────────────────
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  is_admin boolean not null default false,
  low_vial_threshold_pct numeric not null default 20,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid());
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid());

-- Auto-create a profile row when a new auth user is created.
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ───────────────────────── invites ─────────────────────────
create table public.invites (
  token uuid primary key default gen_random_uuid(),
  email text,
  created_by uuid not null references auth.users(id),
  used_at timestamptz,
  used_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.invites enable row level security;

-- Only admins can create/list invites. Redemption happens via a service-role
-- API route (server-side), not direct client access, so no public select/insert policy exists.
create policy "invites_admin_all" on public.invites
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

-- ───────────────────────── devices ─────────────────────────
create table public.devices (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  units_per_ml numeric not null,
  unit_label text not null default 'units',
  hint text,
  created_at timestamptz not null default now()
);

alter table public.devices enable row level security;
create policy "devices_owner_all" on public.devices
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ───────────────────────── vials ─────────────────────────
create table public.vials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  mg_in_vial numeric not null,
  ml_liquid numeric not null,
  device_id text not null default 'u100',
  custom_device_name text,
  custom_unit_label text,
  custom_units_per_ml numeric,
  planned_dose_mcg numeric not null,
  vendor text,
  product_name text,
  batch_number text,
  coa_number text,
  vial_cost numeric,
  reconstituted_on date,
  stability_days integer not null default 28,
  effectiveness integer check (effectiveness between 1 and 10),
  effectiveness_note text,
  created_at timestamptz not null default now()
);

alter table public.vials enable row level security;
create policy "vials_owner_all" on public.vials
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create index vials_user_id_idx on public.vials(user_id);

-- ───────────────────────── dose_logs ─────────────────────────
create table public.dose_logs (
  id uuid primary key default gen_random_uuid(),
  vial_id uuid not null references public.vials(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  mcg_dose numeric not null,
  ml_used numeric not null,
  units_used numeric not null,
  site text not null,
  notes text,
  unit_convention text not null default 'mcg', -- 'mg' | 'mcg', drives the unit-mismatch check
  logged_at timestamptz not null default now()
);

alter table public.dose_logs enable row level security;
create policy "dose_logs_owner_all" on public.dose_logs
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create index dose_logs_user_id_idx on public.dose_logs(user_id);
create index dose_logs_vial_id_idx on public.dose_logs(vial_id);

-- ───────────────────────── dose_effects ─────────────────────────
create table public.dose_effects (
  id uuid primary key default gen_random_uuid(),
  dose_log_id uuid not null references public.dose_logs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  tags jsonb not null default '{}'::jsonb,
  rating integer check (rating between 1 and 5),
  notes text,
  created_at timestamptz not null default now()
);

alter table public.dose_effects enable row level security;
create policy "dose_effects_owner_all" on public.dose_effects
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ───────────────────────── protocols ─────────────────────────
create table public.protocols (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  peptide text not null,
  pattern text not null, -- 'daily' | 'xony' | 'fixed' | 'weekly'
  selected_days jsonb not null default '[]'::jsonb,
  start_date date not null,
  duration integer not null default 28,
  notes text,
  reminder_time time,
  created_at timestamptz not null default now()
);

alter table public.protocols enable row level security;
create policy "protocols_owner_all" on public.protocols
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ───────────────────────── body_metrics ─────────────────────────
create table public.body_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recorded_on date not null default current_date,
  weight numeric,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.body_metrics enable row level security;
create policy "body_metrics_owner_all" on public.body_metrics
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ───────────────────────── reference_links (PubMed cache) ─────────────────────────
-- Shared cache, not user-owned. Readable by any authenticated user; writes
-- only via the service-role key from the /api/research route.
create table public.reference_links (
  id uuid primary key default gen_random_uuid(),
  peptide text not null,
  title text not null,
  source text,
  year integer,
  pmid text,
  url text not null,
  fetched_at timestamptz not null default now()
);

create index reference_links_peptide_idx on public.reference_links (lower(peptide));

alter table public.reference_links enable row level security;
create policy "reference_links_select_authenticated" on public.reference_links
  for select using (auth.role() = 'authenticated');
-- No insert/update/delete policy for regular users: only the service-role
-- key (which bypasses RLS) writes to this table from the API route.
