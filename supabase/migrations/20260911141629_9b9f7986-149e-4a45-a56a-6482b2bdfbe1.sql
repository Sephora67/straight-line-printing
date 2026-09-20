ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'customer_service';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS employee_status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS last_login_at timestamptz,
  ADD CONSTRAINT profiles_employee_status_check CHECK (employee_status IN ('active', 'inactive'));

CREATE TABLE public.permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  area text NOT NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT ''
);
GRANT SELECT ON public.permissions TO authenticated;
GRANT ALL ON public.permissions TO service_role;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "active staff read permissions" ON public.permissions FOR SELECT TO authenticated USING (private.is_staff(auth.uid()));

CREATE TABLE public.role_permissions (
  role public.app_role NOT NULL,
  permission_id uuid NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role, permission_id)
);
GRANT SELECT ON public.role_permissions TO authenticated;
GRANT ALL ON public.role_permissions TO service_role;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "active staff read role permissions" ON public.role_permissions FOR SELECT TO authenticated USING (private.is_staff(auth.uid()));

CREATE TABLE public.user_permissions (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  granted boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, permission_id)
);
GRANT SELECT ON public.user_permissions TO authenticated;
GRANT ALL ON public.user_permissions TO service_role;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read own permission overrides" ON public.user_permissions FOR SELECT TO authenticated USING (user_id = auth.uid() OR private.is_admin(auth.uid()));

CREATE TABLE public.employee_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  full_name text,
  role public.app_role NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  invited_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  accepted_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT employee_invitations_status_check CHECK (status IN ('pending', 'accepted', 'revoked', 'expired'))
);
CREATE UNIQUE INDEX employee_invitations_pending_email_idx ON public.employee_invitations (lower(email)) WHERE status = 'pending';
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_invitations TO authenticated;
GRANT ALL ON public.employee_invitations TO service_role;
ALTER TABLE public.employee_invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners manage employee invitations" ON public.employee_invitations FOR ALL TO authenticated USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));

CREATE TABLE public.notification_settings (
  id text PRIMARY KEY DEFAULT 'default',
  admin_email text,
  sender_name text NOT NULL DEFAULT 'Straight Line Printing',
  reply_to_email text,
  order_confirmation_enabled boolean NOT NULL DEFAULT true,
  order_status_enabled boolean NOT NULL DEFAULT true,
  production_status_enabled boolean NOT NULL DEFAULT true,
  shipping_enabled boolean NOT NULL DEFAULT true,
  quote_enabled boolean NOT NULL DEFAULT true,
  contact_enabled boolean NOT NULL DEFAULT true,
  internal_notifications_enabled boolean NOT NULL DEFAULT true,
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notification_settings_singleton CHECK (id = 'default')
);
GRANT SELECT, INSERT, UPDATE ON public.notification_settings TO authenticated;
GRANT ALL ON public.notification_settings TO service_role;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners manage notification settings" ON public.notification_settings FOR ALL TO authenticated USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));

ALTER TABLE public.notification_templates
  ADD COLUMN IF NOT EXISTS audience text NOT NULL DEFAULT 'customer',
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS title text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS default_subject text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS default_title text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS default_body text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS available_variables text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD CONSTRAINT notification_templates_audience_check CHECK (audience IN ('customer', 'internal'));

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS production_decision text NOT NULL DEFAULT 'review',
  ADD COLUMN IF NOT EXISTS production_approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS production_approved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD CONSTRAINT orders_production_decision_check CHECK (production_decision IN ('review', 'proof_requested', 'approved_proof', 'direct', 'hold'));

ALTER TABLE public.production_jobs
  ADD COLUMN IF NOT EXISTS source_type text NOT NULL DEFAULT 'order_snapshot',
  ADD COLUMN IF NOT EXISTS source_proof_id uuid REFERENCES public.proofs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source_version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD CONSTRAINT production_jobs_source_type_check CHECK (source_type IN ('approved_proof', 'direct_approval', 'order_snapshot'));
CREATE UNIQUE INDEX IF NOT EXISTS production_jobs_order_method_source_idx ON public.production_jobs (order_id, COALESCE(decoration_method_id, '00000000-0000-0000-0000-000000000000'::uuid), source_type, source_version);

