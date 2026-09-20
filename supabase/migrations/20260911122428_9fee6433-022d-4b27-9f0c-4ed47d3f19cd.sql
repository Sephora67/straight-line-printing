-- Replace the browser-callable claim with a server-only variant that takes the verified user id
CREATE OR REPLACE FUNCTION public.claim_owner_for_user(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  claimed boolean;
begin
  if _user_id is null then
    return false;
  end if;
  if exists (select 1 from public.user_roles where role = 'owner') then
    return exists (select 1 from public.user_roles where user_id = _user_id and role = 'owner');
  end if;
  insert into public.user_roles (user_id, role) values (_user_id, 'owner')
  on conflict (user_id, role) do nothing;
  select true into claimed;
  insert into public.audit_log (user_id, entity_type, entity_id, action, after_value)
  values (_user_id, 'user_roles', _user_id, 'claim_owner', jsonb_build_object('role', 'owner'));
  return coalesce(claimed, false);
end;
$function$;

REVOKE EXECUTE ON FUNCTION public.claim_owner_for_user(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_owner_for_user(uuid) TO service_role;

-- Remove the old browser-callable form entirely
DROP FUNCTION IF EXISTS public.claim_owner_if_unclaimed();