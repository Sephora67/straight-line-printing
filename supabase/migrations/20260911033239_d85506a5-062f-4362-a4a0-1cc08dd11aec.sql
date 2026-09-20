CREATE OR REPLACE FUNCTION public.sync_site_page_route()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

REVOKE EXECUTE ON FUNCTION public.sync_site_page_route() FROM public, anon, authenticated;