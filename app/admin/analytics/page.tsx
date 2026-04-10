// app/admin/analytics/page.tsx — Analytics & Platform Health
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  PageHeader, StatCard, SectionNote
} from "@/components/admin/AdminUI";

interface SportStat {
  sport: string;
  count: number;
  revenue_pence: number;
}

interface DailyStat {
  date: string;
  signups: number;
  sessions: number;
  revenue_pence: number;
}

interface FunnelStat {
  sport: string;
  views: number;
  joins: number;
  fill_rate: number;
}

function Bar({ value, max, color = "#B6FF00" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-white/8 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs text-white/40 w-8 text-right font-[family-name:var(--font-dm-sans)]">{value}</span>
    </div>
  );
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [sportStats, setSportStats] = useState<SportStat[]>([]);
  const [daily, setDaily] = useState<DailyStat[]>([]);
  const [funnel, setFunnel] = useState<FunnelStat[]>([]);
  const [totals, setTotals] = useState({ users: 0, sessions: 0, revenue: 0, retention: 0 });

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

      const [userRes, sessionRes, txRes, viewRes, participantRes, retentionRes] = await Promise.all([
        supabase.from("profiles").select("id, created_at").order("created_at", { ascending: false }).limit(2000),
        supabase.from("sessions").select("id, sport, status, created_at").limit(2000),
        supabase.from("wallet_transactions").select("amount_pence, created_at").eq("type", "deposit").limit(2000),
        supabase.from("session_views").select("sport, session_id").limit(5000),
        supabase.from("event_participants").select("session_id, sessions:session_id(sport)").limit(5000),
        supabase.from("event_participants")
          .select("user_id")
          .gte("created_at", thirtyDaysAgo),
      ]);

      const users = userRes.data ?? [];
      const sessions = sessionRes.data ?? [];
      const txs = txRes.data ?? [];

      // Sport stats
      const sportMap: Record<string, SportStat> = {};
      sessions.forEach((s: { id: string; sport: string | null; status: string; created_at: string }) => {
        if (!s.sport) return;
        if (!sportMap[s.sport]) sportMap[s.sport] = { sport: s.sport, count: 0, revenue_pence: 0 };
        sportMap[s.sport].count++;
      });
      setSportStats(Object.values(sportMap).sort((a, b) => b.count - a.count));

      // Daily signups (last 14 days)
      const dailyMap: Record<string, DailyStat> = {};
      const last14 = Array.from({ length: 14 }, (_, i) => {
        const d = new Date(Date.now() - i * 86400000);
        return d.toISOString().slice(0, 10);
      }).reverse();
      last14.forEach((d) => { dailyMap[d] = { date: d, signups: 0, sessions: 0, revenue_pence: 0 }; });
      users.forEach((u: { id: string; created_at: string }) => {
        const d = u.created_at.slice(0, 10);
        if (dailyMap[d]) dailyMap[d].signups++;
      });
      sessions.forEach((s: { id: string; sport: string | null; status: string; created_at: string }) => {
        const d = s.created_at.slice(0, 10);
        if (dailyMap[d]) dailyMap[d].sessions++;
      });
      txs.forEach((t: { amount_pence: number; created_at: string }) => {
        const d = t.created_at.slice(0, 10);
        if (dailyMap[d]) dailyMap[d].revenue_pence += t.amount_pence;
      });
      setDaily(Object.values(dailyMap));

      // Funnel by sport
      const viewsBySport: Record<string, number> = {};
      (viewRes.data ?? []).forEach((v: { sport?: string | null; session_id: string }) => {
        const sport = v.sport ?? "unknown";
        viewsBySport[sport] = (viewsBySport[sport] ?? 0) + 1;
      });
      const joinsBySport: Record<string, number> = {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (participantRes.data ?? []).forEach((p: any) => {
        const sessObj = Array.isArray(p.sessions) ? p.sessions[0] : p.sessions;
        const sport = sessObj?.sport ?? "unknown";
        joinsBySport[sport] = (joinsBySport[sport] ?? 0) + 1;
      });
      const funnelData = Object.keys({ ...viewsBySport, ...joinsBySport }).map((sport) => {
        const views = viewsBySport[sport] ?? 0;
        const joins = joinsBySport[sport] ?? 0;
        return { sport, views, joins, fill_rate: views > 0 ? Math.round((joins / views) * 100) : 0 };
      }).sort((a, b) => b.views - a.views);
      setFunnel(funnelData);

      // Retention: users with >1 session in last 30 days
      const userCounts: Record<string, number> = {};
      (retentionRes.data ?? []).forEach((p: { user_id: string }) => {
        userCounts[p.user_id] = (userCounts[p.user_id] ?? 0) + 1;
      });
      const retained = Object.values(userCounts).filter((c) => c > 1).length;

      const totalRevenue = txs.reduce((s: number, t: { amount_pence: number }) => s + t.amount_pence, 0);
      setTotals({ users: users.length, sessions: sessions.length, revenue: totalRevenue, retention: retained });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const maxSportCount = sportStats[0]?.count ?? 1;
  const maxDaily = Math.max(...daily.map((d) => d.signups), 1);
  const maxRevDaily = Math.max(...daily.map((d) => d.revenue_pence), 1);

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader title="Analytics" desc="Platform health and growth metrics." />

      {loading ? (
        <div className="text-white/30 text-sm py-16 text-center">Loading analytics…</div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <StatCard label="Total Users" value={totals.users.toLocaleString()} />
            <StatCard label="Total Sessions" value={totals.sessions.toLocaleString()} />
            <StatCard label="Total Revenue" value={`£${(totals.revenue / 100).toFixed(2)}`} accent />
            <StatCard label="30-day Retention" value={totals.retention} sub="Attended 2+ sessions" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
            {/* Sessions by sport */}
            <div className="border border-white/8 rounded-2xl p-6">
              <h3 className="text-xs font-medium text-white/40 uppercase tracking-widest mb-5 font-[family-name:var(--font-dm-sans)]">
                Sessions by Sport
              </h3>
              <div className="space-y-3">
                {sportStats.map((s) => (
                  <div key={s.sport}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-white capitalize font-[family-name:var(--font-dm-sans)]">{s.sport}</span>
                    </div>
                    <Bar value={s.count} max={maxSportCount} />
                  </div>
                ))}
                {sportStats.length === 0 && <p className="text-white/30 text-sm">No session data.</p>}
              </div>
            </div>

            {/* Conversion funnel */}
            <div className="border border-white/8 rounded-2xl p-6">
              <h3 className="text-xs font-medium text-white/40 uppercase tracking-widest mb-5 font-[family-name:var(--font-dm-sans)]">
                Views → Joins (by Sport)
              </h3>
              <div className="space-y-4">
                {funnel.map((f) => (
                  <div key={f.sport}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-white capitalize font-[family-name:var(--font-dm-sans)]">{f.sport}</span>
                      <span className="text-xs text-white/40 font-[family-name:var(--font-dm-sans)]">
                        {f.fill_rate}% conversion · {f.joins}/{f.views}
                      </span>
                    </div>
                    <div className="h-2 bg-white/8 rounded-full overflow-hidden relative">
                      <div className="h-full rounded-full bg-white/20 absolute left-0" style={{ width: "100%" }} />
                      <div className="h-full rounded-full bg-[#B6FF00] absolute left-0 transition-all" style={{ width: `${f.fill_rate}%` }} />
                    </div>
                  </div>
                ))}
                {funnel.length === 0 && <p className="text-white/30 text-sm">No funnel data.</p>}
              </div>
            </div>
          </div>

          {/* Daily chart (last 14 days) */}
          <div className="border border-white/8 rounded-2xl p-6 mb-8">
            <h3 className="text-xs font-medium text-white/40 uppercase tracking-widest mb-5 font-[family-name:var(--font-dm-sans)]">
              Daily Signups — Last 14 Days
            </h3>
            <div className="space-y-2">
              {daily.map((d) => (
                <div key={d.date} className="flex items-center gap-4">
                  <span className="text-xs text-white/30 w-20 font-mono shrink-0">
                    {new Date(d.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                  </span>
                  <div className="flex-1">
                    <Bar value={d.signups} max={maxDaily} />
                  </div>
                  <span className="text-xs text-[#B6FF00]/60 w-16 text-right font-[family-name:var(--font-dm-sans)] shrink-0">
                    £{(d.revenue_pence / 100).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <SectionNote>
            Analytics are computed client-side from Supabase queries. For deeper insights, consider setting up a Supabase Edge Function or connecting to a BI tool like Metabase.
          </SectionNote>
        </>
      )}
    </div>
  );
}
