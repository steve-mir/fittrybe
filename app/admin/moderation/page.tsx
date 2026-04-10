// app/admin/moderation/page.tsx — Moderation & Reports
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  PageHeader, AdminTable, Tr, Td, Badge, FilterBar, Select, ActionButton, StatCard, SectionNote
} from "@/components/admin/AdminUI";

interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  reason: string | null;
  description: string | null;
  context: string | null;
  status: "open" | "dismissed" | "actioned" | "escalated";
  created_at: string;
  reporter_name: string | null;
  reported_name: string | null;
}

interface Strike {
  id: string;
  user_id: string;
  type: "host_cancel" | "player";
  reason: string | null;
  session_id: string | null;
  created_at: string;
  user_name: string | null;
}

type ReportStatus = "open" | "dismissed" | "actioned" | "escalated";

const STATUS_COLOR: Record<ReportStatus, "red" | "gray" | "green" | "yellow"> = {
  open: "red",
  dismissed: "gray",
  actioned: "green",
  escalated: "yellow",
};

export default function ModerationPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [strikes, setStrikes] = useState<Strike[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("open");
  const [tab, setTab] = useState<"reports" | "strikes">("reports");
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [repRes, hostStrikeRes, playerStrikeRes] = await Promise.all([
      supabase
        .from("user_reports")
        .select("id, reporter_id, reported_user_id, reason, description, context, status, created_at, reporter:reporter_id(full_name), reported:reported_user_id(full_name)")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("host_cancel_strikes")
        .select("id, host_id, reason, session_id, created_at, profiles:host_id(full_name)")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("player_strikes")
        .select("id, player_id, reason, session_id, created_at, profiles:player_id(full_name)")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

    const reps = (repRes.data ?? []).map((r: Record<string, unknown>) => ({
      ...r,
      reporter_name: (r.reporter as { full_name: string } | null)?.full_name ?? null,
      reported_name: (r.reported as { full_name: string } | null)?.full_name ?? null,
    })) as Report[];

    const hostStrikes: Strike[] = (hostStrikeRes.data ?? []).map((s: Record<string, unknown>) => ({
      id: String(s.id),
      user_id: String(s.host_id),
      type: "host_cancel" as const,
      reason: (s.reason as string) ?? null,
      session_id: (s.session_id as string) ?? null,
      created_at: String(s.created_at),
      user_name: (s.profiles as { full_name: string } | null)?.full_name ?? null,
    }));

    const playerStrikes: Strike[] = (playerStrikeRes.data ?? []).map((s: Record<string, unknown>) => ({
      id: String(s.id),
      user_id: String(s.player_id),
      type: "player" as const,
      reason: (s.reason as string) ?? null,
      session_id: (s.session_id as string) ?? null,
      created_at: String(s.created_at),
      user_name: (s.profiles as { full_name: string } | null)?.full_name ?? null,
    }));

    setReports(reps);
    setStrikes([...hostStrikes, ...playerStrikes].sort((a, b) =>
      new Date(b.created_at as string).getTime() - new Date(a.created_at as string).getTime()
    ));
    setLoading(false);
  }

  async function updateReportStatus(id: string, status: ReportStatus) {
    setActionId(id);
    await supabase.from("user_reports").update({ status }).eq("id", id);
    setReports((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
    setActionId(null);
  }

  const openCount = reports.filter((r) => r.status === "open").length;
  const filteredReports = statusFilter === "all" ? reports : reports.filter((r) => r.status === statusFilter);

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title="Moderation & Reports" desc="User reports, strikes, and content flags." />

      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Open Reports" value={openCount} accent={openCount > 0} sub={openCount > 0 ? "Needs review" : undefined} />
        <StatCard label="Total Reports" value={reports.length} />
        <StatCard label="Total Strikes" value={strikes.length} accent={strikes.length > 0} />
      </div>

      {openCount > 0 && (
        <SectionNote>
          ⚠️ {openCount} open report{openCount !== 1 ? "s" : ""} awaiting action.
        </SectionNote>
      )}

      <div className="flex gap-2 mb-6">
        {(["reports", "strikes"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium font-[family-name:var(--font-dm-sans)] transition-all ${
              tab === t
                ? "bg-[#B6FF00]/10 text-[#B6FF00] border border-[#B6FF00]/20"
                : "text-white/40 hover:text-white border border-white/8"
            }`}
          >
            {t === "reports" ? `Reports ${openCount > 0 ? `(${openCount} open)` : ""}` : `Strikes (${strikes.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-white/30 text-sm py-16 text-center">Loading…</div>
      ) : tab === "reports" ? (
        <>
          <FilterBar>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: "all", label: "All" },
                { value: "open", label: "Open" },
                { value: "actioned", label: "Actioned" },
                { value: "dismissed", label: "Dismissed" },
                { value: "escalated", label: "Escalated" },
              ]}
            />
            <span className="text-xs text-white/30 font-[family-name:var(--font-dm-sans)]">{filteredReports.length} reports</span>
          </FilterBar>
          <AdminTable
            headers={["Reporter", "Reported User", "Reason", "Context", "Status", "Date", ""]}
            isEmpty={filteredReports.length === 0}
            empty="No reports."
          >
            {filteredReports.map((r, i) => (
              <Tr key={r.id} last={i === filteredReports.length - 1}>
                <Td dim>{r.reporter_name ?? r.reporter_id.slice(0, 8) + "…"}</Td>
                <Td>
                  <span className="font-medium text-white">{r.reported_name ?? r.reported_user_id.slice(0, 8) + "…"}</span>
                </Td>
                <Td dim>{r.reason ?? "—"}</Td>
                <Td><Badge label={r.context ?? "—"} color="gray" /></Td>
                <Td><Badge label={r.status} color={STATUS_COLOR[r.status]} /></Td>
                <Td dim>{new Date(r.created_at).toLocaleDateString("en-GB")}</Td>
                <Td>
                  {r.status === "open" && (
                    <div className="flex items-center gap-2 justify-end">
                      <ActionButton onClick={() => updateReportStatus(r.id, "actioned")} label={actionId === r.id ? "…" : "Action"} variant="primary" />
                      <ActionButton onClick={() => updateReportStatus(r.id, "dismissed")} label="Dismiss" variant="ghost" />
                      <ActionButton onClick={() => updateReportStatus(r.id, "escalated")} label="Escalate" variant="danger" />
                    </div>
                  )}
                </Td>
              </Tr>
            ))}
          </AdminTable>
        </>
      ) : (
        <AdminTable
          headers={["User", "Strike Type", "Reason", "Session", "Date"]}
          isEmpty={strikes.length === 0}
          empty="No strikes."
        >
          {strikes.map((s, i) => (
            <Tr key={s.id} last={i === strikes.length - 1}>
              <Td>{s.user_name ?? <span className="font-mono text-xs text-white/30">{String(s.user_id).slice(0, 10)}…</span>}</Td>
              <Td><Badge label={s.type === "host_cancel" ? "Host Cancel" : "Player"} color={s.type === "host_cancel" ? "yellow" : "red"} /></Td>
              <Td dim>{s.reason ?? "—"}</Td>
              <Td mono dim>{s.session_id ? String(s.session_id).slice(0, 8) + "…" : "—"}</Td>
              <Td dim>{new Date(s.created_at).toLocaleDateString("en-GB")}</Td>
            </Tr>
          ))}
        </AdminTable>
      )}
    </div>
  );
}
