create schema if not exists private;
grant usage on schema private to authenticated, service_role;

create or replace function private.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;
create or replace function private.is_staff(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id)
$$;
create or replace function private.is_admin(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role in ('owner','administrator'))
$$;
revoke all on function private.has_role(uuid, public.app_role) from public;
revoke all on function private.is_staff(uuid) from public;
revoke all on function private.is_admin(uuid) from public;
grant execute on function private.has_role(uuid, public.app_role) to authenticated, service_role;
grant execute on function private.is_staff(uuid) to authenticated, service_role;
grant execute on function private.is_admin(uuid) to authenticated, service_role;

do $$
declare r record; newq text; newc text; stmt text;
begin
  for r in
    select pol.polname as name, cls.relname as tbl,
           pg_get_expr(pol.polqual, pol.polrelid) as qual,
           pg_get_expr(pol.polwithcheck, pol.polrelid) as wc
    from pg_policy pol
    join pg_class cls on cls.oid = pol.polrelid
    join pg_namespace n on n.oid = cls.relnamespace
    where n.nspname = 'public'
  loop
    newq := regexp_replace(coalesce(r.qual,''), '(public\.)?\m(is_staff|is_admin|has_role)\(', 'private.\2(', 'g');
    newc := regexp_replace(coalesce(r.wc,''), '(public\.)?\m(is_staff|is_admin|has_role)\(', 'private.\2(', 'g');
    if newq is distinct from coalesce(r.qual,'') or newc is distinct from coalesce(r.wc,'') then
      stmt := format('alter policy %I on public.%I', r.name, r.tbl);
      if r.qual is not null then stmt := stmt || format(' using (%s)', newq); end if;
      if r.wc is not null then stmt := stmt || format(' with check (%s)', newc); end if;
      execute stmt;
    end if;
  end loop;
end $$;

drop function if exists public.has_role(uuid, public.app_role);
drop function if exists public.is_staff(uuid);
drop function if exists public.is_admin(uuid);