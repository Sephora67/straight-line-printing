-- ========== enums ==========
create type public.app_role as enum ('owner','administrator','production','sales','designer');
create type public.garment_view as enum ('front','back','left_sleeve','right_sleeve');
create type public.product_status as enum ('draft','published','archived');
create type public.calibration_reference_type as enum ('collar','neckline','sleeve_top','sleeve_seam','cuff','custom');
create type public.quote_status as enum ('new','reviewing','waiting_customer','artwork_required','pricing','quote_sent','customer_reviewing','approved','declined','expired','converted','cancelled');
create type public.order_status as enum ('pending','paid','in_production','ready','shipped','completed','cancelled','refunded');
create type public.production_stage as enum ('new','artwork_review','awaiting_proof','proof_approved','pre_production','in_production','quality_control','ready','shipped','completed');
create type public.proof_status as enum ('draft','sent','approved','revision_requested');
create type public.qc_result as enum ('pass','fail');

-- ========== helpers ==========
create or replace function public.update_updated_at_column() returns trigger as $$
begin new.updated_at = now(); return new; end; $$ language plpgsql set search_path = public;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_staff(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id)
$$;

create or replace function public.is_admin(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role in ('owner','administrator'))
$$;

create policy "roles readable by self and staff" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.is_staff(auth.uid()));
create policy "admins manage roles" on public.user_roles for all to authenticated
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- ========== profiles ==========
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  company text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles self read" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_staff(auth.uid()));
create policy "profiles self insert" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "profiles self update" on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin(auth.uid())) with check (true);
create trigger profiles_updated before update on public.profiles for each row execute function public.update_updated_at_column();

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- ========== suppliers & categories ==========
create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_email text, contact_phone text, website text,
  lead_time_days integer, notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.product_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null, slug text not null unique, description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ========== products ==========
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  brand text, manufacturer text, sku text,
  category_id uuid references public.product_categories(id) on delete set null,
  garment_type text,
  description text, fabric text, weight text, fit text, gender text,
  supplier_id uuid references public.suppliers(id) on delete set null,
  supplier_sku text, wholesale_cost numeric(12,2), base_price numeric(12,2) not null default 0,
  pod_enabled boolean not null default true,
  bulk_enabled boolean not null default true,
  status public.product_status not null default 'draft',
  config_version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger products_updated before update on public.products for each row execute function public.update_updated_at_column();

create table public.product_colors (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null, hex text, sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (product_id, name)
);
create table public.product_sizes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  label text not null, sort_order integer not null default 0,
  price_adjustment numeric(12,2) not null default 0,
  is_active boolean not null default true,
  unique (product_id, label)
);
create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  color_id uuid not null references public.product_colors(id) on delete cascade,
  size_id uuid not null references public.product_sizes(id) on delete cascade,
  sku text, supplier_sku text,
  wholesale_cost numeric(12,2), price numeric(12,2),
  quantity_available integer not null default 0,
  quantity_reserved integer not null default 0,
  quantity_sold integer not null default 0,
  low_stock_threshold integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (color_id, size_id)
);
create trigger variants_updated before update on public.product_variants for each row execute function public.update_updated_at_column();

create table public.garment_assets (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  color_id uuid not null references public.product_colors(id) on delete cascade,
  view public.garment_view not null,
  storage_path text not null,
  image_width integer, image_height integer,
  dominant_hex text,
  color_check_status text not null default 'unchecked',
  color_check_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (color_id, view)
);
create trigger assets_updated before update on public.garment_assets for each row execute function public.update_updated_at_column();

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null, alt_text text, sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ========== print areas & calibration ==========
create table public.print_areas (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  view public.garment_view not null,
  name text not null default 'Print area',
  x_pct numeric(8,5) not null,
  y_pct numeric(8,5) not null,
  width_pct numeric(8,5) not null,
  height_pct numeric(8,5) not null,
  physical_width_in numeric(8,3),
  physical_height_in numeric(8,3),
  version integer not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, view, name)
);
create trigger print_areas_updated before update on public.print_areas for each row execute function public.update_updated_at_column();

create table public.print_area_revisions (
  id uuid primary key default gen_random_uuid(),
  print_area_id uuid not null references public.print_areas(id) on delete cascade,
  snapshot jsonb not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.calibrations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  view public.garment_view not null,
  reference_type public.calibration_reference_type not null,
  reference_label text,
  reference_x_pct numeric(8,5) not null,
  reference_y_pct numeric(8,5) not null,
  physical_width_in numeric(8,3),
  physical_height_in numeric(8,3),
  pixels_per_inch numeric(10,4),
  confirmed boolean not null default false,
  confirmed_by uuid references auth.users(id) on delete set null,
  confirmed_at timestamptz,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, view)
);
create trigger calibrations_updated before update on public.calibrations for each row execute function public.update_updated_at_column();

