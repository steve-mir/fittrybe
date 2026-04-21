// app/admin/engagement/page.tsx — Engagement: Challenges, Invites, Votes
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  PageHeader, AdminTable, Tr, Td, Badge, StatCard, Tabs, FilterBar, Select,
} from "@/components/admin/AdminUI";
import type { BadgeColor } from "@/components/admin/AdminUI";

type TabKey = "challenges" | "invites" | "votes" | "scoreEvents";

interface Challenge {
  id: string;
  sender_id: string;
  recipient_id: string;
  sport_id: string;
  message: string | null;
  status: string;
  created_at: string;
  responded_at: string | null;
  expires_at: string;
  sender_name: string | null;
  recipient_name: string | null;
}

interface SessionInvite {
  id: string;
  session_id: string;
  inviter_id: string;
  invitee_id: string;
  invite_type: string;
  status: string;
  message: string | null;
  created_at: string;
  responded_at: string | null;
  inviter_name: string | null;
  invitee_name: string | null;
}

interface SessionVote {
  id: string;
  session_id: string;
  user_id: string;
  vote: "keep" | "cancel";
  voted_at: string;
  user_name: string | null;
}

interface ScoreEvent {
  id: string;
  user_id: string;
  session_id: string | null;
  event_type: string;
  delta: number;
  note: string | null;
  created_at: string;
  user_name: string | null;
}

function statusColor(s: string): BadgeColor {
  const l = s.toLowerCase();
  if (["accepted", "approved", "completed"].includes(l)) return "green";
  if (["pending", "sent"].includes(l)) return "yellow";
  if (["declined", "rejected", "expired", "cancelled"].includes(l)) return "red";
  return "gray";
}

