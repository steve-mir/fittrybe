// app/admin/verifications/page.tsx — Pro Host Verification Panel
//
// Drives directly off the existing `profiles` table — there is no separate
// applications table. A "Pro host applicant" is any host candidate (someone
// who has hosted at least one session, OR has explicitly opted in via the
// `partner_host` flag) whose profile is not yet verified or upgraded.
//
// State model (mapped to existing columns on `profiles`):
//   pending  → !is_verified && account_tier='free' && !partner_host
//   approved → is_verified || account_tier='pro' || partner_host
//   rejected → derived from the most recent admin decision in `notifications`
//              (no native column; rejection is an action, not a persisted state)
//
// Decisions and audit are written to the `notifications` table:
//   - The applicant receives a user-facing notification.
//   - The same row stores admin metadata in `data` (actor, reason, decision).
//   - The Audit tab queries `notifications` filtered by type prefix
//     `pro_host_application_*` to reconstruct the decision history.
"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";
import {
  PageHeader,
  AdminTable,
  Tr,
  Td,
  Badge,
  FilterBar,
  SearchInput,
  Select,
  StatCard,
  Tabs,
  SectionNote,
  PrimaryButton,
  GhostButton,
  TextArea,
  FormField,
} from "@/components/admin/AdminUI";
import type { BadgeColor } from "@/components/admin/AdminUI";

type DerivedStatus = "pending" | "approved" | "rejected";
type FilterStatus = DerivedStatus | "all";
type TabKey = "queue" | "audit";

const NOTIFICATION_TYPE_APPROVED = "pro_host_application_approved";
const NOTIFICATION_TYPE_REJECTED = "pro_host_application_rejected";
const NOTIFICATION_TYPES = [
  NOTIFICATION_TYPE_APPROVED,
  NOTIFICATION_TYPE_REJECTED,
];

interface Applicant {
  id: string;
  full_name: string | null;
  display_name: string | null;
  username: string | null;
  email: string | null;
  avatar_url: string | null;
  cover_photo_url: string | null;
  bio: string | null;
  tagline: string | null;
  location: string | null;
  interests: string[] | null;
  social_links: Record<string, unknown> | null;
  fitness_level: string | null;
  date_of_birth: string | null;
  account_tier: "free" | "pro" | null;
  tier_expires_at: string | null;
  is_verified: boolean | null;
  verified_at: string | null;
  partner_host: boolean | null;
  is_banned: boolean | null;
  hosting_banned_until: string | null;
  sessions_hosted: number | null;
  host_rating_avg: number | null;
  host_rating_count: number | null;
  created_at: string;
  // Derived from the most recent admin decision in `notifications`:
  last_decision: "approved" | "rejected" | null;
  last_decision_at: string | null;
  last_decision_actor: string | null;
  last_decision_reason: string | null;
}

interface AuditEntry {
  id: string;
  applicant_id: string;
  applicant_name: string | null;
  decision: "approved" | "rejected";
  actor_id: string | null;
  actor_email: string | null;
  reason: string | null;
  created_at: string;
}

const STATUS_COLOR: Record<DerivedStatus, BadgeColor> = {
  pending: "yellow",
  approved: "green",
  rejected: "red",
};

function deriveStatus(a: Applicant): DerivedStatus {
  // Currently approved trumps any prior rejection (admin can re-approve later).
  if (a.is_verified || a.account_tier === "pro" || a.partner_host) {
    return "approved";
  }
  if (a.last_decision === "rejected") return "rejected";
  return "pending";
}

