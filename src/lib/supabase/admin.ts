import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client. Bypasses RLS entirely and can drive the Auth admin API
 * (invite, delete, force sign-out), so it must never be constructed anywhere a
 * bundle could reach the browser — `server-only` above enforces that at build.
 *
 * Every call site must sit behind a `user:write` permission check.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
