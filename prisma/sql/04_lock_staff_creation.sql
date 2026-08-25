-- ---------------------------------------------------------------------------
-- Stop new sign-ups from becoming staff. Run once, over the DIRECT connection.
--
-- 01_auth_bindings.sql installed on_auth_user_created, which gave EVERY new
-- auth.users row a public.profiles row defaulting to EDITOR. That was written
-- for an invite-email flow this project did not end up using, and it means the
-- only thing standing between a public sign-up and write access to the
-- catalogue — now also to customer names, phones and addresses — is a toggle in
-- the Supabase dashboard. A toggle is a mitigation, not a control: flip it back
-- by accident, or enable a social provider, and the grant returns.
--
-- The trigger is also redundant. createStaffUser() in the admin panel upserts
-- the profile itself immediately after calling the Auth admin API, precisely
-- because the trigger might race it. Removing the trigger changes nothing about
-- how staff are actually created, and makes "has a profile row" mean "an
-- administrator deliberately created this account".
--
-- Anyone who registers now gets an auth.users row and nothing else:
-- lib/auth/guard.ts returns null without a profile, so they are not staff.
-- ---------------------------------------------------------------------------

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_staff_user();

-- Belt and braces: the anon role should never be able to write this table
-- directly through PostgREST either. RLS already blocks it (the only policy is
-- a self-read for authenticated users), but the grants need not exist at all.
revoke insert, update, delete on table public.profiles from anon, authenticated;

-- supabase_auth_admin still needs to read profiles for the JWT role hook.
grant select on table public.profiles to supabase_auth_admin;
