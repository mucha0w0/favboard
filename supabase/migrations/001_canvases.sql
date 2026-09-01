-- Visual Wishlist Canvas schema

create table if not exists public.canvases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled Canvas',
  slug text not null unique,
  blocks jsonb not null default '[]'::jsonb,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists canvases_user_id_idx on public.canvases(user_id);
create index if not exists canvases_slug_idx on public.canvases(slug);

alter table public.canvases enable row level security;

create policy "Users can view own canvases"
  on public.canvases for select
  using (auth.uid() = user_id);

create policy "Anyone can view published canvases"
  on public.canvases for select
  using (is_published = true);

create policy "Users can insert own canvases"
  on public.canvases for insert
  with check (auth.uid() = user_id);

create policy "Users can update own canvases"
  on public.canvases for update
  using (auth.uid() = user_id);

create policy "Users can delete own canvases"
  on public.canvases for delete
  using (auth.uid() = user_id);

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger canvases_updated_at
  before update on public.canvases
  for each row execute function public.handle_updated_at();
