import "dotenv/config";
import { Client } from "pg";

/**
 * Supabase's pooler hostname embeds an AWS region that the project URL does not
 * reveal. Serverless must use the pooler (PgBouncer multiplexes short-lived
 * invocations), so this probes candidates and reports the one that authenticates.
 */
const direct = process.env.DIRECT_URL!;
const m = direct.match(/postgres:([^@]+)@db\.([a-z0-9]+)\.supabase\.co/);
if (!m) { console.error("Could not parse DIRECT_URL"); process.exit(1); }
const [, pw, ref] = m;

const regions = ["us-east-1","us-east-2","us-west-1","eu-central-1","eu-west-2","ap-southeast-1","ap-south-1","ap-northeast-1"];
const hosts = regions.flatMap((r) => [`aws-0-${r}`, `aws-1-${r}`]);

(async () => {
  for (const h of hosts) {
    const url = `postgresql://postgres.${ref}:${pw}@${h}.pooler.supabase.com:6543/postgres`;
    const c = new Client({ connectionString: url, connectionTimeoutMillis: 7000 });
    try {
      await c.connect();
      await c.query("select 1");
      await c.end();
      console.log(`FOUND  ${h}.pooler.supabase.com`);
      process.exit(0);
    } catch {
      try { await c.end(); } catch {}
    }
  }
  console.error("No pooler host matched — copy the Transaction pooler string from Supabase > Connect.");
  process.exit(1);
})();
