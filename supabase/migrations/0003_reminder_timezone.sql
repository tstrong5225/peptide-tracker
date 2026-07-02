-- Add timezone column to protocols so reminder times are interpreted correctly.
-- Defaults to 'UTC' to preserve behaviour of existing rows.
alter table public.protocols
  add column if not exists reminder_timezone text not null default 'UTC';
