-- Add cycle-pattern columns to protocols
alter table public.protocols
  add column if not exists cycle_on  integer,
  add column if not exists cycle_off integer;

-- Push-notification subscriptions (one per browser/device)
create table if not exists public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  created_at  timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

create policy "push_subs_owner_all" on public.push_subscriptions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
