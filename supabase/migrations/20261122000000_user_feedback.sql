insert into public.projects (slug, name, color)
values ('retours-utilisateurs', 'Retours utilisateurs', 'oklch(0.6 0.13 25)')
on conflict (slug) do nothing;

create function public.submit_user_feedback(p_secret text, p_title text, p_description text)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_expected text;
  v_id bigint;
begin
  select decrypted_secret into v_expected
  from vault.decrypted_secrets where name = 'notia_feedback_secret';
  if v_expected is null or p_secret is null or p_secret <> v_expected then
    raise exception 'invalid secret' using errcode = 'PT403';
  end if;
  if coalesce(btrim(p_title), '') = '' then
    raise exception 'empty title' using errcode = 'PT400';
  end if;
  if (select count(*) from public.tickets
      where project_slug = 'retours-utilisateurs' and created_at > now() - interval '1 hour') >= 50 then
    raise exception 'rate limited' using errcode = 'PT429';
  end if;
  delete from public.tickets
  where project_slug = 'retours-utilisateurs' and created_at < now() - interval '1 year';
  insert into public.tickets (project_slug, title, description, status, position)
  values ('retours-utilisateurs', left(btrim(p_title), 120), left(coalesce(p_description, ''), 4000), 'idea',
    (select coalesce(min(position), 0) - 1 from public.tickets where status = 'idea'))
  returning id into v_id;
  return v_id;
end
$$;

revoke all on function public.submit_user_feedback(text, text, text) from public;
grant execute on function public.submit_user_feedback(text, text, text) to anon;
