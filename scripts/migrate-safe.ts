import "dotenv/config";
import { spawnSync } from "node:child_process";
import { Client } from "pg";

/**
 * Runs a Prisma migration around the one constraint Prisma cannot cope with.
 *
 * `public.profiles.id` has a foreign key into Supabase's `auth.users`. Prisma
 * introspects the database to detect drift before migrating, and refuses on any
 * cross-schema reference it does not own:
 *
 *   P4002 ... `public.profiles` points to `auth.users` in constraint
 *   profiles_id_fkey. Please add `auth` to your `schemas` property.
 *
 * Adding `auth` to the datasource is exactly what must not happen — Prisma would
 * then believe it owns Supabase's auth tables and offer to drop them. So the
 * constraint is dropped for the duration of the migration and put straight back,
 * in a finally block, whether or not the migration succeeded.
 *
 * Usage: npm run db:migrate:safe -- --name add_something
 */

const CONSTRAINT = "profiles_id_fkey";

const DROP = `alter table public.profiles drop constraint if exists ${CONSTRAINT};`;
const ADD = `
  alter table public.profiles
    add constraint ${CONSTRAINT}
    foreign key (id) references auth.users(id) on delete cascade;
`;

async function withClient<T>(fn: (c: Client) => Promise<T>): Promise<T> {
  const c = new Client({ connectionString: process.env.DIRECT_URL, connectionTimeoutMillis: 20_000 });
  await c.connect();
  try {
    return await fn(c);
  } finally {
    await c.end();
  }
}

async function constraintExists() {
  return withClient(async (c) => {
    const { rowCount } = await c.query("select 1 from pg_constraint where conname = $1", [CONSTRAINT]);
    return (rowCount ?? 0) > 0;
  });
}

(async () => {
  const args = process.argv.slice(2);

  if (!(await constraintExists())) {
    console.log(`\n${CONSTRAINT} is not present — running the migration directly.\n`);
    const r = spawnSync("npx", ["prisma", "migrate", "dev", ...args], { stdio: "inherit", shell: true });
    process.exit(r.status ?? 1);
  }

  console.log(`\nTemporarily dropping ${CONSTRAINT} so Prisma can introspect…`);
  await withClient((c) => c.query(DROP));

  let status = 1;
  try {
    const r = spawnSync("npx", ["prisma", "migrate", "dev", ...args], { stdio: "inherit", shell: true });
    status = r.status ?? 1;
  } finally {
    // Always restore it, including after a failed or interrupted migration —
    // leaving it off would let an auth user be deleted without its staff row.
    await withClient((c) => c.query(ADD));
    const restored = await constraintExists();
    console.log(
      restored
        ? `\n${CONSTRAINT} restored.\n`
        : `\nWARNING: ${CONSTRAINT} could NOT be restored. Re-apply prisma/sql/01_auth_bindings.sql.\n`
    );
    if (!restored) status = 1;
  }

  process.exit(status);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
