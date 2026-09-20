
DROP POLICY IF EXISTS "admin manage colors" ON public.product_colors;
CREATE POLICY "product permission manage colors" ON public.product_colors FOR ALL TO authenticated
  USING (private.has_permission(auth.uid(),'products.edit')) WITH CHECK (private.has_permission(auth.uid(),'products.edit'));

DROP POLICY IF EXISTS "admin manage sizes" ON public.product_sizes;
CREATE POLICY "product permission manage sizes" ON public.product_sizes FOR ALL TO authenticated
  USING (private.has_permission(auth.uid(),'products.edit')) WITH CHECK (private.has_permission(auth.uid(),'products.edit'));

DROP POLICY IF EXISTS "admin manage product images" ON public.product_images;
CREATE POLICY "product permission manage product images" ON public.product_images FOR ALL TO authenticated
  USING (private.has_permission(auth.uid(),'products.edit')) WITH CHECK (private.has_permission(auth.uid(),'products.edit'));

DROP POLICY IF EXISTS "admin manage assets" ON public.garment_assets;
CREATE POLICY "product permission manage assets" ON public.garment_assets FOR ALL TO authenticated
  USING (private.has_permission(auth.uid(),'products.edit')) WITH CHECK (private.has_permission(auth.uid(),'products.edit'));

DROP POLICY IF EXISTS "admin manage print areas" ON public.print_areas;
CREATE POLICY "product permission manage print areas" ON public.print_areas FOR ALL TO authenticated
  USING (private.has_permission(auth.uid(),'products.edit')) WITH CHECK (private.has_permission(auth.uid(),'products.edit'));

DROP POLICY IF EXISTS "Staff manage site copy" ON public.site_copy;
CREATE POLICY "site permission manage site copy" ON public.site_copy FOR ALL TO authenticated
  USING (private.has_permission(auth.uid(),'site.edit')) WITH CHECK (private.has_permission(auth.uid(),'site.edit'));

DROP POLICY IF EXISTS "site_pages_staff_update" ON public.site_pages;
CREATE POLICY "site_pages_permission_update" ON public.site_pages FOR UPDATE TO authenticated
  USING (private.has_permission(auth.uid(),'site.pages')) WITH CHECK (private.has_permission(auth.uid(),'site.pages'));

DROP POLICY IF EXISTS "site_pages_staff_delete" ON public.site_pages;
CREATE POLICY "site_pages_permission_delete" ON public.site_pages FOR DELETE TO authenticated
  USING (private.has_permission(auth.uid(),'site.pages') AND is_protected = false);

DROP POLICY IF EXISTS "site_pages_staff_insert" ON public.site_pages;
CREATE POLICY "site_pages_permission_insert" ON public.site_pages FOR INSERT TO authenticated
  WITH CHECK (private.has_permission(auth.uid(),'site.pages'));

DROP POLICY IF EXISTS "site_pages_authenticated_read" ON public.site_pages;
CREATE POLICY "site_pages_authenticated_read" ON public.site_pages FOR SELECT TO authenticated
  USING (is_published = true OR private.has_permission(auth.uid(),'site.view'));
