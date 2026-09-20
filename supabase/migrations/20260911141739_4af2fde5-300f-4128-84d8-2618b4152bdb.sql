INSERT INTO public.role_permissions (role, permission_id)
SELECT 'manager'::public.app_role, id FROM public.permissions
WHERE code NOT IN ('employees.add','employees.edit','employees.disable','employees.permissions','settings.edit')
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, permission_id)
SELECT 'customer_service'::public.app_role, id FROM public.permissions
WHERE code IN ('orders.view','orders.edit','quotes.view','quotes.edit','quotes.status','customers.view','customers.edit','shipping.view','designs.view','notifications.history')
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.current_user_roles()
RETURNS SETOF public.app_role
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT ur.role
  FROM public.user_roles ur
  JOIN public.profiles p ON p.id = ur.user_id
  WHERE ur.user_id = auth.uid() AND p.employee_status = 'active';
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invite public.employee_invitations;
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'))
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;

  SELECT * INTO invite
  FROM public.employee_invitations
  WHERE lower(email) = lower(new.email)
    AND status = 'pending'
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1
  FOR UPDATE;

  IF invite.id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new.id, invite.role)
    ON CONFLICT (user_id, role) DO NOTHING;

    UPDATE public.profiles
    SET full_name = COALESCE(invite.full_name, full_name), employee_status = 'active'
    WHERE id = new.id;

    UPDATE public.employee_invitations
    SET status = 'accepted', accepted_user_id = new.id, accepted_at = now()
    WHERE id = invite.id;

    INSERT INTO public.audit_log (user_id, entity_type, entity_id, action, after_value)
    VALUES (invite.invited_by, 'employees', new.id, 'employee_invitation_accepted', jsonb_build_object('role', invite.role, 'invitation_id', invite.id));
  END IF;

  RETURN new;
END;
$$;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;