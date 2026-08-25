# Zee Fit — Admin Panel

Next.js 15 App Router · Supabase (Postgres + Auth) · Prisma 7 · Tailwind v4

The panel lives at `/admin`. The storefront is untouched: its routes moved into a
`(storefront)` route group so `/admin` can opt out of the site chrome, and route
groups do not change URLs.

---

## Setup

### 1. Create the Supabase project

Project Settings → **Database** for the connection strings, → **API** for the keys.

### 2. Fill in `.env`

```bash
cp .env.example .env
```

Both URLs are needed and they are different on purpose:

| Variable | Port | Used by |
|---|---|---|
| `DATABASE_URL` | 6543 (pooler) | the app at runtime, via the pg driver adapter |
| `DIRECT_URL` | 5432 (direct) | `prisma migrate` only |

Transaction-mode pooling cannot hold the advisory locks DDL requires, so
migrations must not go through 6543.

### 3. Create the schema

```bash
npm run db:migrate     # prisma migrate dev
```

### 4. Apply the Supabase bindings — **required, and not optional**

```bash
psql "$DIRECT_URL" -f prisma/sql/01_auth_bindings.sql
```

(or paste it into the Supabase SQL editor)

This adds the `profiles → auth.users` foreign key, the signup trigger, the JWT
role hook and the RLS policies. Prisma deliberately does not manage any of it —
letting `prisma migrate` near Supabase's `auth` schema is how people end up with
a migration that proposes dropping Supabase's own tables.

### 5. Turn on the JWT hook

Dashboard → **Authentication → Hooks → Customize Access Token** → select
`public.custom_access_token_hook`.

### 6. Disable public sign-ups

Dashboard → **Authentication → Sign In / Providers** → turn off new sign-ups.

**This matters.** The signup trigger creates a `profiles` row for every new
`auth.users` row. With public sign-ups enabled, anyone who registers becomes an
Editor with write access to the catalogue.

### 7. Import the existing catalogue

```bash
npm run verify:seed   # offline sanity check — no DB needed
npm run db:seed       # 3 top / 9 mid / 55 end categories, then the products
```

The seed is idempotent (upserts on `legacyId`), so re-running refreshes rather
than duplicates.

### 8. Create the first administrator

The trigger reads the role from invite metadata and defaults to `EDITOR`, so the
very first Admin has to be promoted by hand:

1. Dashboard → **Authentication → Users → Add user** (with a password).
2. Then, once:

```sql
update public.profiles set role = 'ADMIN' where email = 'you@zeefit.ae';
```

Every subsequent account is created from inside the panel.

### 9. Run it

```bash
npm run dev     # http://localhost:3000/admin
```

---

## Roles

| | Products | Publish | Delete | Categories | Users | Settings | Audit log |
|---|---|---|---|---|---|---|---|
| **Admin** | CRUD | ✅ | ✅ | CRUD | ✅ | ✅ | ✅ |
| **Editor** | create / edit | ✅ | ❌ | read-only | ❌ | ❌ | ❌ |

An Editor owns a product's whole lifecycle — create, edit, publish, unpublish,
archive. The only thing they cannot do is hard-delete it.

The matrix is one file: `src/lib/auth/permissions.ts`. Nothing in the codebase
branches on `role === "ADMIN"`; every gate asks `can(role, permission)`, so a
third role is an edit to that file rather than a codebase sweep.

---

## How authorization actually works

Four layers, in ascending order of trustworthiness:

1. **`src/middleware.ts`** — refreshes the Supabase session cookie and redirects
   anonymous callers. A redirect optimisation, *not* a gate.
2. **`(protected)/layout.tsx`** — `requireStaff()`, reading `profiles.role` from
   Postgres.
3. **Every page and every Server Action** — `requirePermission()` /
   `authorize()` from `src/lib/auth/guard.ts`. **This is the boundary.**
4. **RLS** — a backstop on the anon/PostgREST path.

### Why the boundary is layer 3

A Server Action is an independently addressable POST endpoint. The check in
`admin/layout.tsx` does **not** run before one fires. An Editor who reads the
page source can obtain the action id for `deleteProduct` and invoke it directly —
so every mutating action in `products/actions.ts` opens with `authorize(...)`.

Hiding a button is a courtesy. The server-side re-check is the control.

### Known scope limits — read before hardening

- **RLS does not constrain Prisma.** Prisma connects as a role with `BYPASSRLS`,
  so the policies in `01_auth_bindings.sql` bind the anon/PostgREST path only.
  The admin panel is gated in application code. To make RLS bind Prisma too,
  point `DATABASE_URL` at a dedicated non-bypassing Postgres role.
- **The JWT role claim is a cache, never an authority.** Demote an Admin and
  their existing token still says `ADMIN` until it refreshes (up to an hour).
  Middleware uses the claim only for the cheap redirect; layers 2 and 3 re-read
  Postgres. Role changes should also call
  `supabase.auth.admin.signOut(userId, "global")`.
- **Rich-text HTML is stored as authored and is not sanitised.** Tiptap
  constrains input to its own schema, which is a real constraint but not a
  sanitiser, and the storefront renders these fields with
  `dangerouslySetInnerHTML`. Both roles are trusted staff today. Before opening
  authoring more widely, sanitise server-side in `productSchema`.

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Next dev server |
| `npm run db:migrate` | Create/apply a migration (direct connection) |
| `npm run db:deploy` | Apply migrations in CI/production |
| `npm run db:seed` | Import the zeefit catalogue |
| `npm run db:studio` | Prisma Studio |
| `npm run verify:seed` | Offline check of seed slug/id mapping — no DB needed |

---

## What is built, and what is not

**Built:** authentication and RBAC end to end, the dashboard, the full product
list (search, status filter, sortable columns, pagination, row actions), the
Add/Edit product form with the live SERP preview and image uploads to Supabase
Storage, and the category tree manager.

**The storefront reads from Postgres.** Publishing in the panel puts a product
on the site. Canonical product URLs are ; the original
 links 308-redirect to them, so indexed URLs keep their
ranking instead of splitting it across two addresses.

Storefront pages are ISR () and every catalogue mutation calls
, so an edit appears immediately rather than
waiting out the window. The layout purge is deliberate: the navigation tree is
rendered in the shared layout, so purging one page would leave a stale menu.

**Stubbed — the nav links exist, the pages do not:** ,
. They are gated already, so an Editor reaching them gets a
403; they simply have no UI yet. Staff accounts are still created in the
Supabase dashboard.

**Known gaps:**
- Product images are uploaded but not resized or cropped on upload; a 5 MB
  photo is served at 5 MB (next/image does resize on delivery).
- Popular on the homepage is alphabetical. No behavioural data exists yet, so
  there is nothing honest to rank by.
- No sitemap.xml yet, though  exists for it.
