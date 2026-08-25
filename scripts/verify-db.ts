import "dotenv/config";
import { Client } from "pg";

const c = new Client({ connectionString: process.env.DIRECT_URL, connectionTimeoutMillis: 20_000 });

const checks: [string, string, (r: any[]) => boolean, (r: any[]) => string][] = [
  ["tables", "select table_name from information_schema.tables where table_schema='public' and table_name <> '_prisma_migrations'",
    (r) => r.length === 5, (r) => r.map((x) => x.table_name).sort().join(", ")],
  ["categories seeded", "select level, count(*)::int c from categories group by level order by level",
    (r) => r.reduce((n, x) => n + x.c, 0) === 67, (r) => r.map((x) => `${x.level}=${x.c}`).join(" ")],
  ["products seeded", "select status, count(*)::int c from products group by status",
    (r) => r.reduce((n, x) => n + x.c, 0) === 21, (r) => r.map((x) => `${x.status}=${x.c}`).join(" ")],
  ["profiles -> auth.users FK", "select conname from pg_constraint where conname='profiles_id_fkey'",
    (r) => r.length === 1, () => "present"],
  ["signup trigger", "select tgname from pg_trigger where tgname='on_auth_user_created'",
    (r) => r.length === 1, () => "on auth.users"],
  ["JWT role hook", "select proname from pg_proc where proname='custom_access_token_hook'",
    (r) => r.length === 1, () => "function exists"],
  ["RLS enabled", "select relname from pg_class where relrowsecurity and relnamespace='public'::regnamespace",
    (r) => r.length === 5, (r) => `${r.length} tables`],
  ["RLS policies", "select policyname from pg_policies where schemaname='public'",
    (r) => r.length >= 3, (r) => r.map((x) => x.policyname).join("; ")],
];

(async () => {
  await c.connect();
  let fail = 0;
  for (const [label, sql, ok, fmt] of checks) {
    const { rows } = await c.query(sql);
    const pass = ok(rows);
    if (!pass) fail++;
    console.log(`  ${pass ? "PASS" : "FAIL"}  ${label.padEnd(26)} ${fmt(rows)}`);
  }
  await c.end();
  console.log(fail ? `\n${fail} check(s) failed.\n` : "\nDatabase is fully configured.\n");
  process.exit(fail ? 1 : 0);
})();
