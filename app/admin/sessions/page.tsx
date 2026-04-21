// app/admin/sessions/page.tsx — Session Management
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  PageHeader, AdminTable, Tr, Td, Badge, FilterBar, SearchInput, Select,
  ActionButton, StatCard,
} from "@/components/admin/AdminUI";
import type { BadgeColor } from "@/components/admin/AdminUI";

type SessionStatus =
  | "draft" | "pending_approval" | "pre_approved" | "approved" | "published"
  | "active" | "live" | "finishing" | "completed" | "cancelled" | "no_show";

interface SessionRow {
  id: string;
  title: string | null;
  sport_id: string | null;
  status: SessionStatus;
  host_id: string;
  participants_count: number | null;
  spots_left: number | null;
  starts_at: string | null;
  created_at: string;
  location_area: string | null;
  location_label: string | null;
  place_name: string | null;
  is_recurring: boolean | null;
  is_featured: boolean | null;
  join_price_pence: number | null;
  views_count: number | null;
  engagement_score: number | null;
  host_name: string | null;
}

const STATUS_COLOR: Record<SessionStatus, BadgeColor> = {
  draft: "gray",
  pending_approval: "yellow",
  pre_approved: "gray",
  approved: "green",
  published: "green",
  active: "green",
  live: "blue",
  finishing: "yellow",
  completed: "gray",
  cancelled: "red",
  no_show: "red",
};

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [filtered, setFiltered] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sportFilter, setSportFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => { fetchSessions(); }, []);

  useEffect(() => {
    let res = sessions;
    if (sportFilter !== "all") res = res.filter((s) => s.sport_id === sportFilter);
    if (statusFilter !== "all") res = res.filter((s) => s.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      res = res.filter((s) =>
        s.title?.toLowerCase().includes(q) ||
        s.host_name?.toLowerCase().includes(q) ||
        s.place_name?.toLowerCase().includes(q) ||
        s.location_area?.toLowerCase().includes(q) ||
        s.id.includes(q)
      );
    }
    setFiltered(res);
  }, [sessions, search, sportFilter, statusFilter]);

  async function fetchSessions() {
    setLoading(true);
    const { data } = await supabase
      .from("sessions")
      .select(`
        id, title, sport_id, status, host_id,
        participants_count, spots_left,
        starts_at, created_at,
        location_area, location_label, place_name,
        is_recurring, is_featured,
        join_price_pence, views_count, engagement_score,
        profiles:host_id ( full_name, display_name )
      `)
      .order("created_at", { ascending: false })
      .limit(500);

    const rows = (data ?? []).map((s: Record<string, unknown>) => {
      const p = s.profiles as { full_name: string | null; display_name: string | null } | null;
      return {
        ...s,
        host_name: p?.display_name ?? p?.full_name ?? null,
      };
    }) as SessionRow[];
    setSessions(rows);
    setFiltered(rows);
    setLoading(false);
  }

  async function forceCancel(session: SessionRow) {
    const reason = window.prompt(`Force-cancel "${session.title ?? session.id}"?\nReason (visible to players):`, "Cancelled by admin");
    if (reason == null) return;
    setActionId(session.id);
    await supabase
      .from("sessions")
      .update({ status: "cancelled", is_cancelled: true, cancellation_reason: reason })
      .eq("id", session.id);
    setSessions((prev) => prev.map((s) => s.id === session.id ? { ...s, status: "cancelled" } : s));
    setActionId(null);
  }

  async function overrideComplete(session: SessionRow) {
    if (!confirm(`Mark "${session.title ?? session.id}" as completed?`)) return;
    setActionId(session.id);
    await supabase
      .from("sessions")
      .update({ status: "completed", finished_at: new Date().toISOString() })
      .eq("id", session.id);
    setSessions((prev) => prev.map((s) => s.id === session.id ? { ...s, status: "completed" } : s));
    setActionId(null);
  }

  async function toggleFeatured(session: SessionRow) {
    setActionId(session.id);
    const newVal = !session.is_featured;
    await supabase.from("sessions").update({ is_featured: newVal }).eq("id", session.id);
    setSessions((prev) => prev.map((s) => s.id === session.id ? { ...s, is_featured: newVal } : s));
    setActionId(null);
  }

  const live = sessions.filter((s) => s.status === "active" || s.status === "live").length;
  const thisWeek = sessions.filter((s) => new Date(s.created_at) > new Date(Date.now() - 7 * 86400000)).length;
  const cancelled = sessions.filter((s) => s.status === "cancelled").length;
  const featured = sessions.filter((s) => s.is_featured).length;

  const SPORTS = ["all", "football", "basketball", "racket", "tennis", "badminton", "squash", "padel", "table_tennis", "running", "cycling", "gym"];
  const STATUSES: ("all" | SessionStatus)[] = [
    "all", "draft", "pending_approval", "pre_approved", "approved", "published",
    "active", "live", "finishing", "completed", "cancelled", "no_show",
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader title="Session Management" desc="All sessions across every sport — cancel, complete, feature." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Live Now" value={live} accent={live > 0} />
        <StatCard label="This Week" value={thisWeek} />
        <StatCard label="Featured" value={featured} accent={featured > 0} />
        <StatCard label="Cancelled" value={cancelled} accent={cancelled > 0} />
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search title, host, venue…" />
        <Select
          value={sportFilter}
          onChange={setSportFilter}
          options={SPORTS.map((s) => ({
            value: s,
            label: s === "all" ? "All Sports" : s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          }))}
        />
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          options={STATUSES.map((s) => ({
            value: s,
            label: s === "all" ? "All Statuses" : s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          }))}
        />
        <span className="text-xs text-white/30 font-[family-name:var(--font-dm-sans)]">
          {filtered.length} sessions
        </span>
      </FilterBar>

      {loading ? (
        <div className="text-white/30 text-sm py-16 text-center">Loading…</div>
      ) : (
        <AdminTable
          headers={["Session", "Sport", "Host", "Players", "Price", "Starts", "Venue", "Views", "Status", ""]}
          isEmpty={filtered.length === 0}
          empty="No sessions found."
        >
          {filtered.map((s, i) => (
            <Tr key={s.id} last={i === filtered.length - 1}>
              <Td>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-white line-clamp-1">{s.title ?? "Untitled"}</p>
                  {s.is_featured && <span className="text-[#B6FF00] text-xs">★</span>}
                  {s.is_recurring && <span className="text-blue-400 text-xs">↻</span>}
                </div>
                <p className="text-white/30 text-xs mt-0.5 font-mono">{s.id.slice(0, 8)}…</p>
              </Td>
              <Td dim className="capitalize">{s.sport_id?.replace(/_/g, " ") ?? "—"}</Td>
              <Td dim>{s.host_name ?? s.host_id.slice(0, 8) + "…"}</Td>
              <Td dim>
                {s.participants_count ?? 0}
                {s.spots_left != null && <span className="text-white/20"> (+{s.spots_left})</span>}
              </Td>
              <Td dim>
                {s.join_price_pence ? `£${(s.join_price_pence / 100).toFixed(2)}` : "Free"}
              </Td>
              <Td dim>
                {s.starts_at ? new Date(s.starts_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "—"}
              </Td>
              <Td dim>
                <span className="line-clamp-1 max-w-[140px] block">
                  {s.place_name ?? s.location_label ?? s.location_area ?? "—"}
                </span>
              </Td>
              <Td dim>{s.views_count ?? 0}</Td>
              <Td>
                <Badge label={s.status.replace(/_/g, " ")} color={STATUS_COLOR[s.status] ?? "gray"} />
              </Td>
              <Td>
                <div className="flex items-center gap-3 justify-end whitespace-nowrap">
                  <ActionButton
                    onClick={() => toggleFeatured(s)}
                    label={s.is_featured ? "Unfeature" : "Feature"}
                    variant={s.is_featured ? "ghost" : "primary"}
                  />
                  {(s.status === "live" || s.status === "active") && (
                    <ActionButton
                      onClick={() => overrideComplete(s)}
                      label={actionId === s.id ? "…" : "Complete"}
                      variant="primary"
                    />
                  )}
                  {s.status !== "cancelled" && s.status !== "completed" && (
                    <ActionButton
                      onClick={() => forceCancel(s)}
                      label={actionId === s.id ? "…" : "Cancel"}
                      variant="danger"
                    />
                  )}
                </div>
              </Td>
            </Tr>
          ))}
        </AdminTable>
      )}
    </div>
  );
}
