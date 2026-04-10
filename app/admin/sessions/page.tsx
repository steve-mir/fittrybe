// app/admin/sessions/page.tsx — Session Management
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  PageHeader, AdminTable, Tr, Td, Badge, FilterBar, SearchInput, Select, ActionButton, StatCard
} from "@/components/admin/AdminUI";

type SessionStatus = "draft" | "live" | "active" | "completed" | "cancelled";

interface SessionRow {
  id: string;
  title: string | null;
  sport: string | null;
  status: SessionStatus;
  max_participants: number | null;
  participant_count: number | null;
  scheduled_at: string | null;
  created_at: string;
  host_id: string | null;
  host_name: string | null;
}

const STATUS_COLOR: Record<SessionStatus, "green" | "blue" | "yellow" | "gray" | "red"> = {
  active: "green",
  live: "blue",
  draft: "gray",
  completed: "gray",
  cancelled: "red",
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
    if (sportFilter !== "all") res = res.filter((s) => s.sport === sportFilter);
    if (statusFilter !== "all") res = res.filter((s) => s.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      res = res.filter((s) => s.title?.toLowerCase().includes(q) || s.host_name?.toLowerCase().includes(q) || s.id.includes(q));
    }
    setFiltered(res);
  }, [sessions, search, sportFilter, statusFilter]);

  async function fetchSessions() {
    setLoading(true);
    const { data } = await supabase
      .from("sessions")
      .select(`
        id, title, sport, status, max_participants, participant_count,
        scheduled_at, created_at, host_id,
        profiles:host_id ( full_name )
      `)
      .order("created_at", { ascending: false })
      .limit(300);

    const rows = (data ?? []).map((s: Record<string, unknown>) => ({
      ...s,
      host_name: (s.profiles as { full_name: string } | null)?.full_name ?? null,
    })) as SessionRow[];
    setSessions(rows);
    setFiltered(rows);
    setLoading(false);
  }

  async function forceCancel(session: SessionRow) {
    if (!confirm(`Force-cancel "${session.title ?? session.id}"? This will trigger refunds.`)) return;
    setActionId(session.id);
    await supabase.from("sessions").update({ status: "cancelled" }).eq("id", session.id);
    setSessions((prev) => prev.map((s) => s.id === session.id ? { ...s, status: "cancelled" } : s));
    setActionId(null);
  }

  async function overrideComplete(session: SessionRow) {
    if (!confirm(`Mark "${session.title ?? session.id}" as completed?`)) return;
    setActionId(session.id);
    await supabase.from("sessions").update({ status: "completed" }).eq("id", session.id);
    setSessions((prev) => prev.map((s) => s.id === session.id ? { ...s, status: "completed" } : s));
    setActionId(null);
  }

  const live = sessions.filter((s) => s.status === "active" || s.status === "live").length;
  const thisWeek = sessions.filter((s) => new Date(s.created_at) > new Date(Date.now() - 7 * 86400000)).length;
  const cancelled = sessions.filter((s) => s.status === "cancelled").length;

  const SPORTS = ["all", "football", "basketball", "racket", "running", "cycling", "gym"];
  const STATUSES = ["all", "draft", "live", "active", "completed", "cancelled"];

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title="Session Management" desc="All sessions across every sport." />

      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Live Now" value={live} accent={live > 0} />
        <StatCard label="This Week" value={thisWeek} />
        <StatCard label="Total Cancelled" value={cancelled} accent={cancelled > 0} />
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search title, host…" />
        <Select
          value={sportFilter}
          onChange={setSportFilter}
          options={SPORTS.map((s) => ({ value: s, label: s === "all" ? "All Sports" : s.charAt(0).toUpperCase() + s.slice(1) }))}
        />
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          options={STATUSES.map((s) => ({ value: s, label: s === "all" ? "All Statuses" : s.charAt(0).toUpperCase() + s.slice(1) }))}
        />
        <span className="text-xs text-white/30 font-[family-name:var(--font-dm-sans)]">
          {filtered.length} sessions
        </span>
      </FilterBar>

      {loading ? (
        <div className="text-white/30 text-sm py-16 text-center">Loading…</div>
      ) : (
        <AdminTable
          headers={["Session", "Sport", "Host", "Participants", "Scheduled", "Status", ""]}
          isEmpty={filtered.length === 0}
          empty="No sessions found."
        >
          {filtered.map((s, i) => (
            <Tr key={s.id} last={i === filtered.length - 1}>
              <Td>
                <p className="font-medium text-white line-clamp-1">{s.title ?? "Untitled"}</p>
                <p className="text-white/30 text-xs mt-0.5 font-mono">{s.id.slice(0, 8)}…</p>
              </Td>
              <Td dim>{s.sport ?? "—"}</Td>
              <Td dim>{s.host_name ?? "—"}</Td>
              <Td dim>
                {s.participant_count ?? 0} / {s.max_participants ?? "?"}
              </Td>
              <Td dim>
                {s.scheduled_at ? new Date(s.scheduled_at).toLocaleDateString("en-GB") : "—"}
              </Td>
              <Td>
                <Badge label={s.status} color={STATUS_COLOR[s.status] ?? "gray"} />
              </Td>
              <Td>
                <div className="flex items-center gap-3 justify-end">
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
