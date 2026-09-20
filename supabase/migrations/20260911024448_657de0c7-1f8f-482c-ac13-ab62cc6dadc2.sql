CREATE TABLE public.site_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL UNIQUE,
  original_path text NOT NULL UNIQUE,
  title text NOT NULL,
  nav_label text NOT NULL,
  meta_title text NOT NULL,
  meta_description text NOT NULL DEFAULT '',
  page_kind text NOT NULL DEFAULT 'content' CHECK (page_kind IN ('content', 'system')),
  is_protected boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT true,
  show_in_nav boolean NOT NULL DEFAULT true,
  nav_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT site_pages_path_format CHECK (path = '/' OR path ~ '^/[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT site_pages_original_path_format CHECK (original_path = '/' OR original_path ~ '^/[a-z0-9]+(?:-[a-z0-9]+)*$')
);

GRANT SELECT ON public.site_pages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_pages TO authenticated;
GRANT ALL ON public.site_pages TO service_role;
ALTER TABLE public.site_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "site_pages_public_read" ON public.site_pages FOR SELECT TO anon USING (is_published = true);
CREATE POLICY "site_pages_authenticated_read" ON public.site_pages FOR SELECT TO authenticated USING (is_published = true OR private.is_staff(auth.uid()));
CREATE POLICY "site_pages_staff_insert" ON public.site_pages FOR INSERT TO authenticated WITH CHECK (private.is_staff(auth.uid()) AND is_protected = false AND page_kind = 'content');
CREATE POLICY "site_pages_staff_update" ON public.site_pages FOR UPDATE TO authenticated USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));
CREATE POLICY "site_pages_staff_delete" ON public.site_pages FOR DELETE TO authenticated USING (private.is_staff(auth.uid()) AND is_protected = false);
CREATE TRIGGER site_pages_updated_at BEFORE UPDATE ON public.site_pages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.site_pages (path, original_path, title, nav_label, meta_title, meta_description, page_kind, is_protected, is_published, show_in_nav, nav_order) VALUES
('/', '/', 'Home', 'Home', 'Straight Line Printing | Custom Apparel, Screen Print & Embroidery', 'Custom apparel decorated in-house: screen printing, DTF, transfers and embroidery.', 'content', false, true, false, 0),
('/shop', '/shop', 'Shop', 'Shop', 'Shop Custom Apparel | Straight Line Printing', 'Browse blank garments ready to customize.', 'system', true, true, true, 10),
('/custom-apparel', '/custom-apparel', 'Custom Apparel', 'Custom Apparel', 'Custom Apparel | Straight Line Printing', 'Custom apparel for teams, businesses, events, and brands.', 'content', false, true, true, 20),
('/design-studio', '/design-studio', 'Design Studio', 'Design Studio', 'Design Studio | Straight Line Printing', 'Create and preview your custom garment design.', 'system', true, true, true, 30),
('/screen-printing', '/screen-printing', 'Screen Printing', 'Screen Printing', 'Screen Printing | Straight Line Printing', 'Professional screen printing for custom apparel orders.', 'content', false, true, true, 40),
('/dtf-printing', '/dtf-printing', 'DTF Printing', 'DTF', 'DTF Printing | Straight Line Printing', 'Full-colour direct-to-film apparel printing.', 'content', false, true, true, 50),
('/dtf-transfers', '/dtf-transfers', 'DTF Transfers', 'Transfers', 'DTF Transfers | Straight Line Printing', 'Order ready-to-press custom DTF transfers and sheets.', 'content', false, true, true, 60),
('/embroidery', '/embroidery', 'Embroidery', 'Embroidery', 'Custom Embroidery | Straight Line Printing', 'Custom embroidered apparel and accessories.', 'content', false, true, true, 70),
('/bulk-orders', '/bulk-orders', 'Bulk Orders', 'Bulk Orders', 'Bulk Custom Apparel Orders | Straight Line Printing', 'Plan a bulk custom apparel order.', 'system', true, true, true, 80),
('/how-it-works', '/how-it-works', 'How It Works', 'How It Works', 'How It Works | Straight Line Printing', 'See how custom apparel moves from design to production.', 'content', false, true, true, 90),
('/print-on-demand', '/print-on-demand', 'Print on Demand', 'Print on Demand', 'Print on Demand | Straight Line Printing', 'Custom apparel production when you need it.', 'content', false, true, false, 100),
('/about', '/about', 'About', 'About', 'About Straight Line Printing', 'Learn about Straight Line Printing.', 'content', false, true, false, 110),
('/faq', '/faq', 'FAQ', 'FAQ', 'Frequently Asked Questions | Straight Line Printing', 'Answers about custom apparel, artwork, ordering, and production.', 'content', false, true, false, 120),
('/contact', '/contact', 'Contact', 'Contact', 'Contact Straight Line Printing', 'Contact Straight Line Printing about your project.', 'content', false, true, false, 130),
('/quote-request', '/quote-request', 'Request a Quote', 'Get a Quote', 'Request a Custom Apparel Quote | Straight Line Printing', 'Tell us about your custom apparel project.', 'system', true, true, false, 140);