export default function EngagementPage() {
  const [tab, setTab] = useState<TabKey>("challenges");
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [invites, setInvites] = useState<SessionInvite[]>([]);
  const [votes, setVotes] = useState<SessionVote[]>([]);
  const [scoreEvents, setScoreEvents] = useState<ScoreEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [cRes, iRes, vRes, sRes] = await Promise.all([
      supabase.from("challenges")
        .select("id, sender_id, recipient_id, sport_id, message, status, created_at, responded_at, expires_at")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase.from("session_invites")
        .select("id, session_id, inviter_id, invitee_id, invite_type, status, message, created_at, responded_at")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase.from("session_votes")
        .select("id, session_id, user_id, vote, voted_at, profiles:user_id(full_name)")
        .order("voted_at", { ascending: false })
        .limit(200),
      supabase.from("score_events")
        .select("id, user_id, session_id, event_type, delta, note, created_at, profiles:user_id(full_name)")
        .order("created_at", { ascending: false })
        .limit(200),
    ]);

    // Enrich challenges with sender/recipient names
    const userIds = new Set<string>();
    (cRes.data ?? []).forEach((c: { sender_id: string; recipient_id: string }) => {
      userIds.add(c.sender_id);
      userIds.add(c.recipient_id);
    });
    (iRes.data ?? []).forEach((i: { inviter_id: string; invitee_id: string }) => {
      userIds.add(i.inviter_id);
      userIds.add(i.invitee_id);
    });

    const profileMap: Record<string, string> = {};
    if (userIds.size) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, display_name")
        .in("id", Array.from(userIds));
      (profiles ?? []).forEach((p: { id: string; full_name: string | null; display_name: string | null }) => {
        profileMap[p.id] = p.display_name ?? p.full_name ?? p.id.slice(0, 8) + "…";
      });
    }

    setChallenges((cRes.data ?? []).map((c: Record<string, unknown>) => ({
      ...(c as Omit<Challenge, "sender_name" | "recipient_name">),
      sender_name: profileMap[c.sender_id as string] ?? null,
      recipient_name: profileMap[c.recipient_id as string] ?? null,
    })));

    setInvites((iRes.data ?? []).map((i: Record<string, unknown>) => ({
      ...(i as Omit<SessionInvite, "inviter_name" | "invitee_name">),
      inviter_name: profileMap[i.inviter_id as string] ?? null,
      invitee_name: profileMap[i.invitee_id as string] ?? null,
    })));

    setVotes((vRes.data ?? []).map((v: Record<string, unknown>) => ({
      ...v,
      user_name: (v.profiles as { full_name: string } | null)?.full_name ?? null,
    })) as SessionVote[]);

    setScoreEvents((sRes.data ?? []).map((s: Record<string, unknown>) => ({
      ...s,
      user_name: (s.profiles as { full_name: string } | null)?.full_name ?? null,
    })) as ScoreEvent[]);

    setLoading(false);
  }

  const filteredChallenges = statusFilter === "all" ? challenges : challenges.filter((c) => c.status === statusFilter);
  const filteredInvites = statusFilter === "all" ? invites : invites.filter((i) => i.status === statusFilter);

  const pendingChallenges = challenges.filter((c) => c.status === "pending").length;
  const pendingInvites = invites.filter((i) => i.status === "pending").length;
  const keepVotes = votes.filter((v) => v.vote === "keep").length;
  const cancelVotes = votes.filter((v) => v.vote === "cancel").length;

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader title="Engagement" desc="Challenges, invites, session votes, and score events." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Pending Challenges" value={pendingChallenges} accent={pendingChallenges > 0} />
        <StatCard label="Pending Invites" value={pendingInvites} accent={pendingInvites > 0} />
        <StatCard label="Keep Votes" value={keepVotes} />
        <StatCard label="Cancel Votes" value={cancelVotes} accent={cancelVotes > 0} />
      </div>

      <Tabs<TabKey>
        tabs={[
          { key: "challenges", label: `Challenges (${challenges.length})` },
          { key: "invites", label: `Session Invites (${invites.length})` },
          { key: "votes", label: `Votes (${votes.length})` },
          { key: "scoreEvents", label: `Score Events (${scoreEvents.length})` },
        ]}
        active={tab}
        onChange={setTab}
      />

      {(tab === "challenges" || tab === "invites") && (
        <FilterBar>
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "all", label: "All Statuses" },
              { value: "pending", label: "Pending" },
              { value: "accepted", label: "Accepted" },
              { value: "declined", label: "Declined" },
              { value: "expired", label: "Expired" },
            ]}
          />
        </FilterBar>
      )}

      {loading ? (
        <div className="text-white/30 text-sm py-16 text-center">Loading…</div>
      ) : tab === "challenges" ? (
        <AdminTable
          headers={["Sender", "Recipient", "Sport", "Message", "Status", "Created", "Expires"]}
          isEmpty={filteredChallenges.length === 0}
          empty="No challenges."
        >
          {filteredChallenges.map((c, i) => (
            <Tr key={c.id} last={i === filteredChallenges.length - 1}>
              <Td dim>{c.sender_name ?? c.sender_id.slice(0, 10) + "…"}</Td>
              <Td>{c.recipient_name ?? c.recipient_id.slice(0, 10) + "…"}</Td>
              <Td dim className="capitalize">{c.sport_id.replace(/_/g, " ")}</Td>
              <Td dim><span className="line-clamp-1 max-w-[220px] block">{c.message ?? "—"}</span></Td>
              <Td><Badge label={c.status} color={statusColor(c.status)} /></Td>
              <Td dim>{new Date(c.created_at).toLocaleDateString("en-GB")}</Td>
              <Td dim>{new Date(c.expires_at).toLocaleDateString("en-GB")}</Td>
            </Tr>
          ))}
        </AdminTable>
      ) : tab === "invites" ? (
        <AdminTable
          headers={["Inviter", "Invitee", "Type", "Session", "Status", "Message", "Created"]}
          isEmpty={filteredInvites.length === 0}
          empty="No invites."
        >
          {filteredInvites.map((inv, i) => (
            <Tr key={inv.id} last={i === filteredInvites.length - 1}>
              <Td dim>{inv.inviter_name ?? inv.inviter_id.slice(0, 10) + "…"}</Td>
              <Td>{inv.invitee_name ?? inv.invitee_id.slice(0, 10) + "…"}</Td>
              <Td><Badge label={inv.invite_type} color="blue" /></Td>
              <Td mono dim>{inv.session_id.slice(0, 8)}…</Td>
              <Td><Badge label={inv.status} color={statusColor(inv.status)} /></Td>
              <Td dim><span className="line-clamp-1 max-w-[200px] block">{inv.message ?? "—"}</span></Td>
              <Td dim>{new Date(inv.created_at).toLocaleDateString("en-GB")}</Td>
            </Tr>
          ))}
        </AdminTable>
      ) : tab === "votes" ? (
        <AdminTable
          headers={["User", "Session", "Vote", "Voted At"]}
          isEmpty={votes.length === 0}
          empty="No votes recorded."
        >
          {votes.map((v, i) => (
            <Tr key={v.id} last={i === votes.length - 1}>
              <Td>{v.user_name ?? v.user_id.slice(0, 10) + "…"}</Td>
              <Td mono dim>{v.session_id.slice(0, 8)}…</Td>
              <Td>
                <Badge label={v.vote} color={v.vote === "keep" ? "green" : "red"} />
              </Td>
              <Td dim>{new Date(v.voted_at).toLocaleDateString("en-GB")}</Td>
            </Tr>
          ))}
        </AdminTable>
      ) : (
        <AdminTable
          headers={["User", "Event", "Δ", "Note", "Session", "Date"]}
          isEmpty={scoreEvents.length === 0}
          empty="No score events."
        >
          {scoreEvents.map((s, i) => (
            <Tr key={s.id} last={i === scoreEvents.length - 1}>
              <Td dim>{s.user_name ?? s.user_id.slice(0, 10) + "…"}</Td>
              <Td><Badge label={s.event_type} color="blue" /></Td>
              <Td>
                <span className={s.delta < 0 ? "text-red-400" : "text-[#B6FF00]"}>
                  {s.delta > 0 ? "+" : ""}{s.delta}
                </span>
              </Td>
              <Td dim><span className="line-clamp-1 max-w-[240px] block">{s.note ?? "—"}</span></Td>
              <Td mono dim>{s.session_id ? s.session_id.slice(0, 8) + "…" : "—"}</Td>
              <Td dim>{new Date(s.created_at).toLocaleDateString("en-GB")}</Td>
            </Tr>
          ))}
        </AdminTable>
      )}
    </div>
  );
}
