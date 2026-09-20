DROP POLICY "site_pages_public_read" ON public.site_pages;
CREATE POLICY "site_pages_public_read" ON public.site_pages FOR SELECT TO anon USING (true);

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
  IF _page.is_protected OR _page.original_path IN ('/','/custom-apparel','/screen-printing','/dtf-printing','/dtf-transfers','/embroidery','/how-it-works','/print-on-demand','/about','/faq','/contact') THEN
    RAISE EXCEPTION 'Built-in pages can be archived but not permanently deleted';
  END IF;
  DELETE FROM public.site_sections WHERE page_slug = _page.path;
  DELETE FROM public.site_pages WHERE id = _page_id;
END;
$$;