-- ========== decoration ==========
create table public.decoration_methods (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null, description text,
  is_active boolean not null default true,
  sort_order integer not null default 0
);
create table public.placements (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  view public.garment_view,
  is_active boolean not null default true,
  sort_order integer not null default 0
);
create table public.product_decoration_methods (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  decoration_method_id uuid not null references public.decoration_methods(id) on delete cascade,
  is_enabled boolean not null default true,
  unique (product_id, decoration_method_id)
);
create table public.product_placements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  placement_id uuid not null references public.placements(id) on delete cascade,
  decoration_method_id uuid references public.decoration_methods(id) on delete cascade,
  print_area_id uuid references public.print_areas(id) on delete set null,
  is_enabled boolean not null default true,
  unique (product_id, placement_id, decoration_method_id)
);

-- ========== pricing ==========
create table public.pricing_rules (
  id uuid primary key default gen_random_uuid(),
  decoration_method_id uuid references public.decoration_methods(id) on delete cascade,
  name text not null,
  scope text not null default 'global',
  product_id uuid references public.products(id) on delete cascade,
  config jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger pricing_rules_updated before update on public.pricing_rules for each row execute function public.update_updated_at_column();

create table public.pricing_tiers (
  id uuid primary key default gen_random_uuid(),
  pricing_rule_id uuid not null references public.pricing_rules(id) on delete cascade,
  min_quantity integer not null,
  max_quantity integer,
  unit_price numeric(12,4) not null default 0,
  per_location_price numeric(12,4) not null default 0,
  per_color_price numeric(12,4) not null default 0,
  per_1000_stitches_price numeric(12,4) not null default 0,
  sort_order integer not null default 0
);

create table public.artwork_services (
  id uuid primary key default gen_random_uuid(),
  name text not null, description text,
  price numeric(12,2) not null default 0,
  is_required boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0
);

create table public.gang_sheet_sizes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  width_in numeric(8,2) not null, height_in numeric(8,2) not null,
  margin_in numeric(6,2) not null default 0.25,
  spacing_in numeric(6,2) not null default 0.125,
  price numeric(12,2) not null default 0,
  is_active boolean not null default true
);

create table public.shipping_methods (
  id uuid primary key default gen_random_uuid(),
  name text not null, code text not null unique, description text,
  base_rate numeric(12,2) not null default 0,
  per_unit_rate numeric(12,4) not null default 0,
  regions text[] not null default '{}',
  is_active boolean not null default true
);
create table public.tax_rates (
  id uuid primary key default gen_random_uuid(),
  country text not null, region text, name text not null,
  rate numeric(8,5) not null, compound boolean not null default false,
  is_active boolean not null default true
);
create table public.notification_templates (
  id uuid primary key default gen_random_uuid(),
  code text not null unique, name text not null,
  subject text not null, body text not null,
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

-- ========== artwork & designs ==========
create table public.artworks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  original_filename text not null,
  storage_path text not null,
  preview_path text,
  mime_type text, file_size bigint,
  width_px integer, height_px integer, dpi integer,
  has_transparency boolean,
  warnings jsonb not null default '[]'::jsonb,
  status text not null default 'uploaded',
  created_at timestamptz not null default now()
);

create table public.designs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text,
  product_id uuid references public.products(id) on delete set null,
  color_id uuid references public.product_colors(id) on delete set null,
  decoration_method_id uuid references public.decoration_methods(id) on delete set null,
  config_snapshot jsonb not null default '{}'::jsonb,
  is_saved boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger designs_updated before update on public.designs for each row execute function public.update_updated_at_column();

create table public.design_placements (
  id uuid primary key default gen_random_uuid(),
  design_id uuid not null references public.designs(id) on delete cascade,
  view public.garment_view not null,
  placement_id uuid references public.placements(id) on delete set null,
  print_area_id uuid references public.print_areas(id) on delete set null,
  artwork_id uuid references public.artworks(id) on delete set null,
  x_pct numeric(8,5) not null default 0,
  y_pct numeric(8,5) not null default 0,
  width_pct numeric(8,5) not null default 0,
  height_pct numeric(8,5) not null default 0,
  rotation numeric(8,3) not null default 0,
  physical_width_in numeric(8,3),
  physical_height_in numeric(8,3),
  offset_from_reference_in numeric(8,3),
  horizontal_offset_in numeric(8,3),
  created_at timestamptz not null default now()
);

