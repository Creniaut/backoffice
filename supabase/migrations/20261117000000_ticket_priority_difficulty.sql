create type public.ticket_priority as enum ('high', 'medium', 'low');
create type public.ticket_difficulty as enum ('easy', 'medium', 'hard');

alter table public.tickets
  add column priority public.ticket_priority,
  add column difficulty public.ticket_difficulty;

create or replace function public.tickets_log()
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
    or new.link is distinct from old.link
    or new.priority is distinct from old.priority
    or new.difficulty is distinct from old.difficulty then
    insert into public.ticket_events (ticket_id, actor, kind)
    values (new.id, v_actor, 'edited');
  end if;

  return new;
end
$$;
