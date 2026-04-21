// app/admin/moderation/page.tsx — Moderation & Reports
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  PageHeader, AdminTable, Tr, Td, Badge, FilterBar, Select, ActionButton,
  StatCard, SectionNote, Tabs,
} from "@/components/admin/AdminUI";
import type { BadgeColor } from "@/components/admin/AdminUI";

type ReportStatus = "pending" | "reviewing" | "actioned" | "dismissed" | "escalated";
type TabKey = "reports" | "strikes" | "blocks";

interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  reason: string;
  description: string | null;
  context: string | null;
  context_id: string | null;
  status: ReportStatus;
  action_taken: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  reporter_name: string | null;
  reported_name: string | null;
}

interface Strike {
  id: string;
  user_id: string;
  kind: "host_cancel" | "player";
  strike_type: string | null; // player_strikes.type
  session_id: string | null;
  created_at: string;
  user_name: string | null;
}

interface UserBlock {
  id: string;
  blocker_id: string;
  blocked_user_id: string;
  created_at: string;
  blocker_name: string | null;
  blocked_name: string | null;
}

const STATUS_COLOR: Record<ReportStatus, BadgeColor> = {
  pending: "red",
  reviewing: "yellow",
  actioned: "green",
  dismissed: "gray",
  escalated: "purple",
};

