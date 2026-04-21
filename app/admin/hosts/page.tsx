// app/admin/hosts/page.tsx — Hosts / Organisers
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  PageHeader, AdminTable, Tr, Td, Badge, FilterBar, SearchInput, ActionButton, StatCard,
} from "@/components/admin/AdminUI";

type AccountTier = "free" | "pro";

interface Host {
  id: string;
  full_name: string | null;
  display_name: string | null;
  email: string | null;
  sessions_hosted: number | null;
  host_rating_avg: number | null;
  host_rating_count: number | null;
  reliability_score: number | null;
  account_tier: AccountTier | null;
  tier_expires_at: string | null;
  is_verified: boolean | null;
  hosting_banned_until: string | null;
  hosting_ban_reason: string | null;
  stripe_onboarded: boolean | null;
  stripe_account_id: string | null;
  total_earned_pence: number | null;
  balance_pence: number | null;
  pending_pence: number | null;
  cancel_strikes: number;
  bank_last4: string | null;
}

export default function HostsPage() {
  const [hosts, setHosts] = useState<Host[]>([]);
  const [filtered, setFiltered] = useState<Host[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => { fetchHosts(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(q ? hosts.filter((h) =>
      h.full_name?.toLowerCase().includes(q) ||
      h.display_name?.toLowerCase().includes(q) ||
      h.email?.toLowerCase().includes(q)
    ) : hosts);
  }, [search, hosts]);

  async function fetchHosts() {
    setLoading(true);

    const { data: profileData } = await supabase
      .from("profiles")
      .select(`id, full_name, display_name, email, sessions_hosted,
               host_rating_avg, host_rating_count, reliability_score,
               account_tier, tier_expires_at, is_verified,
               hosting_banned_until, hosting_ban_reason`)
      .gt("sessions_hosted", 0)
      .order("sessions_hosted", { ascending: false })
      .limit(200);

    if (!profileData?.length) { setHosts([]); setFiltered([]); setLoading(false); return; }

    const ids = profileData.map((p: { id: string }) => p.id);

    const [walletRes, strikeRes] = await Promise.all([
      supabase.from("wallets")
        .select("user_id, balance_pence, pending_pence, total_earned, stripe_onboarded, stripe_account_id, bank_account_last4")
        .in("user_id", ids),
      supabase.from("host_cancel_strikes").select("user_id").in("user_id", ids),
    ]);

    const walletMap = Object.fromEntries(
      (walletRes.data ?? []).map((w: { user_id: string; balance_pence: number; pending_pence: number; total_earned: number; stripe_onboarded: boolean; stripe_account_id: string | null; bank_account_last4: string | null }) => [w.user_id, w])
    );

    const strikeCount = (strikeRes.data ?? []).reduce((acc: Record<string, number>, s: { user_id: string }) => {
      acc[s.user_id] = (acc[s.user_id] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const merged: Host[] = (profileData as Omit<Host, "stripe_onboarded" | "stripe_account_id" | "total_earned_pence" | "balance_pence" | "pending_pence" | "cancel_strikes" | "bank_last4">[]).map((p) => ({
      ...p,
      stripe_onboarded: walletMap[p.id]?.stripe_onboarded ?? false,
      stripe_account_id: walletMap[p.id]?.stripe_account_id ?? null,
      total_earned_pence: walletMap[p.id]?.total_earned ?? 0,
      balance_pence: walletMap[p.id]?.balance_pence ?? 0,
      pending_pence: walletMap[p.id]?.pending_pence ?? 0,
      bank_last4: walletMap[p.id]?.bank_account_last4 ?? null,
      cancel_strikes: strikeCount[p.id] ?? 0,
    }));

    setHosts(merged);
    setFiltered(merged);
    setLoading(false);
  }

  async function toggleTier(host: Host) {
    setActionId(host.id);
    const newTier: AccountTier = host.account_tier === "pro" ? "free" : "pro";
    const patch = newTier === "pro"
      ? { account_tier: newTier, tier_expires_at: new Date(Date.now() + 30 * 86400000).toISOString() }
      : { account_tier: newTier, tier_expires_at: null };
    await supabase.from("profiles").update(patch).eq("id", host.id);
    setHosts((prev) => prev.map((h) => h.id === host.id ? { ...h, ...patch } : h));
    setActionId(null);
  }

  async function toggleHostBan(host: Host) {
    const currentlyBanned = host.hosting_banned_until && new Date(host.hosting_banned_until) > new Date();
    if (currentlyBanned) {
      if (!confirm("Lift hosting ban?")) return;
      setActionId(host.id);
      await supabase.from("profiles").update({ hosting_banned_until: null, hosting_ban_reason: null }).eq("id", host.id);
      setHosts((prev) => prev.map((h) => h.id === host.id ? { ...h, hosting_banned_until: null, hosting_ban_reason: null } : h));
    } else {
      const days = window.prompt("Ban from hosting for how many days?", "30");
      if (!days) return;
      const n = parseInt(days, 10);
      if (isNaN(n) || n <= 0) return;
      const reason = window.prompt("Reason:", "Repeated cancellations");
      if (reason == null) return;
      const until = new Date(Date.now() + n * 86400000).toISOString();
      setActionId(host.id);
      await supabase.from("profiles").update({ hosting_banned_until: until, hosting_ban_reason: reason }).eq("id", host.id);
      setHosts((prev) => prev.map((h) => h.id === host.id ? { ...h, hosting_banned_until: until, hosting_ban_reason: reason } : h));
    }
    setActionId(null);
  }

  const proHosts = hosts.filter((h) => h.account_tier === "pro").length;
  const stripeOnboarded = hosts.filter((h) => h.stripe_onboarded).length;
  const bannedHosts = hosts.filter((h) => h.hosting_banned_until && new Date(h.hosting_banned_until) > new Date()).length;
  const totalEarned = hosts.reduce((s, h) => s + (h.total_earned_pence ?? 0), 0);
  const totalBalance = hosts.reduce((s, h) => s + (h.balance_pence ?? 0), 0);

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader title="Hosts" desc="Organiser accounts, Pro tier, Stripe onboarding, earnings." />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard label="Total Hosts" value={hosts.length} />
        <StatCard label="Pro Accounts" value={proHosts} accent />
        <StatCard label="Stripe Onboarded" value={stripeOnboarded} />
        <StatCard label="Host-Banned" value={bannedHosts} accent={bannedHosts > 0} />
        <StatCard label="Total Earnings" value={`£${(totalEarned / 100).toFixed(2)}`} accent sub={`£${(totalBalance / 100).toFixed(2)} in wallets`} />
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search host name or email…" />
        <span className="text-xs text-white/30 font-[family-name:var(--font-dm-sans)]">{filtered.length} hosts</span>
      </FilterBar>

      {loading ? (
        <div className="text-white/30 text-sm py-16 text-center">Loading…</div>
      ) : (
        <AdminTable
          headers={["Host", "Sessions", "Avg Rating", "Earned", "Balance", "Pending", "Bank", "Stripe", "Tier", "Strikes", "Actions"]}
          isEmpty={filtered.length === 0}
          empty="No hosts yet."
        >
          {filtered.map((h, i) => {
            const banned = h.hosting_banned_until && new Date(h.hosting_banned_until) > new Date();
            return (
              <Tr key={h.id} last={i === filtered.length - 1}>
                <Td>
                  <div className="flex items-center gap-1.5">
                    <p className="font-medium text-white">{h.display_name ?? h.full_name ?? "—"}</p>
                    {h.is_verified && <span className="text-[#B6FF00] text-xs">✓</span>}
                    {banned && <Badge label="Banned" color="red" />}
                  </div>
                  <p className="text-white/30 text-xs mt-0.5 font-mono">{h.email ?? ""}</p>
                </Td>
                <Td dim>{h.sessions_hosted ?? 0}</Td>
                <Td dim>
                  {h.host_rating_avg != null
                    ? `${h.host_rating_avg.toFixed(1)} (${h.host_rating_count ?? 0})`
                    : "—"}
                </Td>
                <Td><span className="text-[#B6FF00]/80">£{((h.total_earned_pence ?? 0) / 100).toFixed(2)}</span></Td>
                <Td dim>£{((h.balance_pence ?? 0) / 100).toFixed(2)}</Td>
                <Td dim>£{((h.pending_pence ?? 0) / 100).toFixed(2)}</Td>
                <Td dim>{h.bank_last4 ? `••${h.bank_last4}` : "—"}</Td>
                <Td>
                  <Badge
                    label={h.stripe_onboarded ? "Yes" : "No"}
                    color={h.stripe_onboarded ? "green" : "gray"}
                  />
                </Td>
                <Td>
                  <Badge label={h.account_tier === "pro" ? "Pro" : "Free"} color={h.account_tier === "pro" ? "blue" : "gray"} />
                </Td>
                <Td>
                  {h.cancel_strikes > 0 ? (
                    <Badge label={String(h.cancel_strikes)} color={h.cancel_strikes >= 3 ? "red" : "yellow"} />
                  ) : (
                    <span className="text-white/20 text-xs">—</span>
                  )}
                </Td>
                <Td>
                  <div className="flex items-center gap-3 justify-end whitespace-nowrap">
                    <ActionButton
                      onClick={() => toggleTier(h)}
                      label={actionId === h.id ? "…" : h.account_tier === "pro" ? "Revoke Pro" : "Grant Pro"}
                      variant={h.account_tier === "pro" ? "danger" : "primary"}
                    />
                    <ActionButton
                      onClick={() => toggleHostBan(h)}
                      label={banned ? "Lift Ban" : "Ban Hosting"}
                      variant={banned ? "primary" : "danger"}
                    />
                  </div>
                </Td>
              </Tr>
            );
          })}
        </AdminTable>
      )}
    </div>
  );
}
