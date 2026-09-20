-- current_user_roles: users can already read their own roles via RLS, so drop elevated rights
CREATE OR REPLACE FUNCTION public.current_user_roles()
RETURNS SETOF app_role
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $$
  select role from public.user_roles where user_id = auth.uid();
$$;
GRANT EXECUTE ON FUNCTION public.current_user_roles() TO authenticated;

-- claim_owner_if_unclaimed: no longer callable from the browser; only the server (service role) may invoke it
REVOKE EXECUTE ON FUNCTION public.claim_owner_if_unclaimed() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.claim_owner_if_unclaimed() TO service_role;