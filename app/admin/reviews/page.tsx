// app/admin/reviews/page.tsx — Reviews & Trust Scores
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  PageHeader, AdminTable, Tr, Td, Badge, FilterBar, SearchInput, ActionButton,
  StatCard, Tabs,
} from "@/components/admin/AdminUI";

type TabKey = "reviews" | "hosts" | "lowReliability" | "reliabilityLog";

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
  display_name: string | null;
  host_rating_avg: number | null;
  host_rating_count: number | null;
  sessions_hosted: number | null;
  reliability_score: number | null;
}

interface LowReliability {
  id: string;
  full_name: string | null;
  display_name: string | null;
  reliability_score: number | null;
  reliability_events: number | null;
  sessions_noshow: number | null;
  sessions_cancelled: number | null;
}

interface ReliabilityLogRow {
  id: string;
  user_id: string;
  session_id: string | null;
  event_type: string;
  delta: number;
  score_after: number;
  note: string | null;
  created_at: string;
  user_name: string | null;
}

function Stars({ value }: { value: number | null }) {
  if (value == null) return <span className="text-white/20">—</span>;
  const filled = Math.round(value);
  return (
    <span className="text-sm whitespace-nowrap">
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
  const [lowReliability, setLowReliability] = useState<LowReliability[]>([]);
  const [relLog, setRelLog] = useState<ReliabilityLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("reviews");
  const [search, setSearch] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [revRes, hostRes, lowRelRes, relLogRes] = await Promise.all([
      supabase
        .from("session_reviews")
        .select(`id, session_id, reviewer_id, host_id, host_rating, session_rating, venue_rating,
                 host_comment, created_at,
                 reviewer:reviewer_id(full_name, display_name),
                 host:host_id(full_name, display_name)`)
        .order("created_at", { ascending: false })
        .limit(300),
      supabase
        .from("profiles")
        .select("id, full_name, display_name, host_rating_avg, host_rating_count, sessions_hosted, reliability_score")
        .gt("sessions_hosted", 0)
        .order("host_rating_avg", { ascending: false, nullsFirst: false })
        .limit(100),
      supabase
        .from("profiles")
        .select("id, full_name, display_name, reliability_score, reliability_events, sessions_noshow, sessions_cancelled")
        .lt("reliability_score", 50)
        .order("reliability_score", { ascending: true })
        .limit(100),
      supabase
        .from("reliability_log")
        .select("id, user_id, session_id, event_type, delta, score_after, note, created_at, profiles:user_id(full_name)")
        .order("created_at", { ascending: false })
        .limit(200),
    ]);

    setReviews((revRes.data ?? []).map((r: Record<string, unknown>) => {
      const rev = r.reviewer as { full_name: string | null; display_name: string | null } | null;
      const hst = r.host as { full_name: string | null; display_name: string | null } | null;
      return {
        ...r,
        reviewer_name: rev?.display_name ?? rev?.full_name ?? null,
        host_name: hst?.display_name ?? hst?.full_name ?? null,
      };
    }) as Review[]);
    setLeaderboard((hostRes.data as HostLeaderboard[]) ?? []);
    setLowReliability((lowRelRes.data as LowReliability[]) ?? []);
    setRelLog((relLogRes.data ?? []).map((r: Record<string, unknown>) => ({
      ...r,
      user_name: (r.profiles as { full_name: string } | null)?.full_name ?? null,
    })) as ReliabilityLogRow[]);
    setLoading(false);
  }

  async function deleteReview(id: string) {
    if (!confirm("Remove this review? This will not recalculate host averages automatically.")) return;
    setActionId(id);
    await supabase.from("session_reviews").delete().eq("id", id);
    setReviews((prev) => prev.filter((r) => r.id !== id));
    setActionId(null);
  }

  const filteredReviews = search
    ? reviews.filter((r) => {
        const q = search.toLowerCase();
        return (
          r.reviewer_name?.toLowerCase().includes(q) ||
          r.host_name?.toLowerCase().includes(q) ||
          r.host_comment?.toLowerCase().includes(q)
        );
      })
    : reviews;

  const validRatings = reviews.filter((r) => r.host_rating != null);
  const avgRating = validRatings.length
    ? (validRatings.reduce((s, r) => s + (r.host_rating ?? 0), 0) / validRatings.length).toFixed(2)
    : "—";

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title="Reviews & Trust Scores" desc="Post-session reviews, host quality, reliability tracking." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Reviews" value={reviews.length} />
        <StatCard label="Platform Avg" value={avgRating} accent />
        <StatCard label="Low Reliability" value={lowReliability.length} accent={lowReliability.length > 0} sub="< 50 score" />
        <StatCard label="Reliability Events" value={relLog.length} />
      </div>

      <Tabs<TabKey>
        tabs={[
          { key: "reviews", label: "All Reviews" },
          { key: "hosts", label: "Host Leaderboard" },
          { key: "lowReliability", label: `Low Reliability (${lowReliability.length})` },
          { key: "reliabilityLog", label: "Reliability Log" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {loading ? (
        <div className="text-white/30 text-sm py-16 text-center">Loading…</div>
      ) : tab === "reviews" ? (
        <>
          <FilterBar>
            <SearchInput value={search} onChange={setSearch} placeholder="Search reviewer, host, comment…" />
            <span className="text-xs text-white/30 font-[family-name:var(--font-dm-sans)]">{filteredReviews.length} reviews</span>
          </FilterBar>
          <AdminTable
            headers={["Reviewer", "Host", "Host Rating", "Session", "Venue", "Comment", "Date", ""]}
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
                <Td dim><span className="line-clamp-2 max-w-[240px] block">{r.host_comment ?? "—"}</span></Td>
                <Td dim>{new Date(r.created_at).toLocaleDateString("en-GB")}</Td>
                <Td>
                  <ActionButton onClick={() => deleteReview(r.id)} label={actionId === r.id ? "…" : "Remove"} variant="danger" />
                </Td>
              </Tr>
            ))}
          </AdminTable>
        </>
      ) : tab === "hosts" ? (
        <AdminTable
          headers={["Host", "Avg Rating", "# Ratings", "Sessions Hosted", "Reliability"]}
          isEmpty={leaderboard.length === 0}
          empty="No hosts yet."
        >
          {leaderboard.map((h, i) => (
            <Tr key={h.id} last={i === leaderboard.length - 1}>
              <Td>{h.display_name ?? h.full_name ?? "—"}</Td>
              <Td><Stars value={h.host_rating_avg} /></Td>
              <Td dim>{h.host_rating_count ?? 0}</Td>
              <Td dim>{h.sessions_hosted ?? 0}</Td>
              <Td dim>{h.reliability_score?.toFixed(0) ?? "—"}</Td>
            </Tr>
          ))}
        </AdminTable>
      ) : tab === "lowReliability" ? (
        <AdminTable
          headers={["User", "Score", "Events", "No-shows", "Cancelled"]}
          isEmpty={lowReliability.length === 0}
          empty="No low-reliability users."
        >
          {lowReliability.map((u, i) => (
            <Tr key={u.id} last={i === lowReliability.length - 1}>
              <Td>{u.display_name ?? u.full_name ?? <span className="font-mono text-xs text-white/30">{u.id.slice(0, 12)}…</span>}</Td>
              <Td>
                <Badge
                  label={String(u.reliability_score?.toFixed(0) ?? "?")}
                  color={u.reliability_score != null && u.reliability_score < 30 ? "red" : "yellow"}
                />
              </Td>
              <Td dim>{u.reliability_events ?? 0}</Td>
              <Td dim>{u.sessions_noshow ?? 0}</Td>
              <Td dim>{u.sessions_cancelled ?? 0}</Td>
            </Tr>
          ))}
        </AdminTable>
      ) : (
        <AdminTable
          headers={["User", "Event", "Δ", "Score After", "Note", "Session", "Date"]}
          isEmpty={relLog.length === 0}
          empty="No reliability events."
        >
          {relLog.map((r, i) => (
            <Tr key={r.id} last={i === relLog.length - 1}>
              <Td dim>{r.user_name ?? r.user_id.slice(0, 10) + "…"}</Td>
              <Td><Badge label={r.event_type} color="blue" /></Td>
              <Td>
                <span className={r.delta < 0 ? "text-red-400" : "text-[#B6FF00]"}>
                  {r.delta > 0 ? "+" : ""}{r.delta.toFixed(1)}
                </span>
              </Td>
              <Td dim>{r.score_after.toFixed(1)}</Td>
              <Td dim><span className="line-clamp-1 max-w-[220px] block">{r.note ?? "—"}</span></Td>
              <Td mono dim>{r.session_id ? r.session_id.slice(0, 8) + "…" : "—"}</Td>
              <Td dim>{new Date(r.created_at).toLocaleDateString("en-GB")}</Td>
            </Tr>
          ))}
        </AdminTable>
      )}
    </div>
  );
}
