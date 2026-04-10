// app/admin/notifications/page.tsx — Notifications & Comms
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  PageHeader, AdminTable, Tr, Td, Badge, FilterBar, Select, StatCard, SectionNote
} from "@/components/admin/AdminUI";

interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  title: string | null;
  body: string | null;
  read: boolean;
  created_at: string;
  user_name: string | null;
}

interface EmailLog {
  id: string;
  to_email: string;
  subject: string | null;
  type: string | null;
  status: "sent" | "failed" | "pending";
  created_at: string;
}

const SPORT_SEGMENTS = [
  { value: "all", label: "All Users" },
  { value: "football", label: "Football Players" },
  { value: "basketball", label: "Basketball Players" },
  { value: "racket", label: "Racket Players" },
  { value: "running", label: "Runners" },
  { value: "cycling", label: "Cyclists" },
  { value: "gym", label: "Gym-goers" },
  { value: "hosts", label: "Hosts Only" },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"log" | "email" | "broadcast">("log");
  const [typeFilter, setTypeFilter] = useState("all");

  // Broadcast form
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastBody, setBroadcastBody] = useState("");
  const [broadcastSegment, setBroadcastSegment] = useState("all");
  const [broadcastDeepLink, setBroadcastDeepLink] = useState("");
  const [sending, setSending] = useState(false);
  const [sendMsg, setSendMsg] = useState("");

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [notifRes, emailRes] = await Promise.all([
      supabase
        .from("notifications")
        .select("id, user_id, type, title, body, read, created_at, profiles:user_id(full_name)")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("email_log")
        .select("id, to_email, subject, type, status, created_at")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

    setNotifications((notifRes.data ?? []).map((n: Record<string, unknown>) => ({
      ...n,
      user_name: (n.profiles as { full_name: string } | null)?.full_name ?? null,
    })) as NotificationRow[]);
    setEmailLogs(emailRes.data as EmailLog[] ?? []);
    setLoading(false);
  }

  async function sendBroadcast() {
    if (!broadcastTitle || !broadcastBody) {
      setSendMsg("Title and body are required.");
      return;
    }
    setSending(true);
    setSendMsg("");
    try {
      // Insert broadcast record — your Edge Function / backend picks this up
      const { error } = await supabase.from("admin_broadcasts").insert({
        title: broadcastTitle,
        body: broadcastBody,
        segment: broadcastSegment,
        deep_link: broadcastDeepLink || null,
        sent_at: new Date().toISOString(),
      });
      if (error) throw error;
      setSendMsg("✓ Broadcast queued successfully.");
      setBroadcastTitle("");
      setBroadcastBody("");
      setBroadcastDeepLink("");
    } catch {
      setSendMsg("Failed to queue broadcast. Check admin_broadcasts table exists.");
    } finally {
      setSending(false);
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filteredNotifs = typeFilter === "all" ? notifications : notifications.filter((n) => n.type === typeFilter);
  const notifTypes = Array.from(new Set(notifications.map((n) => n.type).filter(Boolean)));

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title="Notifications" desc="Push notification log, email log, and broadcast tools." />

      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Notifications Sent" value={notifications.length.toLocaleString()} />
        <StatCard label="Unread" value={unreadCount} />
        <StatCard label="Emails Logged" value={emailLogs.length} />
      </div>

      <div className="flex gap-2 mb-6">
        {([
          { key: "log", label: "Notification Log" },
          { key: "email", label: "Email Log" },
          { key: "broadcast", label: "📢 Broadcast" },
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

      {loading && tab !== "broadcast" ? (
        <div className="text-white/30 text-sm py-16 text-center">Loading…</div>
      ) : tab === "log" ? (
        <>
          <FilterBar>
            <Select
              value={typeFilter}
              onChange={setTypeFilter}
              options={[
                { value: "all", label: "All Types" },
                ...notifTypes.map((t) => ({ value: t, label: t })),
              ]}
            />
            <span className="text-xs text-white/30 font-[family-name:var(--font-dm-sans)]">{filteredNotifs.length} notifications</span>
          </FilterBar>
          <AdminTable
            headers={["User", "Type", "Title", "Body", "Read", "Date"]}
            isEmpty={filteredNotifs.length === 0}
            empty="No notifications."
          >
            {filteredNotifs.map((n, i) => (
              <Tr key={n.id} last={i === filteredNotifs.length - 1}>
                <Td dim>{n.user_name ?? n.user_id.slice(0, 8) + "…"}</Td>
                <Td><Badge label={n.type} color="blue" /></Td>
                <Td>{n.title ?? "—"}</Td>
                <Td dim><span className="line-clamp-1 max-w-[200px] block">{n.body ?? "—"}</span></Td>
                <Td><Badge label={n.read ? "Read" : "Unread"} color={n.read ? "gray" : "green"} /></Td>
                <Td dim>{new Date(n.created_at).toLocaleDateString("en-GB")}</Td>
              </Tr>
            ))}
          </AdminTable>
        </>
      ) : tab === "email" ? (
        <AdminTable
          headers={["To", "Subject", "Type", "Status", "Date"]}
          isEmpty={emailLogs.length === 0}
          empty="No emails logged."
        >
          {emailLogs.map((e, i) => (
            <Tr key={e.id} last={i === emailLogs.length - 1}>
              <Td mono dim>{e.to_email}</Td>
              <Td dim>{e.subject ?? "—"}</Td>
              <Td><Badge label={e.type ?? "—"} color="blue" /></Td>
              <Td>
                <Badge
                  label={e.status}
                  color={e.status === "sent" ? "green" : e.status === "failed" ? "red" : "yellow"}
                />
              </Td>
              <Td dim>{new Date(e.created_at).toLocaleDateString("en-GB")}</Td>
            </Tr>
          ))}
        </AdminTable>
      ) : (
        <div className="max-w-lg">
          <SectionNote>
            Broadcasts are queued in the <code className="font-mono">admin_broadcasts</code> table and dispatched via your FCM Edge Function. Ensure that function is listening.
          </SectionNote>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-white/40 uppercase tracking-wider font-[family-name:var(--font-dm-sans)] block mb-1.5">Title</label>
              <input
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                placeholder="e.g. New sessions near you!"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/30 font-[family-name:var(--font-dm-sans)] focus:outline-none focus:border-[#B6FF00]/40"
              />
            </div>
            <div>
              <label className="text-xs text-white/40 uppercase tracking-wider font-[family-name:var(--font-dm-sans)] block mb-1.5">Body</label>
              <textarea
                value={broadcastBody}
                onChange={(e) => setBroadcastBody(e.target.value)}
                placeholder="Push notification body text…"
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/30 font-[family-name:var(--font-dm-sans)] focus:outline-none focus:border-[#B6FF00]/40 resize-none"
              />
            </div>
            <div>
              <label className="text-xs text-white/40 uppercase tracking-wider font-[family-name:var(--font-dm-sans)] block mb-1.5">Audience Segment</label>
              <Select value={broadcastSegment} onChange={setBroadcastSegment} options={SPORT_SEGMENTS} />
            </div>
            <div>
              <label className="text-xs text-white/40 uppercase tracking-wider font-[family-name:var(--font-dm-sans)] block mb-1.5">Deep Link (optional)</label>
              <input
                value={broadcastDeepLink}
                onChange={(e) => setBroadcastDeepLink(e.target.value)}
                placeholder="fittrybe://sessions"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/30 font-[family-name:var(--font-dm-sans)] focus:outline-none focus:border-[#B6FF00]/40"
              />
            </div>
            {sendMsg && (
              <p className={`text-sm font-[family-name:var(--font-dm-sans)] ${sendMsg.startsWith("✓") ? "text-[#B6FF00]" : "text-red-400"}`}>
                {sendMsg}
              </p>
            )}
            <button
              onClick={sendBroadcast}
              disabled={sending}
              className="px-6 py-2.5 bg-[#B6FF00] text-black font-bold rounded-xl hover:bg-[#B6FF00]/90 transition-colors font-[family-name:var(--font-barlow-condensed)] text-sm uppercase tracking-wide disabled:opacity-50"
            >
              {sending ? "Sending…" : "Send Broadcast"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