INSERT INTO public.permissions (code, area, name, description) VALUES
('orders.view','orders','View orders','View order records'),
('orders.create','orders','Create orders','Create order records'),
('orders.edit','orders','Edit orders','Edit order details'),
('orders.status','orders','Change order status','Change order workflow status'),
('orders.cancel','orders','Cancel orders','Cancel an order'),
('orders.delete','orders','Delete orders','Permanently delete an order'),
('quotes.view','quotes','View quotes','View quote records'),
('quotes.create','quotes','Create quotes','Create quote records'),
('quotes.edit','quotes','Edit quotes','Edit quote details'),
('quotes.approve','quotes','Approve quotes','Approve a quote'),
('quotes.status','quotes','Change quote status','Change quote workflow status'),
('quotes.delete','quotes','Delete quotes','Delete a quote'),
('customers.view','customers','View customers','View customer information'),
('customers.edit','customers','Edit customers','Edit customer information'),
('customers.delete','customers','Delete customers','Delete customer information'),
('products.view','products','View products','View product administration'),
('products.create','products','Create products','Create products'),
('products.edit','products','Edit products','Edit products'),
('products.delete','products','Delete products','Delete products'),
('production.view','production','View production','View production jobs'),
('production.status','production','Update production status','Change production stages'),
('production.edit','production','Edit production information','Edit job details and files'),
('shipping.view','shipping','View shipping','View shipping information'),
('shipping.edit','shipping','Update shipping information','Edit carrier and tracking details'),
('shipping.ship','shipping','Mark order shipped','Mark an order as shipped'),
('designs.view','designs','View designs','View customer designs'),
('designs.edit','designs','Edit designs','Edit design information'),
('designs.approve','designs','Approve designs','Approve proofs and designs'),
('employees.view','employees','View employees','View employee accounts'),
('employees.add','employees','Add employees','Invite employees'),
('employees.edit','employees','Edit employees','Edit employee roles and details'),
('employees.disable','employees','Disable employees','Deactivate employee access'),
('employees.permissions','employees','Change employee permissions','Manage permission overrides'),
('notifications.view','notifications','View email settings','View notification settings and templates'),
('notifications.edit','notifications','Edit email settings','Edit notification settings'),
('notifications.templates.view','notifications','View customer templates','View notification templates'),
('notifications.templates.edit','notifications','Edit customer templates','Edit notification templates'),
('notifications.history','notifications','View email history','View notification attempts'),
('settings.view','settings','View settings','View administrative settings'),
('settings.edit','settings','Edit settings','Edit administrative settings'),
('financial.prices','financial','View prices','View prices and line totals'),
('financial.totals','financial','View order totals','View order totals'),
('financial.payments','financial','View payment information','View payment status and references'),
('financial.edit','financial','Edit financial information','Edit financial fields'),
('audit.view','audit','View activity log','View employee and system activity')
ON CONFLICT (code) DO UPDATE SET area = EXCLUDED.area, name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO public.role_permissions (role, permission_id)
SELECT r.role, p.id
FROM (VALUES
  ('owner'::public.app_role),
  ('administrator'::public.app_role)
) r(role)
CROSS JOIN public.permissions p
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, permission_id)
SELECT 'production'::public.app_role, id FROM public.permissions
WHERE code IN ('orders.view','customers.view','products.view','production.view','production.status','production.edit','shipping.view','shipping.edit','shipping.ship','designs.view','designs.edit','designs.approve')
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, permission_id)
SELECT 'sales'::public.app_role, id FROM public.permissions
WHERE code IN ('orders.view','orders.create','orders.edit','orders.status','quotes.view','quotes.create','quotes.edit','quotes.approve','quotes.status','customers.view','customers.edit','products.view','designs.view','financial.prices','financial.totals','financial.payments')
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, permission_id)
SELECT 'designer'::public.app_role, id FROM public.permissions
WHERE code IN ('orders.view','products.view','production.view','designs.view','designs.edit','designs.approve')
ON CONFLICT DO NOTHING;

INSERT INTO public.notification_settings (id) VALUES ('default') ON CONFLICT (id) DO NOTHING;

