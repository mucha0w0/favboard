-- User profiles: public handle, display name, avatar

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  display_name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format check (username ~ '^[a-z0-9_]{3,24}$'),
  constraint profiles_display_name_length check (char_length(display_name) <= 40)
);

alter table public.profiles enable row level security;

drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create or replace function public.generate_unique_username(
  desired text,
  user_uuid uuid
)
returns text
language plpgsql
as $$
declare
  base text;
  candidate text;
  suffix int := 0;
begin
  base := lower(coalesce(desired, ''));
  base := regexp_replace(base, '[^a-z0-9_]', '', 'g');

  if length(base) < 3 or base in (
    'admin', 'api', 'auth', 'c', 'dashboard', 'edit', 'favboard',
    'help', 'login', 'logout', 'me', 'null', 'profile', 'settings',
    'signup', 'support', 'undefined', 'user', 'users', 'www'
  ) then
    base := 'user_' || substr(replace(user_uuid::text, '-', ''), 1, 8);
  end if;

  if length(base) > 24 then
    base := substr(base, 1, 24);
  end if;

  candidate := base;
  while exists (select 1 from public.profiles where username = candidate) loop
    suffix := suffix + 1;
    candidate := substr(base, 1, greatest(3, 24 - length(suffix::text) - 1))
      || '_' || suffix::text;
    if suffix > 99 then
      candidate := 'user_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
      exit when not exists (select 1 from public.profiles where username = candidate);
    end if;
  end loop;

  return candidate;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb;
  desired_username text;
  desired_name text;
  desired_avatar text;
begin
  meta := coalesce(new.raw_user_meta_data, '{}'::jsonb);

  desired_username := coalesce(
    meta->>'user_name',
    meta->>'preferred_username',
    meta->>'user_handle',
    ''
  );

  desired_name := left(coalesce(
    meta->>'full_name',
    meta->>'name',
    meta->>'display_name',
    ''
  ), 40);

  desired_avatar := nullif(coalesce(
    meta->>'avatar_url',
    meta->>'picture',
    ''
  ), '');

  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    public.generate_unique_username(desired_username, new.id),
    desired_name,
    desired_avatar
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

do $$
declare
  u record;
begin
  for u in
    select id, raw_user_meta_data
    from auth.users
    where not exists (
      select 1 from public.profiles p where p.id = auth.users.id
    )
  loop
    insert into public.profiles (id, username, display_name, avatar_url)
    values (
      u.id,
      public.generate_unique_username(
        coalesce(
          u.raw_user_meta_data->>'user_name',
          u.raw_user_meta_data->>'preferred_username',
          u.raw_user_meta_data->>'user_handle',
          ''
        ),
        u.id
      ),
      left(coalesce(
        u.raw_user_meta_data->>'full_name',
        u.raw_user_meta_data->>'name',
        u.raw_user_meta_data->>'display_name',
        ''
      ), 40),
      nullif(coalesce(
        u.raw_user_meta_data->>'avatar_url',
        u.raw_user_meta_data->>'picture',
        ''
      ), '')
    )
    on conflict (id) do nothing;
  end loop;
end $$;
