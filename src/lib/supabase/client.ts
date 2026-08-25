"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser client — anon key only, so every query it makes is bound by RLS.
 * Used for the sign-in form and for Storage uploads from the product editor.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
