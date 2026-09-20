
CREATE TABLE public.site_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  message text NOT NULL,
  page_slug text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.site_messages TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.site_messages TO authenticated;
GRANT ALL ON public.site_messages TO service_role;
ALTER TABLE public.site_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "site_messages_anyone_insert" ON public.site_messages FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "site_messages_staff_read" ON public.site_messages FOR SELECT TO authenticated USING (private.is_staff(auth.uid()));
CREATE POLICY "site_messages_staff_update" ON public.site_messages FOR UPDATE TO authenticated USING (private.is_staff(auth.uid())) WITH CHECK (private.is_staff(auth.uid()));
CREATE POLICY "site_messages_staff_delete" ON public.site_messages FOR DELETE TO authenticated USING (private.is_staff(auth.uid()));