INSERT INTO public.notification_templates (code,name,subject,body,is_active,audience,category,title,default_subject,default_title,default_body,available_variables) VALUES
('order_confirmation','Order Confirmation','We received order {{order_number}}','Hi {{customer_name}},\n\nWe received order {{order_number}} for {{order_total}}. Current status: {{order_status}}.\n\nView your order: {{order_url}}',true,'customer','orders','Order received','We received order {{order_number}}','Order received','Hi {{customer_name}},\n\nWe received order {{order_number}} for {{order_total}}. Current status: {{order_status}}.\n\nView your order: {{order_url}}',ARRAY['customer_name','customer_email','order_number','order_status','order_date','order_total','shipping_address','company_name','company_phone','company_email','order_url']),
('order_paid','Order Confirmed','Order {{order_number}} is confirmed','Hi {{customer_name}},\n\nPayment for order {{order_number}} is confirmed. Our team will review it next.',true,'customer','orders','Order confirmed','Order {{order_number}} is confirmed','Order confirmed','Hi {{customer_name}},\n\nPayment for order {{order_number}} is confirmed. Our team will review it next.',ARRAY['customer_name','order_number','order_status','order_total','order_url','company_name']),
('order_in_production','Production Started','Your order {{order_number}} is now in production','Good news! Order {{order_number}} has entered production. Our team is working on it and will keep you updated.',true,'customer','production','Production started','Your order {{order_number}} is now in production','Production started','Good news! Order {{order_number}} has entered production. Our team is working on it and will keep you updated.',ARRAY['customer_name','order_number','order_status','order_url','company_name']),
('production_quality_control','Quality Check','Order {{order_number}} is in quality check','Order {{order_number}} has reached quality check.',true,'customer','production','Quality check','Order {{order_number}} is in quality check','Quality check','Order {{order_number}} has reached quality check.',ARRAY['customer_name','order_number','order_status','order_url','company_name']),
('order_ready','Order Ready','Order {{order_number}} is ready','Order {{order_number}} is ready for the next step.',true,'customer','orders','Order ready','Order {{order_number}} is ready','Order ready','Order {{order_number}} is ready for the next step.',ARRAY['customer_name','order_number','order_status','order_url','company_name']),
('order_completed','Order Completed','Order {{order_number}} is complete','Order {{order_number}} is complete. Thank you for choosing {{company_name}}.',true,'customer','orders','Order complete','Order {{order_number}} is complete','Order complete','Order {{order_number}} is complete. Thank you for choosing {{company_name}}.',ARRAY['customer_name','order_number','order_status','order_url','company_name']),
('order_shipped','Order Shipped','Order {{order_number}} has shipped','Order {{order_number}} has shipped.\n\n{{shipping_address}}\n{{tracking_number}}\n{{tracking_url}}',true,'customer','shipping','Your order has shipped','Order {{order_number}} has shipped','Your order has shipped','Order {{order_number}} has shipped.\n\n{{shipping_address}}\n{{tracking_number}}\n{{tracking_url}}',ARRAY['customer_name','order_number','order_status','shipping_address','tracking_number','tracking_url','order_url','company_name']),
('order_cancelled','Order Cancelled','Order {{order_number}} was cancelled','Order {{order_number}} has been cancelled. Contact {{company_email}} if you have questions.',true,'customer','orders','Order cancelled','Order {{order_number}} was cancelled','Order cancelled','Order {{order_number}} has been cancelled. Contact {{company_email}} if you have questions.',ARRAY['customer_name','order_number','order_status','order_url','company_name','company_email']),
('quote_received','Quote Received','We received request {{quote_number}}','Hi {{customer_name}},\n\nWe received request {{quote_number}}. Our team will review it and follow up.',true,'customer','quotes','Request received','We received request {{quote_number}}','Request received','Hi {{customer_name}},\n\nWe received request {{quote_number}}. Our team will review it and follow up.',ARRAY['customer_name','customer_email','quote_number','quote_status','quote_url','company_name','company_email']),
('quote_ready','Quote Ready','Quote {{quote_number}} is ready','Your quote {{quote_number}} is ready for review.',true,'customer','quotes','Your quote is ready','Quote {{quote_number}} is ready','Your quote is ready','Your quote {{quote_number}} is ready for review.',ARRAY['customer_name','quote_number','quote_status','quote_url','company_name']),
('contact_received','Contact Confirmation','We received your message','Hi {{customer_name}},\n\nWe received your message and someone from our team will get back to you.',true,'customer','contact','Message received','We received your message','Message received','Hi {{customer_name}},\n\nWe received your message and someone from our team will get back to you.',ARRAY['customer_name','customer_email','company_name','company_email']),
('internal_new_order','New Order','New order {{order_number}}','A new order was created by {{customer_name}} ({{customer_email}}). Total: {{order_total}}.\n\nOpen: {{admin_url}}',true,'internal','orders','New order','New order {{order_number}}','New order','A new order was created by {{customer_name}} ({{customer_email}}). Total: {{order_total}}.\n\nOpen: {{admin_url}}',ARRAY['customer_name','customer_email','order_number','order_date','order_total','admin_url','company_name']),
('internal_new_quote','New Quote Request','New request {{quote_number}}','A new request was submitted by {{customer_name}} ({{customer_email}}).\n\nOpen: {{admin_url}}',true,'internal','quotes','New quote request','New request {{quote_number}}','New quote request','A new request was submitted by {{customer_name}} ({{customer_email}}).\n\nOpen: {{admin_url}}',ARRAY['customer_name','customer_email','quote_number','admin_url','company_name']),
('internal_new_contact','New Contact Message','New message from {{customer_name}}','{{customer_name}} ({{customer_email}}) sent a contact message.\n\n{{message}}',true,'internal','contact','New contact message','New message from {{customer_name}}','New contact message','{{customer_name}} ({{customer_email}}) sent a contact message.\n\n{{message}}',ARRAY['customer_name','customer_email','customer_phone','message','admin_url','company_name'])
ON CONFLICT (code) DO UPDATE SET
  default_subject = EXCLUDED.default_subject,
  default_title = EXCLUDED.default_title,
  default_body = EXCLUDED.default_body,
  available_variables = EXCLUDED.available_variables;

