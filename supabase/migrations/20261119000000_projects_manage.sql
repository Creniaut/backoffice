alter table public.projects add column archived_at timestamptz;

grant insert (slug, name, color), update (name, color, archived_at)
  on public.projects to authenticated;

create policy projects_insert on public.projects
  for insert to authenticated with check (public.is_member());
create policy projects_update on public.projects
  for update to authenticated
  using (public.is_member()) with check (public.is_member());

create function public.tickets_project_active()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.projects
    where slug = new.project_slug and archived_at is not null
  ) then
    raise exception 'Projet archivé' using errcode = 'P0001';
  end if;
  return new;
end
$$;

create trigger tickets_project_active
before insert or update of project_slug on public.tickets
for each row execute function public.tickets_project_active();
