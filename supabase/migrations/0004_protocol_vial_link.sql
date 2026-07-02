-- Link protocols to a specific vial for direct dose logging
alter table public.protocols
  add column if not exists vial_id uuid references public.vials(id) on delete set null;
