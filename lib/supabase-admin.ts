// lib/supabase-admin.ts — server-only Supabase client with the service role key.
// NEVER import this from a "use client" file or expose it to the browser.
//
// The client is created lazily so that a missing SUPABASE_SERVICE_ROLE_KEY
// at build time (e.g. on Vercel before the env var is set) does not crash
// the build — only the actual request that uses it will fail.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  }
  if (!serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY — set it in your Vercel project env vars",
    );
  }

  cached = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cached;
}