CREATE OR REPLACE FUNCTION private.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.profiles p ON p.id = ur.user_id
    WHERE ur.user_id = _user_id AND p.employee_status = 'active'
  )
$$;

CREATE OR REPLACE FUNCTION private.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.profiles p ON p.id = ur.user_id
    WHERE ur.user_id = _user_id AND ur.role IN ('owner','administrator') AND p.employee_status = 'active'
  )
$$;

CREATE OR REPLACE FUNCTION private.has_permission(_user_id uuid, _code text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
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
$$;

CREATE OR REPLACE FUNCTION public.current_user_permissions()
RETURNS SETOF text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.code FROM public.permissions p WHERE private.has_permission(auth.uid(), p.code)
$$;
REVOKE ALL ON FUNCTION public.current_user_permissions() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_user_permissions() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.prevent_last_owner_loss()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.role = 'owner' AND (TG_OP = 'DELETE' OR NEW.role IS DISTINCT FROM OLD.role) THEN
    IF NOT EXISTS (SELECT 1 FROM public.user_roles ur JOIN public.profiles p ON p.id=ur.user_id WHERE ur.role='owner' AND p.employee_status='active' AND ur.user_id <> OLD.user_id) THEN
      RAISE EXCEPTION 'The last active Owner cannot be removed or demoted';
    END IF;
  END IF;
  RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END;
END;
$$;
DROP TRIGGER IF EXISTS protect_last_owner_role ON public.user_roles;
CREATE TRIGGER protect_last_owner_role BEFORE DELETE OR UPDATE OF role ON public.user_roles FOR EACH ROW EXECUTE FUNCTION private.prevent_last_owner_loss();

CREATE OR REPLACE FUNCTION private.prevent_last_owner_deactivation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.employee_status = 'active' AND NEW.employee_status = 'inactive' AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=OLD.id AND role='owner') THEN
    IF NOT EXISTS (SELECT 1 FROM public.user_roles ur JOIN public.profiles p ON p.id=ur.user_id WHERE ur.role='owner' AND p.employee_status='active' AND ur.user_id <> OLD.id) THEN
      RAISE EXCEPTION 'The last active Owner cannot be deactivated';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS protect_last_owner_profile ON public.profiles;
CREATE TRIGGER protect_last_owner_profile BEFORE UPDATE OF employee_status ON public.profiles FOR EACH ROW EXECUTE FUNCTION private.prevent_last_owner_deactivation();

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER notification_settings_updated BEFORE UPDATE ON public.notification_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER user_permissions_updated BEFORE UPDATE ON public.user_permissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS audit_log_entity_action_idx ON public.audit_log(entity_type, entity_id, action, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS audit_log_notification_idempotency_idx ON public.audit_log ((after_value->>'idempotency_key')) WHERE action = 'notification_attempt' AND after_value ? 'idempotency_key';