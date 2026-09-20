
INSERT INTO public.permissions (code, area, name, description) VALUES
  ('site.view','site','View website editor','See the website editing tools'),
  ('site.edit','site','Edit website content','Change wording, images, videos and sections'),
  ('site.pages','site','Manage pages','Add, rename, publish, archive and remove pages'),
  ('site.theme','site','Change theme','Change colours, fonts and button styling')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.role_permissions (role, permission_id)
SELECT r.role, p.id FROM public.permissions p
CROSS JOIN (VALUES ('administrator'::app_role), ('manager'::app_role)) AS r(role)
WHERE p.area = 'site'
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, permission_id)
SELECT 'designer'::app_role, p.id FROM public.permissions p
WHERE p.code IN ('site.view','site.edit','site.theme')
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, permission_id)
SELECT 'sales'::app_role, p.id FROM public.permissions p
WHERE p.code = 'site.view'
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION private.has_permission(_user_id uuid, _code text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT CASE
    WHEN NOT EXISTS (
      SELECT 1 FROM public.user_roles ur JOIN public.profiles pr ON pr.id = ur.user_id
      WHERE ur.user_id = _user_id AND pr.employee_status = 'active'
    ) THEN false
    WHEN EXISTS (
      SELECT 1 FROM public.user_roles ur JOIN public.profiles pr ON pr.id = ur.user_id
      WHERE ur.user_id = _user_id AND ur.role = 'owner' AND pr.employee_status = 'active'
    ) THEN true
    ELSE COALESCE(
      (SELECT up.granted FROM public.user_permissions up JOIN public.permissions p ON p.id = up.permission_id WHERE up.user_id = _user_id AND p.code = _code),
      EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.profiles pr ON pr.id = ur.user_id
        JOIN public.role_permissions rp ON rp.role = ur.role
        JOIN public.permissions p ON p.id = rp.permission_id
        WHERE ur.user_id = _user_id AND pr.employee_status = 'active' AND p.code = _code
      )
    )
  END
$function$;

-- Catalogue write access now follows the products.edit permission
DROP POLICY IF EXISTS "admin manage products" ON public.products;
CREATE POLICY "staff with product permission manage products" ON public.products
  FOR ALL TO authenticated
  USING (private.has_permission(auth.uid(),'products.edit'))
  WITH CHECK (private.has_permission(auth.uid(),'products.edit'));

DROP POLICY IF EXISTS "admin manage variants" ON public.product_variants;
CREATE POLICY "staff with product permission manage variants" ON public.product_variants
  FOR ALL TO authenticated
  USING (private.has_permission(auth.uid(),'products.edit'))
  WITH CHECK (private.has_permission(auth.uid(),'products.edit'));

-- Website content writes now follow site permissions
DROP POLICY IF EXISTS "site_sections_staff_write" ON public.site_sections;
CREATE POLICY "site_sections_permission_write" ON public.site_sections
  FOR ALL TO authenticated
  USING (private.has_permission(auth.uid(),'site.edit'))
  WITH CHECK (private.has_permission(auth.uid(),'site.edit'));

DROP POLICY IF EXISTS "site_theme_staff_write" ON public.site_theme;
CREATE POLICY "site_theme_permission_write" ON public.site_theme
  FOR ALL TO authenticated
  USING (private.has_permission(auth.uid(),'site.theme'))
  WITH CHECK (private.has_permission(auth.uid(),'site.theme'));
