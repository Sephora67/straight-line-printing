
create or replace function public.current_user_roles()
returns setof app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.user_roles where user_id = auth.uid();
$$;

revoke all on function public.current_user_roles() from public, anon;
grant execute on function public.current_user_roles() to authenticated;

create or replace function public.claim_owner_if_unclaimed()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  claimed boolean;
begin
  if uid is null then
    return false;
  end if;
  if exists (select 1 from public.user_roles where role = 'owner') then
    return exists (select 1 from public.user_roles where user_id = uid and role = 'owner');
  end if;
  insert into public.user_roles (user_id, role) values (uid, 'owner')
  on conflict (user_id, role) do nothing;
  select true into claimed;
  insert into public.audit_log (user_id, entity_type, entity_id, action, after_value)
  values (uid, 'user_roles', uid, 'claim_owner', jsonb_build_object('role', 'owner'));
  return coalesce(claimed, false);
end;
$$;

revoke all on function public.claim_owner_if_unclaimed() from public, anon;
grant execute on function public.claim_owner_if_unclaimed() to authenticated;