-- ========== cart ==========
create table public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  session_token text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  design_id uuid references public.designs(id) on delete set null,
  decoration_method_id uuid references public.decoration_methods(id) on delete set null,
  quantity_matrix jsonb not null default '[]'::jsonb,
  quantity integer not null default 1,
  unit_price numeric(12,2) not null default 0,
  line_total numeric(12,2) not null default 0,
  price_breakdown jsonb not null default '{}'::jsonb,
  config_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ========== quotes ==========
create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  quote_number text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  contact_name text, contact_email text, contact_phone text, company text,
  status public.quote_status not null default 'new',
  deadline date, shipping_destination text, notes text,
  subtotal numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  rush_fee numeric(12,2) not null default 0,
  artwork_fee numeric(12,2) not null default 0,
  shipping numeric(12,2) not null default 0,
  tax numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  expires_at date,
  assigned_to uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger quotes_updated before update on public.quotes for each row execute function public.update_updated_at_column();

create table public.quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  design_id uuid references public.designs(id) on delete set null,
  decoration_method_id uuid references public.decoration_methods(id) on delete set null,
  description text,
  quantity_matrix jsonb not null default '[]'::jsonb,
  quantity integer not null default 0,
  unit_price numeric(12,2) not null default 0,
  line_total numeric(12,2) not null default 0,
  price_breakdown jsonb not null default '{}'::jsonb,
  config_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.quote_events (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null, message text, metadata jsonb not null default '{}'::jsonb,
  is_customer_visible boolean not null default true,
  created_at timestamptz not null default now()
);

-- ========== orders ==========
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  quote_id uuid references public.quotes(id) on delete set null,
  status public.order_status not null default 'pending',
  contact_email text, contact_name text, contact_phone text,
  billing_address jsonb not null default '{}'::jsonb,
  shipping_address jsonb not null default '{}'::jsonb,
  shipping_method_id uuid references public.shipping_methods(id) on delete set null,
  tracking_number text, shipment_status text,
  subtotal numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  shipping numeric(12,2) not null default 0,
  tax numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  currency text not null default 'CAD',
  payment_status text not null default 'unpaid',
  payment_reference text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger orders_updated before update on public.orders for each row execute function public.update_updated_at_column();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  design_id uuid references public.designs(id) on delete set null,
  decoration_method_id uuid references public.decoration_methods(id) on delete set null,
  description text,
  quantity_matrix jsonb not null default '[]'::jsonb,
  quantity integer not null default 0,
  unit_price numeric(12,2) not null default 0,
  line_total numeric(12,2) not null default 0,
  price_breakdown jsonb not null default '{}'::jsonb,
  frozen_config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ========== proofs ==========
create table public.proofs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  quote_id uuid references public.quotes(id) on delete cascade,
  order_item_id uuid references public.order_items(id) on delete cascade,
  version integer not null default 1,
  status public.proof_status not null default 'draft',
  proof_image_path text,
  frozen_config jsonb not null default '{}'::jsonb,
  customer_note text, staff_note text,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