CREATE OR REPLACE FUNCTION public.create_site_page(
  _title text,
  _path text,
  _meta_description text DEFAULT ''
) RETURNS public.site_pages
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  _clean_path text;
  _page public.site_pages;
BEGIN
  IF NOT private.is_staff(auth.uid()) THEN RAISE EXCEPTION 'Staff access required'; END IF;
  _clean_path := '/' || trim(both '-' from regexp_replace(lower(trim(_path)), '[^a-z0-9]+', '-', 'g'));
  IF _clean_path = '/' OR split_part(trim(leading '/' from _clean_path), '/', 1) IN ('account','admin','api','auth','cart','checkout','design-studio','shop','quote-request','bulk-orders') THEN
    RAISE EXCEPTION 'This URL is reserved';
  END IF;
  INSERT INTO public.site_pages (path, original_path, title, nav_label, meta_title, meta_description, nav_order)
  VALUES (_clean_path, _clean_path, trim(_title), trim(_title), trim(_title) || ' | Straight Line Printing', trim(_meta_description), COALESCE((SELECT max(nav_order) + 10 FROM public.site_pages), 10))
  RETURNING * INTO _page;
  RETURN _page;
END;
$$;
GRANT EXECUTE ON FUNCTION public.create_site_page(text, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.rename_site_page(
  _page_id uuid,
  _title text,
  _path text,
  _nav_label text,
  _meta_title text,
  _meta_description text
) RETURNS public.site_pages
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  _old public.site_pages;
  _new_path text;
  _page public.site_pages;
BEGIN
  IF NOT private.is_staff(auth.uid()) THEN RAISE EXCEPTION 'Staff access required'; END IF;
  SELECT * INTO _old FROM public.site_pages WHERE id = _page_id FOR UPDATE;
  IF _old.id IS NULL THEN RAISE EXCEPTION 'Page not found'; END IF;
  _new_path := '/' || trim(both '-' from regexp_replace(lower(trim(_path)), '[^a-z0-9]+', '-', 'g'));
  IF _old.is_protected AND _new_path <> _old.path THEN RAISE EXCEPTION 'This page URL is protected'; END IF;
  IF _new_path = '/' AND _old.original_path <> '/' THEN RAISE EXCEPTION 'This URL is reserved'; END IF;
  IF split_part(trim(leading '/' from _new_path), '/', 1) IN ('account','admin','api','auth','cart','checkout','design-studio','shop','quote-request','bulk-orders') AND _new_path <> _old.path THEN
    RAISE EXCEPTION 'This URL is reserved';
  END IF;
  UPDATE public.site_sections SET page_slug = _new_path WHERE page_slug = _old.path;
  UPDATE public.site_pages SET path = _new_path, title = trim(_title), nav_label = trim(_nav_label), meta_title = trim(_meta_title), meta_description = trim(_meta_description) WHERE id = _page_id RETURNING * INTO _page;
  RETURN _page;
END;
$$;
GRANT EXECUTE ON FUNCTION public.rename_site_page(uuid, text, text, text, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.delete_site_page(_page_id uuid) RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE _page public.site_pages;
BEGIN
  IF NOT private.is_staff(auth.uid()) THEN RAISE EXCEPTION 'Staff access required'; END IF;
  SELECT * INTO _page FROM public.site_pages WHERE id = _page_id FOR UPDATE;
  IF _page.id IS NULL THEN RAISE EXCEPTION 'Page not found'; END IF;
  IF _page.is_protected THEN RAISE EXCEPTION 'This page cannot be deleted'; END IF;
  DELETE FROM public.site_sections WHERE page_slug = _page.path;
  DELETE FROM public.site_pages WHERE id = _page_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.delete_site_page(uuid) TO authenticated;