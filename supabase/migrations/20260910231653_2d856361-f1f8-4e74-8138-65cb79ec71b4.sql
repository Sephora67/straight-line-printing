-- 1. Design versions -------------------------------------------------
CREATE TABLE public.design_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  design_id uuid NOT NULL REFERENCES public.designs(id) ON DELETE CASCADE,
  version integer NOT NULL,
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  mockups jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (design_id, version)
);
GRANT SELECT, INSERT ON public.design_versions TO authenticated;
GRANT ALL ON public.design_versions TO service_role;
ALTER TABLE public.design_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read own design versions" ON public.design_versions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.designs d WHERE d.id = design_id AND d.user_id = auth.uid()));
CREATE POLICY "Owners insert own design versions" ON public.design_versions FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.designs d WHERE d.id = design_id AND d.user_id = auth.uid()));
CREATE POLICY "Staff read design versions" ON public.design_versions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid()));

-- 2. Request metadata on quotes and orders ----------------------------
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS request_type text NOT NULL DEFAULT 'quote',
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS due_date date,
  ADD COLUMN IF NOT EXISTS decoration_method_id uuid REFERENCES public.decoration_methods(id),
  ADD COLUMN IF NOT EXISTS staff_notes text;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS request_type text NOT NULL DEFAULT 'order',
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS due_date date,
  ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS staff_notes text;

-- 3. Messages / internal notes ----------------------------------------
CREATE TABLE public.request_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  quote_id uuid REFERENCES public.quotes(id) ON DELETE CASCADE,
  production_job_id uuid REFERENCES public.production_jobs(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id),
  body text NOT NULL,
  is_internal boolean NOT NULL DEFAULT true,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.request_messages TO authenticated;
GRANT ALL ON public.request_messages TO service_role;
ALTER TABLE public.request_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage messages" ON public.request_messages FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid()));
CREATE POLICY "Customers read their visible messages" ON public.request_messages FOR SELECT TO authenticated
  USING (
    is_internal = false AND (
      EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.quotes q WHERE q.id = quote_id AND q.user_id = auth.uid())
    )
  );

-- 4. Production files --------------------------------------------------
CREATE TABLE public.production_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  production_job_id uuid NOT NULL REFERENCES public.production_jobs(id) ON DELETE CASCADE,
  kind text NOT NULL,
  label text,
  storage_path text,
  external_url text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_approved boolean NOT NULL DEFAULT false,
  version integer NOT NULL DEFAULT 1,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.production_files TO authenticated;
GRANT ALL ON public.production_files TO service_role;
ALTER TABLE public.production_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage production files" ON public.production_files FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid()));

-- 5. Production job snapshot + workflow fields -------------------------
ALTER TABLE public.production_jobs
  ADD COLUMN IF NOT EXISTS snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS design_version_id uuid REFERENCES public.design_versions(id),
  ADD COLUMN IF NOT EXISTS proof_id uuid REFERENCES public.proofs(id),
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS locked_at timestamptz,
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

CREATE INDEX IF NOT EXISTS production_jobs_order_idx ON public.production_jobs(order_id);
CREATE INDEX IF NOT EXISTS request_messages_order_idx ON public.request_messages(order_id);
CREATE INDEX IF NOT EXISTS request_messages_quote_idx ON public.request_messages(quote_id);
CREATE INDEX IF NOT EXISTS design_versions_design_idx ON public.design_versions(design_id);