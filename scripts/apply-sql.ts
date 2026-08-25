import "dotenv/config";
import { readFileSync } from "node:fs";
import { Client } from "pg";

/**
 * Applies a raw .sql file over the DIRECT connection.
 *
 * Used for prisma/sql/*.sql -- the statements that touch Supabase's `auth`
 * schema or Postgres-level policy, which Prisma must never manage. Runs inside
 * a transaction so a failure half-way leaves nothing behind.
 */
const file = process.argv[2];
if (!file) {
  console.error("usage: tsx scripts/apply-sql.ts <path.sql>");
  process.exit(1);
}

const url = process.env.DIRECT_URL;
if (!url) {
  console.error("DIRECT_URL is not set");
  process.exit(1);
}

const sql = readFileSync(file, "utf8");

(async () => {
  const client = new Client({ connectionString: url, connectionTimeoutMillis: 20_000 });
  await client.connect();
  try {
    await client.query("begin");
    await client.query(sql);
    await client.query("commit");
    console.log(`Applied ${file}`);
  } catch (e) {
    await client.query("rollback");
    console.error(`FAILED ${file} -- rolled back, nothing applied`);
    console.error((e as Error).message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();
