drop policy "published products public" on public.products;
create policy "published products public" on public.products for select using (status = 'published');
create policy "staff read all products" on public.products for select to authenticated using (public.is_staff(auth.uid()));

revoke all on function public.handle_new_user() from public, anon;
revoke all on function public.update_updated_at_column() from public, anon;
revoke all on function public.has_role(uuid, public.app_role) from public, anon;
revoke all on function public.is_staff(uuid) from public, anon;
revoke all on function public.is_admin(uuid) from public, anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;
grant execute on function public.is_staff(uuid) to authenticated;
grant execute on function public.is_admin(uuid) to authenticated;