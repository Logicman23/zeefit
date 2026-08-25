-- ---------------------------------------------------------------------------
-- Row Level Security for orders. Run once, over the DIRECT connection.
--
-- New tables arrive with RLS DISABLED, which on Supabase means the anon key can
-- read them through PostgREST. Orders hold names, phone numbers and home
-- addresses, so leaving that open would expose every customer's details to
-- anyone holding the public key that ships in the browser bundle.
--
-- No policy is granted to anon or authenticated at all: orders are written and
-- read exclusively by server-side Prisma, which connects as a role that bypasses
-- RLS. Enabling RLS without policies is therefore a closed door, not a lock
-- nobody holds the key to.
-- ---------------------------------------------------------------------------

alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

-- Belt and braces: revoke the table grants PostgREST relies on, so the anon
-- path cannot even attempt a read.
revoke all on table public.orders      from anon, authenticated;
revoke all on table public.order_items from anon, authenticated;
