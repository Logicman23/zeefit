import "dotenv/config";
import { Client } from "pg";

/** Confirms the signup trigger fired and the role promotion landed. */
(async () => {
  const c = new Client({ connectionString: process.env.DIRECT_URL, connectionTimeoutMillis: 20_000 });
  await c.connect();

  const users = await c.query<{ c: number }>("select count(*)::int c from auth.users");
  const staff = await c.query<{ email: string; role: string; is_active: boolean; has_auth: boolean }>(
    `select p.email, p.role::text as role, p.is_active,
            exists(select 1 from auth.users u where u.id = p.id) as has_auth
       from public.profiles p order by p.created_at`
  );

  console.log(`\nauth.users: ${users.rows[0].c}`);
  console.log(`profiles:   ${staff.rowCount}\n`);

  if (staff.rowCount === 0) {
    console.log("  No staff profile exists. The signup trigger did not fire.");
  }
  for (const s of staff.rows) {
    const flags = [s.role, s.is_active ? "active" : "INACTIVE", s.has_auth ? "linked" : "NO AUTH USER"];
    console.log(`  ${s.email.padEnd(34)} ${flags.join(" · ")}`);
  }

  const admins = staff.rows.filter((s) => s.role === "ADMIN" && s.is_active && s.has_auth);
  console.log(
    admins.length
      ? `\nReady: ${admins.length} active administrator can sign in.\n`
      : `\nNot ready: no active, linked ADMIN profile.\n`
  );
  await c.end();
  process.exit(admins.length ? 0 : 1);
})();
