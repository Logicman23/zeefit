-- ---------------------------------------------------------------------------
-- Run ONCE, after the first `prisma migrate dev`, against the DIRECT connection.
--
-- Everything here touches Supabase's `auth` schema or Postgres-level policy,
-- which Prisma deliberately does not manage. Keeping it in raw SQL is what stops
-- `prisma migrate` from ever proposing to drop Supabase's own tables.
-- ---------------------------------------------------------------------------

-- 1. Bind profiles to Supabase Auth ------------------------------------------
-- Profile.id IS auth.users.id. Deleting the auth user removes the staff row.
alter table public.profiles
  add constraint profiles_id_fkey
  foreign key (id) references auth.users(id) on delete cascade;


-- 2. Create the staff row when an invited user is created ---------------------
-- Role comes from the invite metadata, defaulting to the least privilege.
-- IMPORTANT: disable public sign-ups in Supabase Dashboard > Authentication >
-- Sign In / Providers. With them enabled, anyone who registers lands here and
-- receives Editor access to the catalogue.
create or replace function public.handle_new_staff_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce((new.raw_user_meta_data ->> 'role')::public."Role", 'EDITOR'::public."Role")
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_staff_user();


-- 3. Put the role in the JWT --------------------------------------------------
-- Enable afterwards at Dashboard > Authentication > Hooks > Customize Access Token.
--
-- This claim is a CACHE, never an authority: demote an Admin and their existing
-- token still says ADMIN until it refreshes (up to an hour). Middleware uses it
-- only for the cheap redirect; lib/auth/guard.ts re-reads profiles.role from
-- Postgres on every page and every Server Action.
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  claims    jsonb;
  user_role text;
begin
  select role::text
    into user_role
    from public.profiles
   where id = (event ->> 'user_id')::uuid
     and is_active;

  claims := event -> 'claims';
  claims := jsonb_set(
    claims,
    '{app_metadata,user_role}',
    coalesce(to_jsonb(user_role), 'null'::jsonb)
  );

  return jsonb_set(event, '{claims}', claims);
end;
$$;

grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook from authenticated, anon, public;
grant select on table public.profiles to supabase_auth_admin;


-- 4. Row Level Security -------------------------------------------------------
-- Scope note: Prisma connects as a role with BYPASSRLS, so these policies bind
-- the PostgREST/anon path (the storefront, a leaked anon key) — NOT the admin
-- panel's own queries. The admin panel is gated in application code by
-- lib/auth/guard.ts. To make RLS bind Prisma too, point DATABASE_URL at a
-- dedicated non-bypassing role.

alter table public.products   enable row level security;
alter table public.categories enable row level security;
alter table public.profiles   enable row level security;
alter table public.audit_logs enable row level security;
alter table public.settings   enable row level security;

-- Public storefront: published, non-deleted products only.
drop policy if exists "public reads published products" on public.products;
create policy "public reads published products"
  on public.products for select
  to anon, authenticated
  using (status = 'PUBLISHED' and deleted_at is null);

drop policy if exists "public reads active categories" on public.categories;
create policy "public reads active categories"
  on public.categories for select
  to anon, authenticated
  using (is_active);

-- Staff may read their own profile; nobody may change their own role via the
-- anon path. Role changes go through the service-role client behind user:write.
drop policy if exists "staff read own profile" on public.profiles;
create policy "staff read own profile"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

-- audit_logs and settings: no policy at all, so the anon path can read neither.
