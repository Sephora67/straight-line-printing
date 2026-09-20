create policy "garment assets readable" on storage.objects for select using (bucket_id = 'garment-assets');
create policy "garment assets admin write" on storage.objects for insert to authenticated with check (bucket_id = 'garment-assets' and private.is_admin(auth.uid()));
create policy "garment assets admin update" on storage.objects for update to authenticated using (bucket_id = 'garment-assets' and private.is_admin(auth.uid()));
create policy "garment assets admin delete" on storage.objects for delete to authenticated using (bucket_id = 'garment-assets' and private.is_admin(auth.uid()));

create policy "artwork owner read" on storage.objects for select to authenticated
  using (bucket_id = 'artwork' and (private.is_staff(auth.uid()) or (storage.foldername(name))[1] = auth.uid()::text));
create policy "artwork owner write" on storage.objects for insert to authenticated
  with check (bucket_id = 'artwork' and (private.is_staff(auth.uid()) or (storage.foldername(name))[1] = auth.uid()::text));
create policy "artwork owner update" on storage.objects for update to authenticated
  using (bucket_id = 'artwork' and (private.is_staff(auth.uid()) or (storage.foldername(name))[1] = auth.uid()::text));
create policy "artwork staff delete" on storage.objects for delete to authenticated
  using (bucket_id = 'artwork' and private.is_admin(auth.uid()));

create policy "proofs read" on storage.objects for select to authenticated
  using (bucket_id = 'proofs' and (private.is_staff(auth.uid()) or (storage.foldername(name))[1] = auth.uid()::text));
create policy "proofs staff write" on storage.objects for insert to authenticated
  with check (bucket_id = 'proofs' and private.is_staff(auth.uid()));
create policy "proofs staff update" on storage.objects for update to authenticated
  using (bucket_id = 'proofs' and private.is_staff(auth.uid()));
create policy "proofs staff delete" on storage.objects for delete to authenticated
  using (bucket_id = 'proofs' and private.is_admin(auth.uid()));