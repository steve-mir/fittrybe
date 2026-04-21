// app/admin/analytics/page.tsx — Analytics & Platform Health
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { PageHeader, StatCard, SectionNote } from "@/components/admin/AdminUI";

interface SportStat {
  sport: string;
  sessions: number;
  views: number;
  joins: number;
  fill_rate: number;
}

interface DailyStat {
  date: string;
  signups: number;
  sessions: number;
  revenue_pence: number;
}

function Bar({ value, max, color = "#B6FF00" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-white/8 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs text-white/40 w-10 text-right font-[family-name:var(--font-dm-sans)]">{value}</span>
    </div>
  );
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [sportStats, setSportStats] = useState<SportStat[]>([]);
  const [daily, setDaily] = useState<DailyStat[]>([]);
  const [totals, setTotals] = useState({
    users: 0,
    sessions: 0,
    revenue: 0,
    completed: 0,
    cancelled: 0,
    retention: 0,
    avgFillRate: 0,
  });

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

      const [userRes, sessionRes, txRes, participantRes, retentionRes] = await Promise.all([
        supabase.from("profiles")
          .select("id, created_at")
          .order("created_at", { ascending: false })
          .limit(5000),
        supabase.from("sessions")
          .select("id, sport_id, status, created_at, views_count, participants_count, spots_left")
          .limit(5000),
        supabase.from("wallet_transactions")
          .select("amount_pence, created_at")
          .eq("type", "deposit")
          .limit(5000),
        supabase.from("event_participants")
          .select("session_id, user_id, sessions:session_id(sport_id)")
          .limit(10000),
        supabase.from("event_participants")
          .select("user_id")
          .gte("created_at", thirtyDaysAgo),
      ]);

      const users = userRes.data ?? [];
      const sessions = (sessionRes.data ?? []) as {
        id: string; sport_id: string | null; status: string; created_at: string;
        views_count: number | null; participants_count: number | null; spots_left: number | null;
      }[];
      const txs = txRes.data ?? [];

      // Build sport stats
      const sportAgg: Record<string, { sessions: number; views: number; joins: number }> = {};
      sessions.forEach((s) => {
        if (!s.sport_id) return;
        if (!sportAgg[s.sport_id]) sportAgg[s.sport_id] = { sessions: 0, views: 0, joins: 0 };
        sportAgg[s.sport_id].sessions += 1;
        sportAgg[s.sport_id].views += s.views_count ?? 0;
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (participantRes.data ?? []).forEach((p: any) => {
        const sessObj = Array.isArray(p.sessions) ? p.sessions[0] : p.sessions;
        const sport = sessObj?.sport_id ?? "unknown";
        if (!sportAgg[sport]) sportAgg[sport] = { sessions: 0, views: 0, joins: 0 };
        sportAgg[sport].joins += 1;
      });

      const statsArr: SportStat[] = Object.entries(sportAgg)
        .map(([sport, agg]) => ({
          sport,
          sessions: agg.sessions,
          views: agg.views,
          joins: agg.joins,
          fill_rate: agg.views > 0 ? Math.round((agg.joins / agg.views) * 100) : 0,
        }))
        .sort((a, b) => b.sessions - a.sessions);
      setSportStats(statsArr);

      // Daily (last 14 days)
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
      sessions.forEach((s) => {
        const d = s.created_at.slice(0, 10);
        if (dailyMap[d]) dailyMap[d].sessions++;
      });
      txs.forEach((t: { amount_pence: number; created_at: string }) => {
        const d = t.created_at.slice(0, 10);
        if (dailyMap[d]) dailyMap[d].revenue_pence += t.amount_pence;
      });
      setDaily(Object.values(dailyMap));

      // Fill rate (sessions with capacity data)
      const filledSessions = sessions.filter((s) =>
        s.participants_count != null && s.spots_left != null
      );
      const avgFill = filledSessions.length
        ? Math.round(
            filledSessions.reduce((sum, s) => {
              const total = (s.participants_count ?? 0) + (s.spots_left ?? 0);
              return sum + (total > 0 ? ((s.participants_count ?? 0) / total) * 100 : 0);
            }, 0) / filledSessions.length
          )
        : 0;

      // Retention
      const userCounts: Record<string, number> = {};
      (retentionRes.data ?? []).forEach((p: { user_id: string }) => {
        userCounts[p.user_id] = (userCounts[p.user_id] ?? 0) + 1;
      });
      const retained = Object.values(userCounts).filter((c) => c > 1).length;

      const totalRevenue = txs.reduce((s: number, t: { amount_pence: number }) => s + t.amount_pence, 0);
      const completed = sessions.filter((s) => s.status === "completed").length;
      const cancelled = sessions.filter((s) => s.status === "cancelled").length;

      setTotals({
        users: users.length,
        sessions: sessions.length,
        revenue: totalRevenue,
        completed,
        cancelled,
        retention: retained,
        avgFillRate: avgFill,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const maxSport = sportStats[0]?.sessions ?? 1;
  const maxDaily = Math.max(...daily.map((d) => d.signups), 1);

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader title="Analytics" desc="Platform health and growth metrics." />

      {loading ? (
        <div className="text-white/30 text-sm py-16 text-center">Loading analytics…</div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total Users" value={totals.users.toLocaleString()} />
            <StatCard label="Total Sessions" value={totals.sessions.toLocaleString()} />
            <StatCard label="Completed" value={totals.completed.toLocaleString()} />
            <StatCard label="Cancelled" value={totals.cancelled.toLocaleString()} accent={totals.cancelled > 0} />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            <StatCard label="Total Revenue" value={`£${(totals.revenue / 100).toFixed(2)}`} accent />
            <StatCard label="Avg Fill Rate" value={`${totals.avgFillRate}%`} sub="Participants / capacity" />
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
                      <span className="text-sm font-medium text-white capitalize font-[family-name:var(--font-dm-sans)]">
                        {s.sport.replace(/_/g, " ")}
                      </span>
                    </div>
                    <Bar value={s.sessions} max={maxSport} />
                  </div>
                ))}
                {sportStats.length === 0 && <p className="text-white/30 text-sm">No session data.</p>}
              </div>
            </div>

            {/* Conversion funnel by sport */}
            <div className="border border-white/8 rounded-2xl p-6">
              <h3 className="text-xs font-medium text-white/40 uppercase tracking-widest mb-5 font-[family-name:var(--font-dm-sans)]">
                Views → Joins (by Sport)
              </h3>
              <div className="space-y-4">
                {sportStats.map((f) => (
                  <div key={f.sport}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-white capitalize font-[family-name:var(--font-dm-sans)]">
                        {f.sport.replace(/_/g, " ")}
                      </span>
                      <span className="text-xs text-white/40 font-[family-name:var(--font-dm-sans)]">
                        {f.fill_rate}% · {f.joins}/{f.views}
                      </span>
                    </div>
                    <div className="h-2 bg-white/8 rounded-full overflow-hidden relative">
                      <div className="h-full rounded-full bg-white/20 absolute left-0" style={{ width: "100%" }} />
                      <div className="h-full rounded-full bg-[#B6FF00] absolute left-0 transition-all" style={{ width: `${Math.min(100, f.fill_rate)}%` }} />
                    </div>
                  </div>
                ))}
                {sportStats.length === 0 && <p className="text-white/30 text-sm">No funnel data.</p>}
              </div>
            </div>
          </div>

          {/* Daily chart (last 14 days) */}
          <div className="border border-white/8 rounded-2xl p-6 mb-8">
            <h3 className="text-xs font-medium text-white/40 uppercase tracking-widest mb-5 font-[family-name:var(--font-dm-sans)]">
              Daily Signups · Last 14 Days
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
                  <span className="text-xs text-white/40 w-14 text-right font-[family-name:var(--font-dm-sans)] shrink-0">
                    {d.sessions} sess
                  </span>
                  <span className="text-xs text-[#B6FF00]/60 w-16 text-right font-[family-name:var(--font-dm-sans)] shrink-0">
                    £{(d.revenue_pence / 100).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <SectionNote>
            Analytics are computed client-side from Supabase queries. For faster large-volume analytics, consider materialised views or a BI tool connected via a read-only Supabase role.
          </SectionNote>
        </>
      )}
    </div>
  );
}
