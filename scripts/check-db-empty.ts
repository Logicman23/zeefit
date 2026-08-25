import "dotenv/config";
import { Client } from "pg";

/**
 * Refuses to let a migration run against someone else's database.
 *
 * This exists because of a real near-miss: DIRECT_URL was pointed at a live
 * salon application's Postgres — 7 clients, 8 invoices, 8 payments — and
 * `prisma migrate dev` responded by offering to reset the public schema. The
 * only warning was a line of migrate output that was easy to scroll past.
 *
 * So the check runs FIRST, as its own step, and fails loudly. Tables this
 * project owns are fine (re-running a migration is normal); anything else means
 * the connection string points somewhere it should not.
 *
 * Run: npm run db:check
 */

/** Tables prisma/schema.prisma is responsible for, plus Prisma's own bookkeeping. */
const OWNED = new Set([
  "_prisma_migrations",
  "profiles",
  "categories",
  "products",
  "audit_logs",
  "settings",
]);

async function main() {
  const url = process.env.DIRECT_URL;
  if (!url) {
    console.error("FAIL  DIRECT_URL is not set — nothing to check.");
    process.exit(1);
  }

  const host = new URL(url).hostname;
  const client = new Client({ connectionString: url, connectionTimeoutMillis: 15_000 });

  try {
    await client.connect();
  } catch (e) {
    console.error(`FAIL  Cannot connect to ${host}: ${(e as Error).message}`);
    process.exit(1);
  }

  const { rows } = await client.query<{ table_name: string }>(
    "select table_name from information_schema.tables where table_schema = 'public' order by 1"
  );

  const foreign: { name: string; count: number }[] = [];
  for (const { table_name } of rows) {
    if (OWNED.has(table_name)) continue;
    const r = await client.query<{ c: number }>(
      `select count(*)::int c from public."${table_name}"`
    );
    foreign.push({ name: table_name, count: r.rows[0].c });
  }

  await client.end();

  console.log(`\nTarget: ${host}`);
  console.log(`public tables: ${rows.length} (${rows.length - foreign.length} owned by this project)`);

  if (foreign.length === 0) {
    console.log("\nPASS  Safe to migrate — nothing here belongs to another application.\n");
    return;
  }

  const populated = foreign.filter((t) => t.count > 0);

  console.error(`\nFAIL  ${foreign.length} table(s) here belong to something else:\n`);
  for (const t of foreign) {
    console.error(`      ${String(t.count).padStart(7)}  ${t.name}`);
  }
  console.error(
    populated.length
      ? `\n      ${populated.reduce((n, t) => n + t.count, 0)} rows of live data across ${populated.length} table(s).` +
          `\n      Migrating here would offer to RESET this schema and destroy it.` +
          `\n      Point DIRECT_URL/DATABASE_URL at a database of this project's own.\n`
      : `\n      Point DIRECT_URL/DATABASE_URL at a database of this project's own.\n`
  );
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
