create type public.ticket_status as enum ('idea', 'todo', 'doing', 'done');

create table public.members (
  email text primary key check (email = lower(email)),
  name text not null,
  initials text not null check (char_length(initials) between 1 and 3)
);

create table public.projects (
  slug text primary key check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  color text not null
);

create function public.current_actor()
returns text
language sql
stable
set search_path = ''
as $$
  select coalesce(nullif(auth.jwt() ->> 'email', ''), 'claude')
$$;

create function public.is_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.members where email = auth.jwt() ->> 'email'
  )
$$;

create table public.tickets (
  id bigint generated always as identity primary key,
  project_slug text not null references public.projects (slug) on update cascade,
  title text not null check (char_length(btrim(title)) > 0),
  description text not null default '',
  status public.ticket_status not null default 'todo',
  assignee_email text references public.members (email)
    on update cascade on delete set null,
  link text,
  position double precision not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_actor text not null default 'claude'
);

create index tickets_status_position_idx on public.tickets (status, position);
create index tickets_project_slug_idx on public.tickets (project_slug);

create table public.ticket_events (
  id bigint generated always as identity primary key,
  ticket_id bigint not null references public.tickets (id) on delete cascade,
  actor text not null,
  kind text not null check (kind in ('created', 'moved', 'assigned', 'edited')),
  detail text,
  at timestamptz not null default now()
);

create index ticket_events_ticket_at_idx on public.ticket_events (ticket_id, at desc);

create table public.ticket_images (
  id bigint generated always as identity primary key,
  ticket_id bigint not null references public.tickets (id) on delete cascade,
  path text not null unique,
  created_at timestamptz not null default now(),
  created_by text not null default public.current_actor()
);

create index ticket_images_ticket_idx on public.ticket_images (ticket_id);

create function public.tickets_stamp()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.last_actor := public.current_actor();
  return new;
end
$$;

create trigger tickets_stamp
before insert or update on public.tickets
for each row execute function public.tickets_stamp();

create function public.tickets_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor text := public.current_actor();
begin
  if tg_op = 'INSERT' then
    insert into public.ticket_events (ticket_id, actor, kind)
    values (new.id, v_actor, 'created');
    return new;
  end if;

  if new.status is distinct from old.status then
    insert into public.ticket_events (ticket_id, actor, kind, detail)
    values (new.id, v_actor, 'moved', new.status::text);
  end if;

  if new.assignee_email is distinct from old.assignee_email then
    insert into public.ticket_events (ticket_id, actor, kind, detail)
    values (new.id, v_actor, 'assigned', new.assignee_email);
  end if;

  if new.title is distinct from old.title
    or new.description is distinct from old.description
    or new.link is distinct from old.link then
    insert into public.ticket_events (ticket_id, actor, kind)
    values (new.id, v_actor, 'edited');
  end if;

  return new;
end
$$;

create trigger tickets_log
after insert or update on public.tickets
for each row execute function public.tickets_log();

alter table public.members enable row level security;
alter table public.projects enable row level security;
alter table public.tickets enable row level security;
alter table public.ticket_events enable row level security;
alter table public.ticket_images enable row level security;

revoke all on public.members, public.projects, public.tickets, public.ticket_events,
  public.ticket_images from anon;
revoke insert, update, delete on public.members, public.projects, public.ticket_events
  from authenticated;
grant select on public.members, public.projects, public.ticket_events to authenticated;
grant select, insert, update, delete on public.tickets, public.ticket_images to authenticated;

create policy members_select on public.members
  for select to authenticated using (public.is_member());

create policy projects_select on public.projects
  for select to authenticated using (public.is_member());

create policy tickets_select on public.tickets
  for select to authenticated using (public.is_member());
create policy tickets_insert on public.tickets
  for insert to authenticated with check (public.is_member());
create policy tickets_update on public.tickets
  for update to authenticated
  using (public.is_member()) with check (public.is_member());
create policy tickets_delete on public.tickets
  for delete to authenticated using (public.is_member());

create policy ticket_events_select on public.ticket_events
  for select to authenticated using (public.is_member());

create policy ticket_images_select on public.ticket_images
  for select to authenticated using (public.is_member());
create policy ticket_images_insert on public.ticket_images
  for insert to authenticated with check (public.is_member());
create policy ticket_images_delete on public.ticket_images
  for delete to authenticated using (public.is_member());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'ticket-images',
  'ticket-images',
  false,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

create policy ticket_images_objects_select on storage.objects
  for select to authenticated
  using (bucket_id = 'ticket-images' and public.is_member());
create policy ticket_images_objects_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'ticket-images' and public.is_member());
create policy ticket_images_objects_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'ticket-images' and public.is_member());

insert into public.projects (slug, name, color) values
  ('notia', 'Notia', 'oklch(0.55 0.12 202)'),
  ('back-office', 'Back-office', 'oklch(0.62 0.13 75)');
