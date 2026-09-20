DROP POLICY "site_pages_public_read" ON public.site_pages;
CREATE POLICY "site_pages_public_read" ON public.site_pages FOR SELECT TO anon USING (is_published = true);

CREATE TABLE public.site_page_routes (
  original_path text PRIMARY KEY,
  current_path text NOT NULL,
  is_published boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_page_routes TO anon, authenticated;
GRANT ALL ON public.site_page_routes TO service_role;
ALTER TABLE public.site_page_routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "site_page_routes_public_read" ON public.site_page_routes FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.site_page_routes (original_path, current_path, is_published)
SELECT original_path, path, is_published FROM public.site_pages;

CREATE OR REPLACE FUNCTION public.sync_site_page_route() RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.site_page_routes WHERE original_path = OLD.original_path;
    RETURN OLD;
  END IF;
  INSERT INTO public.site_page_routes (original_path, current_path, is_published, updated_at)
  VALUES (NEW.original_path, NEW.path, NEW.is_published, now())
  ON CONFLICT (original_path) DO UPDATE SET current_path = EXCLUDED.current_path, is_published = EXCLUDED.is_published, updated_at = now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER sync_site_page_route_after_change AFTER INSERT OR UPDATE OR DELETE ON public.site_pages FOR EACH ROW EXECUTE FUNCTION public.sync_site_page_route();

DROP POLICY IF EXISTS "Staff read design versions" ON public.design_versions;
CREATE POLICY "Staff read design versions" ON public.design_versions FOR SELECT TO authenticated USING (private.is_staff(auth.uid()));
DROP POLICY IF EXISTS "Staff manage messages" ON public.request_messages;
CREATE POLICY "Staff manage messages" ON public.request_messages FOR ALL TO authenticated USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));
DROP POLICY IF EXISTS "Staff manage production files" ON public.production_files;
CREATE POLICY "Staff manage production files" ON public.production_files FOR ALL TO authenticated USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));