-- ========== production ==========
create table public.production_jobs (
  id uuid primary key default gen_random_uuid(),
  job_number text not null unique,
  order_id uuid not null references public.orders(id) on delete cascade,
  order_item_id uuid references public.order_items(id) on delete set null,
  decoration_method_id uuid references public.decoration_methods(id) on delete set null,
  stage public.production_stage not null default 'new',
  due_date date,
  assigned_to uuid references auth.users(id) on delete set null,
  production_data jsonb not null default '{}'::jsonb,
  readiness jsonb not null default '{}'::jsonb,
  is_production_ready boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger production_jobs_updated before update on public.production_jobs for each row execute function public.update_updated_at_column();

create table public.production_overrides (
  id uuid primary key default gen_random_uuid(),
  production_job_id uuid not null references public.production_jobs(id) on delete cascade,
  field_key text not null,
  calculated_value text,
  override_value text not null,
  reason text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.qc_records (
  id uuid primary key default gen_random_uuid(),
  production_job_id uuid not null references public.production_jobs(id) on delete cascade,
  result public.qc_result not null,
  print_quality text, placement_check text, color_check text,
  quantity_checked integer, size_count jsonb not null default '{}'::jsonb,
  defects text, notes text, photo_paths text[] not null default '{}',
  reprint_required boolean not null default false,
  checked_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ========== audit ==========
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  entity_type text not null, entity_id uuid,
  action text not null,
  before_value jsonb, after_value jsonb,
  created_at timestamptz not null default now()
);

-- ========== grants ==========
grant select on public.product_categories, public.products, public.product_colors, public.product_sizes,
  public.product_variants, public.garment_assets, public.product_images, public.print_areas,
  public.calibrations, public.decoration_methods, public.placements, public.product_decoration_methods,
  public.product_placements, public.pricing_rules, public.pricing_tiers, public.artwork_services,
  public.gang_sheet_sizes, public.shipping_methods, public.tax_rates to anon, authenticated;

grant select, insert, update, delete on
  public.suppliers, public.product_categories, public.products, public.product_colors, public.product_sizes,
  public.product_variants, public.garment_assets, public.product_images, public.print_areas,
  public.print_area_revisions, public.calibrations, public.decoration_methods, public.placements,
  public.product_decoration_methods, public.product_placements, public.pricing_rules, public.pricing_tiers,
  public.artwork_services, public.gang_sheet_sizes, public.shipping_methods, public.tax_rates,
  public.notification_templates, public.artworks, public.designs, public.design_placements,
  public.carts, public.cart_items, public.quotes, public.quote_items, public.quote_events,
  public.orders, public.order_items, public.proofs, public.production_jobs, public.production_overrides,
  public.qc_records, public.audit_log to authenticated;

grant all on public.suppliers, public.product_categories, public.products, public.product_colors,
  public.product_sizes, public.product_variants, public.garment_assets, public.product_images,
  public.print_areas, public.print_area_revisions, public.calibrations, public.decoration_methods,
  public.placements, public.product_decoration_methods, public.product_placements, public.pricing_rules,
  public.pricing_tiers, public.artwork_services, public.gang_sheet_sizes, public.shipping_methods,
  public.tax_rates, public.notification_templates, public.artworks, public.designs, public.design_placements,
  public.carts, public.cart_items, public.quotes, public.quote_items, public.quote_events, public.orders,
  public.order_items, public.proofs, public.production_jobs, public.production_overrides, public.qc_records,
  public.audit_log to service_role;

-- ========== RLS ==========
alter table public.suppliers enable row level security;
alter table public.product_categories enable row level security;
alter table public.products enable row level security;
alter table public.product_colors enable row level security;
alter table public.product_sizes enable row level security;
alter table public.product_variants enable row level security;
alter table public.garment_assets enable row level security;
alter table public.product_images enable row level security;
alter table public.print_areas enable row level security;
alter table public.print_area_revisions enable row level security;
alter table public.calibrations enable row level security;
alter table public.decoration_methods enable row level security;
alter table public.placements enable row level security;
alter table public.product_decoration_methods enable row level security;
alter table public.product_placements enable row level security;
alter table public.pricing_rules enable row level security;
alter table public.pricing_tiers enable row level security;
alter table public.artwork_services enable row level security;
alter table public.gang_sheet_sizes enable row level security;
alter table public.shipping_methods enable row level security;
alter table public.tax_rates enable row level security;
alter table public.notification_templates enable row level security;
alter table public.artworks enable row level security;
alter table public.designs enable row level security;
alter table public.design_placements enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_items enable row level security;
alter table public.quote_events enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.proofs enable row level security;
alter table public.production_jobs enable row level security;
alter table public.production_overrides enable row level security;
alter table public.qc_records enable row level security;
alter table public.audit_log enable row level security;

-- public catalog reads
create policy "published products public" on public.products for select using (status = 'published' or public.is_staff(auth.uid()));
create policy "categories public" on public.product_categories for select using (true);
create policy "colors public" on public.product_colors for select using (true);
create policy "sizes public" on public.product_sizes for select using (true);
create policy "variants public" on public.product_variants for select using (true);
create policy "assets public" on public.garment_assets for select using (true);
create policy "product images public" on public.product_images for select using (true);
create policy "print areas public" on public.print_areas for select using (true);
create policy "calibrations public" on public.calibrations for select using (true);
create policy "methods public" on public.decoration_methods for select using (true);
create policy "placements public" on public.placements for select using (true);
create policy "pdm public" on public.product_decoration_methods for select using (true);
create policy "pp public" on public.product_placements for select using (true);
create policy "pricing rules public" on public.pricing_rules for select using (true);
create policy "pricing tiers public" on public.pricing_tiers for select using (true);
create policy "artwork services public" on public.artwork_services for select using (true);
create policy "gang sheets public" on public.gang_sheet_sizes for select using (true);
create policy "shipping public" on public.shipping_methods for select using (true);
create policy "tax public" on public.tax_rates for select using (true);

-- admin writes on catalog/config
create policy "admin manage suppliers" on public.suppliers for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "staff read suppliers" on public.suppliers for select to authenticated using (public.is_staff(auth.uid()));
create policy "admin manage categories" on public.product_categories for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "admin manage products" on public.products for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "admin manage colors" on public.product_colors for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "admin manage sizes" on public.product_sizes for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "admin manage variants" on public.product_variants for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "admin manage assets" on public.garment_assets for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "admin manage product images" on public.product_images for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "admin manage print areas" on public.print_areas for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "staff read revisions" on public.print_area_revisions for select to authenticated using (public.is_staff(auth.uid()));
create policy "admin manage revisions" on public.print_area_revisions for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "admin manage calibrations" on public.calibrations for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "admin manage methods" on public.decoration_methods for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "admin manage placements" on public.placements for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "admin manage pdm" on public.product_decoration_methods for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "admin manage pp" on public.product_placements for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "admin manage pricing rules" on public.pricing_rules for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "admin manage pricing tiers" on public.pricing_tiers for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "admin manage artwork services" on public.artwork_services for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "admin manage gang sheets" on public.gang_sheet_sizes for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "admin manage shipping" on public.shipping_methods for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "admin manage tax" on public.tax_rates for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "staff read templates" on public.notification_templates for select to authenticated using (public.is_staff(auth.uid()));
create policy "admin manage templates" on public.notification_templates for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- customer-owned data
create policy "artwork own or staff" on public.artworks for select to authenticated using (user_id = auth.uid() or public.is_staff(auth.uid()));
create policy "artwork insert own" on public.artworks for insert to authenticated with check (user_id = auth.uid() or public.is_staff(auth.uid()));
create policy "artwork update own" on public.artworks for update to authenticated using (user_id = auth.uid() or public.is_staff(auth.uid())) with check (true);
create policy "artwork delete own" on public.artworks for delete to authenticated using (user_id = auth.uid() or public.is_admin(auth.uid()));

create policy "designs own or staff" on public.designs for select to authenticated using (user_id = auth.uid() or public.is_staff(auth.uid()));
create policy "designs insert own" on public.designs for insert to authenticated with check (user_id = auth.uid() or public.is_staff(auth.uid()));
create policy "designs update own" on public.designs for update to authenticated using (user_id = auth.uid() or public.is_staff(auth.uid())) with check (true);
create policy "designs delete own" on public.designs for delete to authenticated using (user_id = auth.uid() or public.is_admin(auth.uid()));

create policy "design placements via design" on public.design_placements for all to authenticated
  using (exists (select 1 from public.designs d where d.id = design_id and (d.user_id = auth.uid() or public.is_staff(auth.uid()))))
  with check (exists (select 1 from public.designs d where d.id = design_id and (d.user_id = auth.uid() or public.is_staff(auth.uid()))));

create policy "carts own" on public.carts for all to authenticated using (user_id = auth.uid() or public.is_staff(auth.uid())) with check (user_id = auth.uid() or public.is_staff(auth.uid()));
create policy "cart items via cart" on public.cart_items for all to authenticated
  using (exists (select 1 from public.carts c where c.id = cart_id and (c.user_id = auth.uid() or public.is_staff(auth.uid()))))
  with check (exists (select 1 from public.carts c where c.id = cart_id and (c.user_id = auth.uid() or public.is_staff(auth.uid()))));

create policy "quotes own or staff" on public.quotes for select to authenticated using (user_id = auth.uid() or public.is_staff(auth.uid()));
create policy "quotes insert own" on public.quotes for insert to authenticated with check (user_id = auth.uid() or public.is_staff(auth.uid()));
create policy "quotes staff update" on public.quotes for update to authenticated using (public.is_staff(auth.uid()) or user_id = auth.uid()) with check (true);
create policy "quotes admin delete" on public.quotes for delete to authenticated using (public.is_admin(auth.uid()));

create policy "quote items via quote" on public.quote_items for all to authenticated
  using (exists (select 1 from public.quotes q where q.id = quote_id and (q.user_id = auth.uid() or public.is_staff(auth.uid()))))
  with check (exists (select 1 from public.quotes q where q.id = quote_id and (q.user_id = auth.uid() or public.is_staff(auth.uid()))));
create policy "quote events via quote" on public.quote_events for all to authenticated
  using (exists (select 1 from public.quotes q where q.id = quote_id and (q.user_id = auth.uid() or public.is_staff(auth.uid()))))
  with check (exists (select 1 from public.quotes q where q.id = quote_id and (q.user_id = auth.uid() or public.is_staff(auth.uid()))));

create policy "orders own or staff" on public.orders for select to authenticated using (user_id = auth.uid() or public.is_staff(auth.uid()));
create policy "orders insert own" on public.orders for insert to authenticated with check (user_id = auth.uid() or public.is_staff(auth.uid()));
create policy "orders staff update" on public.orders for update to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "orders admin delete" on public.orders for delete to authenticated using (public.is_admin(auth.uid()));

create policy "order items via order" on public.order_items for all to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_staff(auth.uid()))))
  with check (exists (select 1 from public.orders o where o.id = order_id and public.is_staff(auth.uid())));

