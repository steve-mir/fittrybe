// Diagnostic: what does the anon key actually see in `sessions`?
// Run: node scripts/diagnose-sessions.mjs
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

// Tiny .env.local parser so this works without dotenv
const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const i = line.indexOf("=");
      return [line.slice(0, i), line.slice(i + 1).replace(/^"|"$/g, "")];
    })
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

console.log("URL:", url ? "set" : "MISSING");
console.log("Anon key:", anonKey ? `set (${anonKey.slice(0, 10)}…)` : "MISSING");
console.log("Service key:", serviceKey ? "set" : "EMPTY (falls back to anon)");
console.log("");

async function probe(label, key) {
  if (!key) {
    console.log(`── ${label} ─────────────── SKIPPED (no key)`);
    return;
  }
  const client = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log(`── ${label} ─────────────────────────────────`);

  const countAll = await client
    .from("sessions")
    .select("id", { count: "exact", head: true });
  console.log(`  total rows visible:        ${countAll.count ?? "ERROR"}`);
  if (countAll.error) console.log(`  total error:               ${countAll.error.message}`);

  const countNotCancelled = await client
    .from("sessions")
    .select("id", { count: "exact", head: true })
    .eq("is_cancelled", false);
  console.log(`  with is_cancelled=false:   ${countNotCancelled.count ?? "ERROR"}`);

  const countUpcoming = await client
    .from("sessions")
    .select("id", { count: "exact", head: true })
    .eq("is_cancelled", false)
    .gte("starts_at", new Date().toISOString());
  console.log(`  upcoming (the page query): ${countUpcoming.count ?? "ERROR"}`);
  if (countUpcoming.error) console.log(`  upcoming error:            ${countUpcoming.error.message}`);

  const sample = await client
    .from("sessions")
    .select("id, title, sport_id, status, is_cancelled, starts_at, host_id")
    .order("created_at", { ascending: false })
    .limit(5);
  console.log(`  most recent 5 rows:`);
  if (sample.error) {
    console.log(`    ERROR: ${sample.error.message}`);
  } else if (!sample.data || sample.data.length === 0) {
    console.log(`    (none)`);
  } else {
    for (const row of sample.data) {
      const inPast = new Date(row.starts_at) < new Date();
      console.log(
        `    • ${row.id.slice(0, 8)}… ${row.sport_id.padEnd(10)} ` +
          `cancelled=${row.is_cancelled} status=${row.status} ` +
          `starts=${row.starts_at} ${inPast ? "(PAST)" : "(future)"}`
      );
    }
  }
  console.log("");
}

await probe("ANON KEY (what the website uses)", anonKey);
await probe("SERVICE ROLE KEY (bypasses RLS)", serviceKey);