export default function ModerationPage() {
  const [tab, setTab] = useState<TabKey>("reports");
  const [reports, setReports] = useState<Report[]>([]);
  const [strikes, setStrikes] = useState<Strike[]>([]);
  const [blocks, setBlocks] = useState<UserBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "all">("pending");
  const [strikeFilter, setStrikeFilter] = useState<"all" | "host_cancel" | "player">("all");
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [repRes, hostStrikeRes, playerStrikeRes, blockRes] = await Promise.all([
      supabase
        .from("user_reports")
        .select(`id, reporter_id, reported_user_id, reason, description, context, context_id,
                 status, action_taken, reviewed_at, reviewed_by, created_at,
                 reporter:reporter_id(full_name), reported:reported_user_id(full_name)`)
        .order("created_at", { ascending: false })
        .limit(300),
      supabase
        .from("host_cancel_strikes")
        .select("id, user_id, session_id, created_at, profiles:user_id(full_name)")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("player_strikes")
        .select("id, user_id, type, session_id, created_at, profiles:user_id(full_name)")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("user_blocks")
        .select(`id, blocker_id, blocked_user_id, created_at,
                 blocker:blocker_id(full_name), blocked:blocked_user_id(full_name)`)
        .order("created_at", { ascending: false })
        .limit(200),
    ]);

    const reps = (repRes.data ?? []).map((r: Record<string, unknown>) => ({
      ...r,
      reporter_name: (r.reporter as { full_name: string } | null)?.full_name ?? null,
      reported_name: (r.reported as { full_name: string } | null)?.full_name ?? null,
    })) as Report[];

    const hostStrikes: Strike[] = (hostStrikeRes.data ?? []).map((s: Record<string, unknown>) => ({
      id: String(s.id),
      user_id: String(s.user_id),
      kind: "host_cancel" as const,
      strike_type: null,
      session_id: (s.session_id as string) ?? null,
      created_at: String(s.created_at),
      user_name: (s.profiles as { full_name: string } | null)?.full_name ?? null,
    }));

    const playerStrikes: Strike[] = (playerStrikeRes.data ?? []).map((s: Record<string, unknown>) => ({
      id: String(s.id),
      user_id: String(s.user_id),
      kind: "player" as const,
      strike_type: (s.type as string) ?? "no_show",
      session_id: (s.session_id as string) ?? null,
      created_at: String(s.created_at),
      user_name: (s.profiles as { full_name: string } | null)?.full_name ?? null,
    }));

    const blk = (blockRes.data ?? []).map((b: Record<string, unknown>) => ({
      ...b,
      blocker_name: (b.blocker as { full_name: string } | null)?.full_name ?? null,
      blocked_name: (b.blocked as { full_name: string } | null)?.full_name ?? null,
    })) as UserBlock[];

    setReports(reps);
    setStrikes([...hostStrikes, ...playerStrikes].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ));
    setBlocks(blk);
    setLoading(false);
  }

  async function updateReportStatus(id: string, status: ReportStatus, actionTaken?: string) {
    setActionId(id);
    const patch: Record<string, unknown> = {
      status,
      reviewed_at: new Date().toISOString(),
    };
    if (actionTaken !== undefined) patch.action_taken = actionTaken;

    await supabase.from("user_reports").update(patch).eq("id", id);
    setReports((prev) => prev.map((r) => r.id === id ? { ...r, status, action_taken: actionTaken ?? r.action_taken, reviewed_at: new Date().toISOString() } : r));
    setActionId(null);
  }

  async function removeStrike(s: Strike) {
    if (!confirm("Remove this strike? This action cannot be undone.")) return;
    setActionId(s.id);
    const table = s.kind === "host_cancel" ? "host_cancel_strikes" : "player_strikes";
    await supabase.from(table).delete().eq("id", s.id);
    setStrikes((prev) => prev.filter((x) => x.id !== s.id));
    setActionId(null);
  }

  async function removeBlock(b: UserBlock) {
    if (!confirm("Remove this block? The users will be able to interact again.")) return;
    setActionId(b.id);
    await supabase.from("user_blocks").delete().eq("id", b.id);
    setBlocks((prev) => prev.filter((x) => x.id !== b.id));
    setActionId(null);
  }

  const openCount = reports.filter((r) => r.status === "pending" || r.status === "reviewing").length;
  const escalated = reports.filter((r) => r.status === "escalated").length;
  const filteredReports = statusFilter === "all" ? reports : reports.filter((r) => r.status === statusFilter);
  const filteredStrikes = strikeFilter === "all" ? strikes : strikes.filter((s) => s.kind === strikeFilter);

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader title="Moderation & Reports" desc="User reports, strikes, and mutual blocks." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Open Reports" value={openCount} accent={openCount > 0} sub={openCount > 0 ? "Needs review" : undefined} />
        <StatCard label="Escalated" value={escalated} accent={escalated > 0} />
        <StatCard label="Total Strikes" value={strikes.length} />
        <StatCard label="User Blocks" value={blocks.length} />
      </div>

      {openCount > 0 && (
        <SectionNote>
          ⚠️ {openCount} open report{openCount !== 1 ? "s" : ""} awaiting review.
        </SectionNote>
      )}

      <Tabs<TabKey>
        tabs={[
          { key: "reports", label: `Reports${openCount > 0 ? ` (${openCount} open)` : ""}` },
          { key: "strikes", label: `Strikes (${strikes.length})` },
          { key: "blocks", label: `Blocks (${blocks.length})` },
        ]}
        active={tab}
        onChange={setTab}
      />

      {loading ? (
        <div className="text-white/30 text-sm py-16 text-center">Loading…</div>
      ) : tab === "reports" ? (
        <>
          <FilterBar>
            <Select
              value={statusFilter}
              onChange={(v) => setStatusFilter(v as ReportStatus | "all")}
              options={[
                { value: "all", label: "All" },
                { value: "pending", label: "Pending" },
                { value: "reviewing", label: "Reviewing" },
                { value: "actioned", label: "Actioned" },
                { value: "dismissed", label: "Dismissed" },
                { value: "escalated", label: "Escalated" },
              ]}
            />
            <span className="text-xs text-white/30 font-[family-name:var(--font-dm-sans)]">{filteredReports.length} reports</span>
          </FilterBar>
          <AdminTable
            headers={["Reporter", "Reported", "Reason", "Context", "Description", "Status", "Action Taken", "Date", ""]}
            isEmpty={filteredReports.length === 0}
            empty="No reports."
          >
            {filteredReports.map((r, i) => (
              <Tr key={r.id} last={i === filteredReports.length - 1}>
                <Td dim>{r.reporter_name ?? r.reporter_id.slice(0, 8) + "…"}</Td>
                <Td>
                  <span className="font-medium text-white">{r.reported_name ?? r.reported_user_id.slice(0, 8) + "…"}</span>
                </Td>
                <Td dim><span className="line-clamp-1 max-w-[140px] block">{r.reason}</span></Td>
                <Td>
                  {r.context ? <Badge label={r.context} color="gray" /> : <span className="text-white/30">—</span>}
                </Td>
                <Td dim><span className="line-clamp-2 max-w-[220px] block">{r.description ?? "—"}</span></Td>
                <Td><Badge label={r.status} color={STATUS_COLOR[r.status] ?? "gray"} /></Td>
                <Td dim><span className="line-clamp-1 max-w-[140px] block">{r.action_taken ?? "—"}</span></Td>
                <Td dim>{new Date(r.created_at).toLocaleDateString("en-GB")}</Td>
                <Td>
                  {(r.status === "pending" || r.status === "reviewing") && (
                    <div className="flex items-center gap-2 justify-end whitespace-nowrap">
                      <ActionButton onClick={() => {
                        const a = window.prompt("Action taken:", "Warned user");
                        if (a != null) updateReportStatus(r.id, "actioned", a);
                      }} label={actionId === r.id ? "…" : "Action"} variant="primary" />
                      <ActionButton onClick={() => updateReportStatus(r.id, "dismissed", "No violation")} label="Dismiss" variant="ghost" />
                      <ActionButton onClick={() => updateReportStatus(r.id, "escalated")} label="Escalate" variant="danger" />
                    </div>
                  )}
                </Td>
              </Tr>
            ))}
          </AdminTable>
        </>
      ) : tab === "strikes" ? (
        <>
          <FilterBar>
            <Select
              value={strikeFilter}
              onChange={(v) => setStrikeFilter(v as typeof strikeFilter)}
              options={[
                { value: "all", label: "All Strikes" },
                { value: "host_cancel", label: "Host Cancellations" },
                { value: "player", label: "Player No-shows" },
              ]}
            />
            <span className="text-xs text-white/30 font-[family-name:var(--font-dm-sans)]">{filteredStrikes.length} strikes</span>
          </FilterBar>
          <AdminTable
            headers={["User", "Strike Type", "Sub-type", "Session", "Date", ""]}
            isEmpty={filteredStrikes.length === 0}
            empty="No strikes."
          >
            {filteredStrikes.map((s, i) => (
              <Tr key={s.id} last={i === filteredStrikes.length - 1}>
                <Td>{s.user_name ?? <span className="font-mono text-xs text-white/30">{s.user_id.slice(0, 10)}…</span>}</Td>
                <Td>
                  <Badge
                    label={s.kind === "host_cancel" ? "Host Cancel" : "Player"}
                    color={s.kind === "host_cancel" ? "yellow" : "red"}
                  />
                </Td>
                <Td dim>{s.strike_type ?? "—"}</Td>
                <Td mono dim>{s.session_id ? s.session_id.slice(0, 8) + "…" : "—"}</Td>
                <Td dim>{new Date(s.created_at).toLocaleDateString("en-GB")}</Td>
                <Td>
                  <ActionButton
                    onClick={() => removeStrike(s)}
                    label={actionId === s.id ? "…" : "Remove"}
                    variant="danger"
                  />
                </Td>
              </Tr>
            ))}
          </AdminTable>
        </>
      ) : (
        <AdminTable
          headers={["Blocker", "Blocked User", "Created", ""]}
          isEmpty={blocks.length === 0}
          empty="No user blocks."
        >
          {blocks.map((b, i) => (
            <Tr key={b.id} last={i === blocks.length - 1}>
              <Td>{b.blocker_name ?? <span className="font-mono text-xs text-white/30">{b.blocker_id.slice(0, 10)}…</span>}</Td>
              <Td>{b.blocked_name ?? <span className="font-mono text-xs text-white/30">{b.blocked_user_id.slice(0, 10)}…</span>}</Td>
              <Td dim>{new Date(b.created_at).toLocaleDateString("en-GB")}</Td>
              <Td>
                <ActionButton
                  onClick={() => removeBlock(b)}
                  label={actionId === b.id ? "…" : "Remove Block"}
                  variant="danger"
                />
              </Td>
            </Tr>
          ))}
        </AdminTable>
      )}
    </div>
  );
}