create policy "proofs visible to owner or staff" on public.proofs for select to authenticated using (
  public.is_staff(auth.uid())
  or exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  or exists (select 1 from public.quotes q where q.id = quote_id and q.user_id = auth.uid()));
create policy "proofs staff manage" on public.proofs for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "proofs customer approve" on public.proofs for update to authenticated using (
  exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  or exists (select 1 from public.quotes q where q.id = quote_id and q.user_id = auth.uid())) with check (true);

create policy "production staff read" on public.production_jobs for select to authenticated using (public.is_staff(auth.uid()));
create policy "production staff manage" on public.production_jobs for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "overrides staff" on public.production_overrides for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "qc staff" on public.qc_records for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "audit staff read" on public.audit_log for select to authenticated using (public.is_staff(auth.uid()));
create policy "audit insert staff" on public.audit_log for insert to authenticated with check (public.is_staff(auth.uid()));

-- ========== seed reference data ==========
insert into public.decoration_methods (code, name, description, sort_order) values
  ('screen_print','Screen Printing','Durable, vibrant ink for medium to large runs',1),
  ('dtf','DTF Printing','Full-colour direct-to-film printing on garments',2),
  ('dtf_sheet','DTF Transfers / Sheets','Ready-to-press transfers and gang sheets',3),
  ('embroidery','Embroidery','Stitched decoration for hats, polos and outerwear',4);

