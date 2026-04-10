// app/admin/hosts/page.tsx — Hosts / Organisers
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  PageHeader, AdminTable, Tr, Td, Badge, FilterBar, SearchInput, ActionButton, StatCard
} from "@/components/admin/AdminUI";

interface Host {
  id: string;
  full_name: string | null;
  email: string | null;
  sessions_hosted: number | null;
  host_rating_avg: number | null;
  host_rating_count: number | null;
  reliability_score: number | null;
  is_pro: boolean | null;
  stripe_onboarded: boolean | null;
  total_earned_pence: number | null;
  balance_pence: number | null;
  cancel_strikes: number;
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
    setFiltered(q ? hosts.filter((h) => h.full_name?.toLowerCase().includes(q) || h.email?.toLowerCase().includes(q)) : hosts);
  }, [search, hosts]);

  async function fetchHosts() {
    setLoading(true);

    const { data: profileData } = await supabase
      .from("profiles")
      .select("id, full_name, email, sessions_hosted, host_rating_avg, host_rating_count, reliability_score, is_pro")
      .gt("sessions_hosted", 0)
      .order("sessions_hosted", { ascending: false })
      .limit(100);

    if (!profileData?.length) { setLoading(false); return; }

    const ids = profileData.map((p: { id: string }) => p.id);

    const [walletRes, strikeRes] = await Promise.all([
      supabase.from("wallets").select("user_id, balance_pence, total_earned_pence, stripe_onboarded").in("user_id", ids),
      supabase.from("host_cancel_strikes").select("host_id").in("host_id", ids),
    ]);

    const walletMap = Object.fromEntries((walletRes.data ?? []).map((w: { user_id: string; balance_pence: number; total_earned_pence: number; stripe_onboarded: boolean }) => [w.user_id, w]));
    const strikeCount = (strikeRes.data ?? []).reduce((acc: Record<string, number>, s: { host_id: string }) => {
      acc[s.host_id] = (acc[s.host_id] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const merged: Host[] = (profileData as { id: string; full_name: string | null; email: string | null; sessions_hosted: number | null; host_rating_avg: number | null; host_rating_count: number | null; reliability_score: number | null; is_pro: boolean | null }[]).map((p) => ({
      ...p,
      stripe_onboarded: walletMap[p.id]?.stripe_onboarded ?? false,
      total_earned_pence: walletMap[p.id]?.total_earned_pence ?? 0,
      balance_pence: walletMap[p.id]?.balance_pence ?? 0,
      cancel_strikes: strikeCount[p.id] ?? 0,
    }));

    setHosts(merged);
    setFiltered(merged);
    setLoading(false);
  }

  async function togglePro(host: Host) {
    setActionId(host.id);
    const newVal = !host.is_pro;
    await supabase.from("profiles").update({ is_pro: newVal }).eq("id", host.id);
    setHosts((prev) => prev.map((h) => h.id === host.id ? { ...h, is_pro: newVal } : h));
    setActionId(null);
  }

  const proHosts = hosts.filter((h) => h.is_pro).length;
  const stripeOnboarded = hosts.filter((h) => h.stripe_onboarded).length;
  const totalEarned = hosts.reduce((s, h) => s + (h.total_earned_pence ?? 0), 0);

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title="Hosts" desc="Organiser accounts, Pro status, and earnings." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Hosts" value={hosts.length} />
        <StatCard label="Pro Accounts" value={proHosts} accent />
        <StatCard label="Stripe Onboarded" value={stripeOnboarded} />
        <StatCard label="Total Host Earnings" value={`£${(totalEarned / 100).toFixed(2)}`} accent />
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search host name or email…" />
        <span className="text-xs text-white/30 font-[family-name:var(--font-dm-sans)]">{filtered.length} hosts</span>
      </FilterBar>

      {loading ? (
        <div className="text-white/30 text-sm py-16 text-center">Loading…</div>
      ) : (
        <AdminTable
          headers={["Host", "Sessions", "Avg Rating", "Earned", "Balance", "Stripe", "Pro", "Strikes", ""]}
          isEmpty={filtered.length === 0}
          empty="No hosts yet."
        >
          {filtered.map((h, i) => (
            <Tr key={h.id} last={i === filtered.length - 1}>
              <Td>
                <p className="font-medium text-white">{h.full_name ?? "—"}</p>
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
              <Td>
                <Badge
                  label={h.stripe_onboarded ? "Yes" : "No"}
                  color={h.stripe_onboarded ? "green" : "gray"}
                />
              </Td>
              <Td>
                <Badge label={h.is_pro ? "Pro" : "Standard"} color={h.is_pro ? "blue" : "gray"} />
              </Td>
              <Td>
                {h.cancel_strikes > 0 ? (
                  <Badge label={String(h.cancel_strikes)} color={h.cancel_strikes >= 3 ? "red" : "yellow"} />
                ) : (
                  <span className="text-white/20 text-xs">—</span>
                )}
              </Td>
              <Td>
                <ActionButton
                  onClick={() => togglePro(h)}
                  label={actionId === h.id ? "…" : h.is_pro ? "Revoke Pro" : "Grant Pro"}
                  variant={h.is_pro ? "danger" : "primary"}
                />
              </Td>
            </Tr>
          ))}
        </AdminTable>
      )}
    </div>
  );
}
