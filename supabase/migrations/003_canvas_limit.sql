-- Cap each user at 3 canvases (capacity / storage)

create or replace function public.enforce_canvas_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform pg_advisory_xact_lock(872014, hashtext(new.user_id::text));

  if (
    select count(*) from public.canvases where user_id = new.user_id
  ) >= 3 then
    raise exception 'リストは1人あたり3つまでです'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists canvases_enforce_limit on public.canvases;
create trigger canvases_enforce_limit
  before insert on public.canvases
  for each row execute function public.enforce_canvas_limit();