insert into public.placements (code, name, view, sort_order) values
  ('full_front','Full Front','front',1),
  ('left_chest','Left Chest','front',2),
  ('right_chest','Right Chest','front',3),
  ('center_chest','Center Chest','front',4),
  ('full_back','Full Back','back',5),
  ('upper_back','Upper Back / Yoke','back',6),
  ('left_sleeve','Left Sleeve','left_sleeve',7),
  ('right_sleeve','Right Sleeve','right_sleeve',8);

insert into public.artwork_services (name, description, price, sort_order) values
  ('Background removal','We isolate your artwork from its background',15,1),
  ('Background cleanup','Edge cleanup and artifact removal',20,2),
  ('Vectorization','Convert raster artwork to clean vector art',35,3),
  ('Artwork recreation','We rebuild your artwork from scratch',65,4),
  ('Colour correction','Match colours to print output',20,5),
  ('Design modification','Edits to existing artwork',30,6),
  ('Rush artwork preparation','Same-day artwork turnaround',40,7);

insert into public.tax_rates (country, region, name, rate) values
  ('CA','QC','GST',0.05),
  ('CA','QC','QST',0.09975),
  ('CA','ON','HST',0.13);

insert into public.shipping_methods (name, code, base_rate, per_unit_rate, regions) values
  ('Shop pickup','pickup',0,0,'{CA}'),
  ('Local delivery','local',15,0,'{CA}'),
  ('Canada standard','ca_standard',18,0.35,'{CA}'),
  ('US standard','us_standard',29,0.60,'{US}');

insert into public.product_categories (name, slug, sort_order) values
  ('T-Shirts','t-shirts',1),('Hoodies','hoodies',2),('Sweatshirts','sweatshirts',3),
  ('Hats','hats',4),('Polos','polos',5),('Outerwear','outerwear',6);

insert into public.gang_sheet_sizes (name, width_in, height_in, price) values
  ('22" x 24"',22,24,28),('22" x 36"',22,36,40),('22" x 60"',22,60,62),('22" x 120"',22,120,115);