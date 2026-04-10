// app/admin/page.tsx — Dashboard overview
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { onAuthChange } from "@/lib/auth";
import { PageHeader, StatCard, SectionNote } from "@/components/admin/AdminUI";

interface Stats {
  totalUsers: number;
  sessionsLive: number;
  newUsersToday: number;
  openReports: number;
  totalRevenuePence: number;
  sessionsThisWeek: number;
}

export default function AdminOverview() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthChange((user) => {
      if (!user) { router.push("/admin/login"); return; }
      fetchStats();
    });
    return unsub;
  }, [router]);

  async function fetchStats() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const [usersRes, liveRes, todayRes, reportsRes, revenueRes, weekSessionsRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("sessions").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", today.toISOString()),
        supabase.from("user_reports").select("id", { count: "exact", head: true }).eq("status", "open"),
        supabase.from("wallet_transactions").select("amount_pence").eq("type", "deposit"),
        supabase.from("sessions").select("id", { count: "exact", head: true }).gte("created_at", weekAgo.toISOString()),
      ]);

      const revenue = (revenueRes.data ?? []).reduce((sum: number, r: { amount_pence: number }) => sum + (r.amount_pence ?? 0), 0);

      setStats({
        totalUsers: usersRes.count ?? 0,
        sessionsLive: liveRes.count ?? 0,
        newUsersToday: todayRes.count ?? 0,
        openReports: reportsRes.count ?? 0,
        totalRevenuePence: revenue,
        sessionsThisWeek: weekSessionsRes.count ?? 0,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const QUICK_LINKS = [
    { href: "/admin/users", label: "User Management", desc: "Search & manage all accounts" },
    { href: "/admin/sessions", label: "Session Management", desc: "All sessions across 6 sports" },
    { href: "/admin/payments", label: "Payments & Financials", desc: "Transaction ledger & payouts" },
    { href: "/admin/moderation", label: "Moderation Queue", desc: "Reports & strikes", alert: stats?.openReports },
    { href: "/admin/reviews", label: "Reviews & Trust", desc: "Ratings & reliability scores" },
    { href: "/admin/hosts", label: "Hosts", desc: "Pro accounts & earnings" },
    { href: "/admin/notifications", label: "Notifications", desc: "Push & email comms" },
    { href: "/admin/content", label: "Content", desc: "Posts, stories & media" },
    { href: "/admin/analytics", label: "Analytics", desc: "Platform growth & health" },
    { href: "/admin/posts", label: "Blog Posts", desc: "Marketing site blog" },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader title="Overview" desc="Platform pulse at a glance" />

      {loading ? (
        <div className="text-white/30 text-sm font-[family-name:var(--font-dm-sans)]">Loading stats…</div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            <StatCard label="Total Users" value={stats.totalUsers.toLocaleString()} />
            <StatCard label="Sessions Live" value={stats.sessionsLive} accent={stats.sessionsLive > 0} />
            <StatCard label="New Today" value={stats.newUsersToday} />
            <StatCard label="Open Reports" value={stats.openReports} accent={stats.openReports > 0} sub={stats.openReports > 0 ? "Need attention" : undefined} />
            <StatCard label="Sessions This Week" value={stats.sessionsThisWeek} />
            <StatCard label="Total Revenue" value={`£${(stats.totalRevenuePence / 100).toFixed(2)}`} accent />
          </div>

          {stats.openReports > 0 && (
            <SectionNote>
              ⚠️ {stats.openReports} open moderation report{stats.openReports !== 1 ? "s" : ""} pending review.{" "}
              <Link href="/admin/moderation" className="text-[#B6FF00] underline underline-offset-2">Go to Moderation →</Link>
            </SectionNote>
          )}
        </>
      ) : null}

      <h2 className="text-xs font-medium text-white/30 uppercase tracking-widest mb-4 font-[family-name:var(--font-dm-sans)]">
        Admin Sections
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {QUICK_LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="relative flex flex-col gap-1 p-4 rounded-xl border border-white/8 bg-white/3 hover:bg-white/5 hover:border-white/15 transition-all group"
          >
            {l.alert && l.alert > 0 ? (
              <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-red-400" />
            ) : null}
            <span className="text-sm font-medium text-white group-hover:text-[#B6FF00] transition-colors font-[family-name:var(--font-dm-sans)]">
              {l.label}
            </span>
            <span className="text-xs text-white/40 font-[family-name:var(--font-dm-sans)]">{l.desc}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