export default function VerificationsPage() {
  const [tab, setTab] = useState<TabKey>("queue");
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("pending");
  const [actionId, setActionId] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<Applicant | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Pull host-candidate profiles. We treat anyone who has hosted at least
    // one session OR explicitly carries the partner_host flag as a candidate
    // for verification review. Already-verified hosts stay visible so admins
    // can revoke status if needed and so the "approved" tab is meaningful.
    const profilesRes = await supabase
      .from("profiles")
      .select(
        `id, full_name, display_name, username, email, avatar_url, cover_photo_url,
         bio, tagline, location, interests, social_links, fitness_level, date_of_birth,
         account_tier, tier_expires_at, is_verified, verified_at, partner_host,
         is_banned, hosting_banned_until,
         sessions_hosted, host_rating_avg, host_rating_count, created_at`,
      )
      .or("sessions_hosted.gt.0,partner_host.eq.true,is_verified.eq.true,account_tier.eq.pro")
      .order("created_at", { ascending: false })
      .limit(500);

    if (profilesRes.error) {
      setError(profilesRes.error.message);
      setApplicants([]);
      setAudit([]);
      setLoading(false);
      return;
    }

    const candidates = (profilesRes.data ?? []) as Array<
      Omit<
        Applicant,
        "last_decision" | "last_decision_at" | "last_decision_actor" | "last_decision_reason"
      >
    >;

    // Pull every approve/reject decision the admin team has ever made.
    // We filter the audit log + apply "last decision" per applicant in JS
    // rather than running N queries.
    const notifRes = await supabase
      .from("notifications")
      .select("id, user_id, type, data, created_at")
      .in("type", NOTIFICATION_TYPES)
      .order("created_at", { ascending: false })
      .limit(1000);

    if (notifRes.error) {
      // Audit log is non-fatal — surface a soft error but still render queue.
      console.warn("[verifications] notifications query failed:", notifRes.error);
    }

    type NotifRow = {
      id: string;
      user_id: string | null;
      type: string;
      data: Record<string, unknown> | null;
      created_at: string;
    };
    const notifRows = (notifRes.data ?? []) as NotifRow[];

    // Most-recent decision per user
    const latestByUser = new Map<string, NotifRow>();
    for (const n of notifRows) {
      if (!n.user_id) continue;
      if (!latestByUser.has(n.user_id)) latestByUser.set(n.user_id, n);
    }

    const enriched: Applicant[] = candidates.map((p) => {
      const latest = latestByUser.get(p.id);
      const decision: "approved" | "rejected" | null = latest
        ? latest.type === NOTIFICATION_TYPE_APPROVED
          ? "approved"
          : "rejected"
        : null;
      const data = (latest?.data ?? {}) as Record<string, unknown>;
      return {
        ...p,
        last_decision: decision,
        last_decision_at: latest?.created_at ?? null,
        last_decision_actor:
          (data.actor_email as string | undefined) ??
          (data.actor_id as string | undefined) ??
          null,
        last_decision_reason: (data.reason as string | undefined) ?? null,
      };
    });

    setApplicants(enriched);

    // Build the audit entries (every decision, newest first), resolving
    // applicant names from the candidates we already loaded.
    const nameById = new Map<string, string | null>();
    for (const p of candidates) {
      nameById.set(p.id, p.display_name ?? p.full_name ?? null);
    }
    const auditEntries: AuditEntry[] = notifRows.map((n) => {
      const data = (n.data ?? {}) as Record<string, unknown>;
      return {
        id: n.id,
        applicant_id: n.user_id ?? "",
        applicant_name: n.user_id ? (nameById.get(n.user_id) ?? null) : null,
        decision:
          n.type === NOTIFICATION_TYPE_APPROVED ? "approved" : "rejected",
        actor_id: (data.actor_id as string | null) ?? null,
        actor_email: (data.actor_email as string | null) ?? null,
        reason: (data.reason as string | null) ?? null,
        created_at: n.created_at,
      };
    });
    setAudit(auditEntries);

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  async function decide(applicant: Applicant, decision: "approved" | "rejected") {
    if (decision === "rejected" && !reviewNotes.trim()) {
      alert("Please add a brief reason before rejecting.");
      return;
    }

    const admin = await getCurrentUser();
    if (!admin) {
      alert("Your admin session has expired — please sign in again.");
      return;
    }

    setActionId(applicant.id);
    const now = new Date().toISOString();
    const reason = reviewNotes.trim() || null;

    if (decision === "approved") {
      const { error: profErr } = await supabase
        .from("profiles")
        .update({
          is_verified: true,
          verified_at: now,
          account_tier: "pro",
          tier_expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
          partner_host: true,
        })
        .eq("id", applicant.id);
      if (profErr) {
        alert(`Failed to update profile: ${profErr.message}`);
        setActionId(null);
        return;
      }
    }
    // For "rejected" we don't mutate the profile — the rejection is recorded
    // in the notifications log and the user stays at their current status.

    const notifInsert = await supabase.from("notifications").insert({
      user_id: applicant.id,
      type:
        decision === "approved"
          ? NOTIFICATION_TYPE_APPROVED
          : NOTIFICATION_TYPE_REJECTED,
      title:
        decision === "approved"
          ? "You're verified as a Pro host"
          : "Update on your Pro host application",
      body:
        decision === "approved"
          ? "Welcome aboard. Your Pro host status is active — you can now create paid sessions."
          : reason
            ? `We couldn't approve your Pro host application this time. Reason: ${reason}`
            : "We couldn't approve your Pro host application this time. You can re-apply with updated details.",
      data: {
        admin_action: decision,
        actor_id: admin.id,
        actor_email: admin.email ?? null,
        reason,
        actioned_at: now,
      },
    });
    if (notifInsert.error) {
      console.warn("[verifications] notification insert failed:", notifInsert.error);
    }

    // Optimistically reflect the decision in local state, then refetch to
    // pick up any side-effects.
    setApplicants((prev) =>
      prev.map((a) =>
        a.id === applicant.id
          ? {
              ...a,
              ...(decision === "approved"
                ? {
                    is_verified: true,
                    verified_at: now,
                    account_tier: "pro" as const,
                    tier_expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
                    partner_host: true,
                  }
                : {}),
              last_decision: decision,
              last_decision_at: now,
              last_decision_actor: admin.email ?? admin.id,
              last_decision_reason: reason,
            }
          : a,
      ),
    );

    setActionId(null);
    setDrawer(null);
    setReviewNotes("");
    fetchAll();
  }

  async function revoke(applicant: Applicant) {
    if (!confirm(`Revoke Pro/verified status for ${applicant.full_name ?? applicant.id}?`)) {
      return;
    }
    setActionId(applicant.id);
    const { error: profErr } = await supabase
      .from("profiles")
      .update({
        is_verified: false,
        verified_at: null,
        account_tier: "free",
        tier_expires_at: null,
        partner_host: false,
      })
      .eq("id", applicant.id);
    if (profErr) {
      alert(`Failed to revoke: ${profErr.message}`);
      setActionId(null);
      return;
    }
    setActionId(null);
    fetchAll();
  }

  // ─── Filtering / counts ────────────────────────────────────────────────
  const withStatus = applicants.map((a) => ({ ...a, _status: deriveStatus(a) }));
  const counts = {
    pending: withStatus.filter((a) => a._status === "pending").length,
    approved: withStatus.filter((a) => a._status === "approved").length,
    rejected: withStatus.filter((a) => a._status === "rejected").length,
    total: withStatus.length,
  };

  const filtered = withStatus.filter((a) => {
    if (statusFilter !== "all" && a._status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const hay = [
        a.full_name,
        a.display_name,
        a.username,
        a.email,
        a.location,
        (a.interests ?? []).join(" "),
        a.id,
      ]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Pro Host Verifications"
        desc="Review host candidates, verify identity, and grant Pro host access."
      />

      {error && (
        <SectionNote>
          <strong className="text-red-400">Error:</strong>{" "}
          <span className="text-white/70">{error}</span>
        </SectionNote>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Pending"
          value={counts.pending}
          accent={counts.pending > 0}
          sub={counts.pending > 0 ? "Awaiting review" : undefined}
        />
        <StatCard label="Approved" value={counts.approved} />
        <StatCard label="Rejected" value={counts.rejected} accent={counts.rejected > 0} />
        <StatCard label="Total Candidates" value={counts.total} />
      </div>

      <Tabs<TabKey>
        tabs={[
          { key: "queue", label: `Queue (${counts.total})` },
          { key: "audit", label: `Audit Log (${audit.length})` },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "queue" ? (
        <>
          <FilterBar>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search name, email, location, sport…"
            />
            <Select
              value={statusFilter}
              onChange={(v) => setStatusFilter(v as FilterStatus)}
              options={[
                { value: "pending", label: "Pending" },
                { value: "approved", label: "Approved" },
                { value: "rejected", label: "Rejected" },
                { value: "all", label: "All" },
              ]}
            />
            <span className="text-xs text-white/30 font-[family-name:var(--font-dm-sans)]">
              {filtered.length} of {applicants.length}
            </span>
          </FilterBar>

          {loading ? (
            <div className="text-white/30 text-sm py-16 text-center">Loading…</div>
          ) : (
            <AdminTable
              headers={[
                "Applicant",
                "Sports",
                "Location",
                "Hosting",
                "Status",
                "Joined",
                "Last Decision",
                "Actions",
              ]}
              isEmpty={filtered.length === 0}
              empty="No host candidates match these filters."
            >
              {filtered.map((a, i) => {
                const status = a._status;
                const sports = (a.interests ?? []).slice(0, 3).join(", ");
                return (
                  <Tr key={a.id} last={i === filtered.length - 1}>
                    <Td>
                      <div className="flex items-center gap-3">
                        {a.avatar_url ? (
                          <Image
                            src={a.avatar_url}
                            alt={a.full_name ?? "applicant"}
                            width={36}
                            height={36}
                            className="rounded-full object-cover w-9 h-9 border border-white/10"
                            unoptimized
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-white/8 border border-white/10 flex items-center justify-center text-white/40 text-xs font-bold">
                            {(a.full_name ?? a.display_name ?? "?").slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-white truncate flex items-center gap-1.5">
                            {a.display_name ?? a.full_name ?? "—"}
                            {a.is_verified && (
                              <span className="text-[#B6FF00] text-xs" title="Verified">✓</span>
                            )}
                          </p>
                          <p className="text-white/30 text-xs mt-0.5 font-mono truncate">
                            {a.email ?? a.id.slice(0, 12) + "…"}
                          </p>
                        </div>
                      </div>
                    </Td>
                    <Td dim>{sports || "—"}</Td>
                    <Td dim>{a.location ?? "—"}</Td>
                    <Td dim>
                      {a.sessions_hosted ?? 0} hosted
                      {a.host_rating_avg != null && (a.host_rating_count ?? 0) > 0 && (
                        <span className="text-white/30 ml-1">
                          · {a.host_rating_avg.toFixed(1)}★ ({a.host_rating_count})
                        </span>
                      )}
                    </Td>
                    <Td>
                      <div className="flex flex-wrap gap-1.5">
                        <Badge label={status} color={STATUS_COLOR[status]} />
                        {a.account_tier === "pro" && (
                          <Badge label="Pro" color="blue" />
                        )}
                        {a.partner_host && (
                          <Badge label="Partner" color="purple" />
                        )}
                        {a.is_banned && <Badge label="Banned" color="red" />}
                      </div>
                    </Td>
                    <Td dim>
                      {new Date(a.created_at).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </Td>
                    <Td dim>
                      {a.last_decision ? (
                        <>
                          <span
                            className={
                              a.last_decision === "approved"
                                ? "text-[#B6FF00]"
                                : "text-red-400"
                            }
                          >
                            {a.last_decision}
                          </span>
                          {a.last_decision_at && (
                            <p className="text-white/30 text-[10px] mt-0.5">
                              {new Date(a.last_decision_at).toLocaleString("en-GB")}
                            </p>
                          )}
                        </>
                      ) : (
                        "—"
                      )}
                    </Td>
                    <Td>
                      <div className="flex items-center gap-3 justify-end whitespace-nowrap">
                        <button
                          onClick={() => {
                            setDrawer(a);
                            setReviewNotes("");
                          }}
                          className="text-xs text-white/50 hover:text-white transition-colors"
                        >
                          Review
                        </button>
                        {status === "approved" && (
                          <button
                            onClick={() => revoke(a)}
                            disabled={actionId === a.id}
                            className="text-xs text-red-400/70 hover:text-red-400 transition-colors disabled:opacity-50"
                          >
                            {actionId === a.id ? "…" : "Revoke"}
                          </button>
                        )}
                      </div>
                    </Td>
                  </Tr>
                );
              })}
            </AdminTable>
          )}
        </>
      ) : (
        <AuditLog audit={audit} loading={loading} />
      )}

      {drawer && (
        <ReviewDrawer
          applicant={drawer}
          status={deriveStatus(drawer)}
          notes={reviewNotes}
          setNotes={setReviewNotes}
          onClose={() => {
            setDrawer(null);
            setReviewNotes("");
          }}
          onApprove={() => decide(drawer, "approved")}
          onReject={() => decide(drawer, "rejected")}
          busy={actionId === drawer.id}
        />
      )}
    </div>
  );
}

/* ─── Audit Log Tab ─────────────────────────────────────────────────────── */

function AuditLog({ audit, loading }: { audit: AuditEntry[]; loading: boolean }) {
  if (loading) {
    return <div className="text-white/30 text-sm py-16 text-center">Loading…</div>;
  }
  return (
    <AdminTable
      headers={["When", "Applicant", "Decision", "Actor", "Reason"]}
      isEmpty={audit.length === 0}
      empty="No verification decisions recorded yet."
    >
      {audit.map((a, i) => (
        <Tr key={a.id} last={i === audit.length - 1}>
          <Td dim>
            {new Date(a.created_at).toLocaleString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Td>
          <Td>{a.applicant_name ?? a.applicant_id.slice(0, 12) + "…"}</Td>
          <Td>
            <Badge
              label={a.decision}
              color={a.decision === "approved" ? "green" : "red"}
            />
          </Td>
          <Td mono dim>
            {a.actor_email ?? a.actor_id ?? "system"}
          </Td>
          <Td>
            <span className="text-white/60 text-xs">{a.reason ?? "—"}</span>
          </Td>
        </Tr>
      ))}
    </AdminTable>
  );
}

/* ─── Review Drawer ─────────────────────────────────────────────────────── */

function ReviewDrawer({
  applicant,
  status,
  notes,
  setNotes,
  onClose,
  onApprove,
  onReject,
  busy,
}: {
  applicant: Applicant;
  status: DerivedStatus;
  notes: string;
  setNotes: (v: string) => void;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  busy: boolean;
}) {
  const sports = (applicant.interests ?? []).join(", ") || "—";
  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Review Pro host applicant"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <aside
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl h-full bg-[#0a0a0a] border-l border-white/10 overflow-y-auto"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-white/8 bg-[#0a0a0a]/95 backdrop-blur">
          <div>
            <p className="text-xs text-white/40 uppercase tracking-widest font-[family-name:var(--font-dm-sans)]">
              Applicant
            </p>
            <h2 className="text-lg font-bold text-white font-[family-name:var(--font-barlow-condensed)] uppercase">
              {applicant.display_name ?? applicant.full_name ?? "Unnamed"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white text-xl leading-none w-8 h-8 flex items-center justify-center rounded hover:bg-white/5"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-6 space-y-6 font-[family-name:var(--font-dm-sans)]">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Email</p>
              <p className="text-white/80 font-mono text-xs break-all">
                {applicant.email ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Status</p>
              <div className="flex flex-wrap gap-1.5">
                <Badge label={status} color={STATUS_COLOR[status]} />
                {applicant.account_tier === "pro" && (
                  <Badge label="Pro" color="blue" />
                )}
                {applicant.partner_host && (
                  <Badge label="Partner" color="purple" />
                )}
              </div>
            </div>
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Sports</p>
              <p className="text-white/80">{sports}</p>
            </div>
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Location</p>
              <p className="text-white/80">{applicant.location ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Joined</p>
              <p className="text-white/80">
                {new Date(applicant.created_at).toLocaleDateString("en-GB")}
              </p>
            </div>
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider mb-1">User ID</p>
              <p className="text-white/60 font-mono text-xs break-all">{applicant.id}</p>
            </div>
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider mb-1">
                Sessions Hosted
              </p>
              <p className="text-white/80">{applicant.sessions_hosted ?? 0}</p>
            </div>
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Host Rating</p>
              <p className="text-white/80">
                {applicant.host_rating_avg != null && (applicant.host_rating_count ?? 0) > 0
                  ? `${applicant.host_rating_avg.toFixed(1)}★ (${applicant.host_rating_count})`
                  : "No ratings yet"}
              </p>
            </div>
            {applicant.fitness_level && (
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider mb-1">
                  Fitness Level
                </p>
                <p className="text-white/80 capitalize">{applicant.fitness_level}</p>
              </div>
            )}
            {applicant.username && (
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Username</p>
                <p className="text-white/80 font-mono text-xs">@{applicant.username}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <ProfileImageTile label="Profile Photo" url={applicant.avatar_url} />
            <ProfileImageTile label="Cover Photo" url={applicant.cover_photo_url} />
          </div>

          {applicant.tagline && (
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Tagline</p>
              <p className="text-white/80 text-sm italic">&ldquo;{applicant.tagline}&rdquo;</p>
            </div>
          )}

          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider mb-2">
              Bio / Application Notes
            </p>
            <div className="rounded-xl border border-white/8 bg-white/3 p-4 text-sm text-white/80 whitespace-pre-wrap">
              {applicant.bio ?? "—"}
            </div>
          </div>

          {applicant.social_links &&
            Object.keys(applicant.social_links).length > 0 && (
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider mb-2">
                  Social Links
                </p>
                <div className="rounded-xl border border-white/8 bg-white/3 p-4 text-xs space-y-1">
                  {Object.entries(applicant.social_links).map(([key, val]) => (
                    <div key={key} className="flex gap-2">
                      <span className="text-white/40 uppercase tracking-wider min-w-[80px]">
                        {key}
                      </span>
                      <span className="text-white/80 font-mono break-all">
                        {String(val)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {applicant.last_decision && applicant.last_decision_at && (
            <div className="rounded-xl border border-white/8 bg-white/3 p-4 text-sm">
              <p className="text-xs text-white/40 uppercase tracking-wider mb-2">
                Last Decision
              </p>
              <p className="text-white/70">
                <span
                  className={
                    applicant.last_decision === "approved"
                      ? "text-[#B6FF00]"
                      : "text-red-400"
                  }
                >
                  {applicant.last_decision}
                </span>{" "}
                <span className="text-white/50">
                  by {applicant.last_decision_actor ?? "unknown"} ·{" "}
                  {new Date(applicant.last_decision_at).toLocaleString("en-GB")}
                </span>
              </p>
              {applicant.last_decision_reason && (
                <p className="mt-2 text-white/60 italic">
                  &ldquo;{applicant.last_decision_reason}&rdquo;
                </p>
              )}
            </div>
          )}

          <FormField
            label="Review Notes"
            hint="Required when rejecting. Sent to the applicant in their notification."
          >
            <TextArea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Profile photo unclear — please upload a clearer image and re-apply."
            />
          </FormField>

          <div className="flex flex-wrap gap-3 pt-2 border-t border-white/8">
            <PrimaryButton onClick={onApprove} disabled={busy}>
              {busy ? "Saving…" : status === "approved" ? "Re-approve" : "Approve as Pro"}
            </PrimaryButton>
            <button
              onClick={onReject}
              disabled={busy}
              className="px-5 py-2 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors font-[family-name:var(--font-barlow-condensed)] text-sm uppercase tracking-wide font-bold disabled:opacity-50"
            >
              {busy ? "…" : "Reject"}
            </button>
            <GhostButton onClick={onClose} disabled={busy}>
              Cancel
            </GhostButton>
          </div>
        </div>
      </aside>
    </div>
  );
}

function ProfileImageTile({ label, url }: { label: string; url: string | null }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/3 overflow-hidden">
      <div className="px-3 py-2 border-b border-white/8 flex items-center justify-between">
        <span className="text-xs text-white/40 uppercase tracking-wider font-[family-name:var(--font-dm-sans)]">
          {label}
        </span>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#B6FF3B] hover:underline font-[family-name:var(--font-dm-sans)]"
          >
            Open ↗
          </a>
        )}
      </div>
      <div className="aspect-[4/3] bg-black/40 flex items-center justify-center">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={label} className="w-full h-full object-cover" />
        ) : (
          <span className="text-white/30 text-xs font-[family-name:var(--font-dm-sans)]">
            Not provided
          </span>
        )}
      </div>
    </div>
  );
}
