
DROP POLICY IF EXISTS "profiles self update" ON public.profiles;
CREATE POLICY "profiles self or employee manager update" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR private.has_permission(auth.uid(),'employees.edit'))
  WITH CHECK (true);
