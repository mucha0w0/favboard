-- Track whether the starter example canvas was already granted.
-- Prevents re-seeding after the user deletes all canvases.

alter table public.profiles
  add column if not exists example_canvas_granted boolean not null default false;

comment on column public.profiles.example_canvas_granted is
  'True after the starter example canvas was granted (or skipped for legacy users).';

-- Existing accounts should never receive a surprise starter list.
update public.profiles
set example_canvas_granted = true
where example_canvas_granted = false;
