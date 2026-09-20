
CREATE POLICY "permission managers write overrides" ON public.user_permissions FOR ALL TO authenticated
  USING (private.has_permission(auth.uid(),'employees.permissions'))
  WITH CHECK (private.has_permission(auth.uid(),'employees.permissions'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_permissions TO authenticated;
GRANT ALL ON public.user_permissions TO service_role;

DROP POLICY IF EXISTS "owners manage employee invitations" ON public.employee_invitations;
CREATE POLICY "permission holders manage invitations" ON public.employee_invitations FOR ALL TO authenticated
  USING (private.has_permission(auth.uid(),'employees.add'))
  WITH CHECK (private.has_permission(auth.uid(),'employees.add'));

DROP POLICY IF EXISTS "admins manage roles" ON public.user_roles;
CREATE POLICY "permission holders manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (private.has_permission(auth.uid(),'employees.edit'))
  WITH CHECK (private.has_permission(auth.uid(),'employees.edit'));
