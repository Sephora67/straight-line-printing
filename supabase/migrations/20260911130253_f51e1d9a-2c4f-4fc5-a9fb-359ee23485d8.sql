CREATE TABLE public.site_copy (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_copy TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_copy TO authenticated;
GRANT ALL ON public.site_copy TO service_role;
ALTER TABLE public.site_copy ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Site copy is public" ON public.site_copy FOR SELECT USING (true);
CREATE POLICY "Staff manage site copy" ON public.site_copy FOR ALL TO authenticated
  USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));
CREATE TRIGGER site_copy_updated_at BEFORE UPDATE ON public.site_copy
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();