// app/admin/reviews/page.tsx — Reviews & Trust Scores
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  PageHeader, AdminTable, Tr, Td, Badge, FilterBar, SearchInput, ActionButton, StatCard
} from "@/components/admin/AdminUI";

interface Review {
  id: string;
  session_id: string;
  reviewer_id: string;
  host_id: string | null;
  host_rating: number | null;
  session_rating: number | null;
  venue_rating: number | null;
  host_comment: string | null;
  created_at: string;
  reviewer_name: string | null;
  host_name: string | null;
}

interface HostLeaderboard {
  id: string;
  full_name: string | null;
  host_rating_avg: number | null;
  host_rating_count: number | null;
  sessions_hosted: number | null;
}

function Stars({ value }: { value: number | null }) {
  if (value == null) return <span className="text-white/20">—</span>;
  const filled = Math.round(value);
  return (
    <span className="text-sm">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < filled ? "text-[#B6FF00]" : "text-white/15"}>★</span>
      ))}
      <span className="text-white/40 text-xs ml-1">{value.toFixed(1)}</span>
    </span>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [leaderboard, setLeaderboard] = useState<HostLeaderboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"reviews" | "hosts" | "lowReliability">("reviews");
  const [search, setSearch] = useState("");
  const [lowReliabilityUsers, setLowReliabilityUsers] = useState<{ id: string; full_name: string | null; reliability_score: number | null }[]>([]);
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [revRes, hostRes, lowRelRes] = await Promise.all([
      supabase
        .from("session_reviews")
        .select("id, session_id, reviewer_id, host_id, host_rating, session_rating, venue_rating, host_comment, created_at, reviewer:reviewer_id(full_name), host:host_id(full_name)")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("profiles")
        .select("id, full_name, host_rating_avg, host_rating_count, sessions_hosted")
        .gt("sessions_hosted", 0)
        .order("host_rating_avg", { ascending: false })
        .limit(50),
      supabase
        .from("profiles")
        .select("id, full_name, reliability_score")
        .lt("reliability_score", 50)
        .order("reliability_score", { ascending: true })
        .limit(100),
    ]);

    setReviews((revRes.data ?? []).map((r: Record<string, unknown>) => ({
      ...r,
      reviewer_name: (r.reviewer as { full_name: string } | null)?.full_name ?? null,
      host_name: (r.host as { full_name: string } | null)?.full_name ?? null,
    })) as Review[]);
    setLeaderboard(hostRes.data as HostLeaderboard[] ?? []);
    setLowReliabilityUsers(lowRelRes.data ?? []);
    setLoading(false);
  }

  async function deleteReview(id: string) {
    if (!confirm("Remove this review?")) return;
    setActionId(id);
    await supabase.from("session_reviews").delete().eq("id", id);
    setReviews((prev) => prev.filter((r) => r.id !== id));
    setActionId(null);
  }

  const filteredReviews = search
    ? reviews.filter((r) =>
        r.reviewer_name?.toLowerCase().includes(search.toLowerCase()) ||
        r.host_name?.toLowerCase().includes(search.toLowerCase()) ||
        r.host_comment?.toLowerCase().includes(search.toLowerCase())
      )
    : reviews;

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + (r.host_rating ?? 0), 0) / reviews.filter((r) => r.host_rating != null).length).toFixed(2)
    : "—";

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title="Reviews & Trust Scores" desc="Post-session reviews and host quality tracking." />

      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Reviews" value={reviews.length} />
        <StatCard label="Platform Avg Rating" value={avgRating} accent />
        <StatCard label="Low Reliability Users" value={lowReliabilityUsers.length} accent={lowReliabilityUsers.length > 0} />
      </div>

      <div className="flex gap-2 mb-6">
        {([
          { key: "reviews", label: "All Reviews" },
          { key: "hosts", label: "Host Leaderboard" },
          { key: "lowReliability", label: `Low Reliability (${lowReliabilityUsers.length})` },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium font-[family-name:var(--font-dm-sans)] transition-all ${
              tab === t.key
                ? "bg-[#B6FF00]/10 text-[#B6FF00] border border-[#B6FF00]/20"
                : "text-white/40 hover:text-white border border-white/8"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-white/30 text-sm py-16 text-center">Loading…</div>
      ) : tab === "reviews" ? (
        <>
          <FilterBar>
            <SearchInput value={search} onChange={setSearch} placeholder="Search reviewer, host, comment…" />
            <span className="text-xs text-white/30 font-[family-name:var(--font-dm-sans)]">{filteredReviews.length} reviews</span>
          </FilterBar>
          <AdminTable
            headers={["Reviewer", "Host", "Host Rating", "Session", "Venue", "Comment", ""]}
            isEmpty={filteredReviews.length === 0}
            empty="No reviews."
          >
            {filteredReviews.map((r, i) => (
              <Tr key={r.id} last={i === filteredReviews.length - 1}>
                <Td dim>{r.reviewer_name ?? "—"}</Td>
                <Td>{r.host_name ?? "—"}</Td>
                <Td><Stars value={r.host_rating} /></Td>
                <Td><Stars value={r.session_rating} /></Td>
                <Td><Stars value={r.venue_rating} /></Td>
                <Td dim>
                  <span className="line-clamp-1 max-w-[160px] block">{r.host_comment ?? "—"}</span>
                </Td>
                <Td>
                  <ActionButton onClick={() => deleteReview(r.id)} label={actionId === r.id ? "…" : "Remove"} variant="danger" />
                </Td>
              </Tr>
            ))}
          </AdminTable>
        </>
      ) : tab === "hosts" ? (
        <AdminTable headers={["Host", "Avg Rating", "# Ratings", "Sessions Hosted"]} isEmpty={leaderboard.length === 0} empty="No hosts yet.">
          {leaderboard.map((h, i) => (
            <Tr key={h.id} last={i === leaderboard.length - 1}>
              <Td>{h.full_name ?? "—"}</Td>
              <Td><Stars value={h.host_rating_avg} /></Td>
              <Td dim>{h.host_rating_count ?? 0}</Td>
              <Td dim>{h.sessions_hosted ?? 0}</Td>
            </Tr>
          ))}
        </AdminTable>
      ) : (
        <AdminTable headers={["User", "Reliability Score"]} isEmpty={lowReliabilityUsers.length === 0} empty="No low-reliability users.">
          {lowReliabilityUsers.map((u, i) => (
            <Tr key={u.id} last={i === lowReliabilityUsers.length - 1}>
              <Td>{u.full_name ?? <span className="font-mono text-xs text-white/30">{u.id.slice(0, 12)}…</span>}</Td>
              <Td>
                <Badge label={String(u.reliability_score ?? "?")} color={u.reliability_score != null && u.reliability_score < 30 ? "red" : "yellow"} />
              </Td>
            </Tr>
          ))}
        </AdminTable>
      )}
    </div>
  );
}
