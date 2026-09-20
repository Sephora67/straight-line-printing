
CREATE POLICY "site_media_staff_read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'site-media' AND private.is_staff(auth.uid()));
CREATE POLICY "site_media_staff_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'site-media' AND private.is_staff(auth.uid()));
CREATE POLICY "site_media_staff_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'site-media' AND private.is_staff(auth.uid()))
  WITH CHECK (bucket_id = 'site-media' AND private.is_staff(auth.uid()));
CREATE POLICY "site_media_staff_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'site-media' AND private.is_staff(auth.uid()));
