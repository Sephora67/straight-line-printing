
-- Theme settings (single row)
CREATE TABLE public.site_theme (
  id text PRIMARY KEY DEFAULT 'default',
  colors jsonb NOT NULL DEFAULT '{}'::jsonb,
  font_display text NOT NULL DEFAULT 'Bebas Neue',
  font_body text NOT NULL DEFAULT 'Barlow',
  radius text NOT NULL DEFAULT '0.25rem',
  logo_text text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.site_theme (id) VALUES ('default');

GRANT SELECT ON public.site_theme TO anon;
GRANT SELECT, INSERT, UPDATE ON public.site_theme TO authenticated;
GRANT ALL ON public.site_theme TO service_role;
ALTER TABLE public.site_theme ENABLE ROW LEVEL SECURITY;
CREATE POLICY "site_theme_public_read" ON public.site_theme FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "site_theme_staff_write" ON public.site_theme FOR ALL TO authenticated
  USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));

-- Page sections
CREATE TABLE public.site_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_slug text NOT NULL,
  type text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX site_sections_page_idx ON public.site_sections (page_slug, sort_order);

GRANT SELECT ON public.site_sections TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_sections TO authenticated;
GRANT ALL ON public.site_sections TO service_role;
ALTER TABLE public.site_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "site_sections_public_read" ON public.site_sections FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "site_sections_staff_write" ON public.site_sections FOR ALL TO authenticated
  USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));

CREATE TRIGGER site_sections_updated_at BEFORE UPDATE ON public.site_sections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER site_theme_updated_at BEFORE UPDATE ON public.site_theme
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
