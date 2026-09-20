CREATE OR REPLACE FUNCTION public.protect_system_site_pages() RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF OLD.is_protected AND NEW.is_published IS DISTINCT FROM OLD.is_published THEN
    RAISE EXCEPTION 'Protected workflow pages cannot be unpublished; hide the navigation link instead';
  END IF;
  IF OLD.is_protected AND NEW.path IS DISTINCT FROM OLD.path THEN
    RAISE EXCEPTION 'Protected workflow page URLs cannot be changed';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER protect_system_site_pages_before_update BEFORE UPDATE ON public.site_pages FOR EACH ROW EXECUTE FUNCTION public.protect_system_site_pages();