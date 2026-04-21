// app/admin/notifications/page.tsx — Notifications & Comms
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  PageHeader, AdminTable, Tr, Td, Badge, FilterBar, Select, StatCard,
  SectionNote, Tabs, FormField, TextInput, TextArea, PrimaryButton,
} from "@/components/admin/AdminUI";
import type { BadgeColor } from "@/components/admin/AdminUI";

type TabKey = "log" | "queue" | "email" | "tokens" | "broadcast";

interface NotificationRow {
  id: string;
  user_id: string | null;
  type: string;
  title: string | null;
  body: string | null;
  read_at: string | null;
  created_at: string;
  user_name: string | null;
}

interface QueueRow {
  id: string;
  type: string;
  status: string;
  attempts: number;
  error_message: string | null;
  created_at: string;
  processed_at: string | null;
}

interface EmailLogRow {
  id: string;
  session_id: string | null;
  user_id: string | null;
  recipient: string;
  template: string;
  resend_id: string | null;
  status: string;
  created_at: string;
}

interface DeviceToken {
  id: string;
  user_id: string | null;
  platform: string;
  device_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user_name: string | null;
}

function statusColor(s: string): BadgeColor {
  const l = s.toLowerCase();
  if (["sent", "succeeded", "processed", "delivered"].includes(l)) return "green";
  if (["pending", "queued", "processing"].includes(l)) return "yellow";
  if (["failed", "error", "rejected"].includes(l)) return "red";
  return "gray";
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
  { value: "pro", label: "Pro Accounts" },
];

export default function NotificationsPage() {
  const [tab, setTab] = useState<TabKey>("log");
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [queue, setQueue] = useState<QueueRow[]>([]);
  const [emails, setEmails] = useState<EmailLogRow[]>([]);
  const [tokens, setTokens] = useState<DeviceToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");

  // Broadcast form
  const [bcTitle, setBcTitle] = useState("");
  const [bcBody, setBcBody] = useState("");
  const [bcSegment, setBcSegment] = useState("all");
  const [bcDeepLink, setBcDeepLink] = useState("");
  const [sending, setSending] = useState(false);
  const [sendMsg, setSendMsg] = useState("");

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [nRes, qRes, eRes, tRes] = await Promise.all([
      supabase.from("notifications")
        .select("id, user_id, type, title, body, read_at, created_at, profiles:user_id(full_name)")
        .order("created_at", { ascending: false })
        .limit(300),
      supabase.from("notification_queue")
        .select("id, type, status, attempts, error_message, created_at, processed_at")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase.from("email_log")
        .select("id, session_id, user_id, recipient, template, resend_id, status, created_at")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase.from("device_tokens")
        .select("id, user_id, platform, device_name, is_active, created_at, updated_at, profiles:user_id(full_name)")
        .order("updated_at", { ascending: false })
        .limit(300),
    ]);

    setNotifications((nRes.data ?? []).map((n: Record<string, unknown>) => ({
      ...n,
      user_name: (n.profiles as { full_name: string } | null)?.full_name ?? null,
    })) as NotificationRow[]);
    setQueue((qRes.data as QueueRow[]) ?? []);
    setEmails((eRes.data as EmailLogRow[]) ?? []);
    setTokens((tRes.data ?? []).map((t: Record<string, unknown>) => ({
      ...t,
      user_name: (t.profiles as { full_name: string } | null)?.full_name ?? null,
    })) as DeviceToken[]);
    setLoading(false);
  }

  async function sendBroadcast() {
    if (!bcTitle || !bcBody) {
      setSendMsg("Title and body are required.");
      return;
    }
    setSending(true);
    setSendMsg("");
    try {
      const { error } = await supabase.from("notification_queue").insert({
        type: "broadcast",
        payload: {
          title: bcTitle,
          body: bcBody,
          segment: bcSegment,
          deep_link: bcDeepLink || null,
          queued_at: new Date().toISOString(),
        },
        status: "pending",
      });
      if (error) throw error;
      setSendMsg("✓ Broadcast queued. Your worker will pick it up.");
      setBcTitle("");
      setBcBody("");
      setBcDeepLink("");
      fetchAll();
    } catch (e) {
      setSendMsg("Failed to queue: " + (e instanceof Error ? e.message : "unknown"));
    } finally {
      setSending(false);
    }
  }

  const unreadCount = notifications.filter((n) => !n.read_at).length;
  const pendingQueue = queue.filter((q) => q.status === "pending").length;
  const failedQueue = queue.filter((q) => q.status === "failed").length;
  const activeTokens = tokens.filter((t) => t.is_active).length;

  const filteredNotifs = typeFilter === "all" ? notifications : notifications.filter((n) => n.type === typeFilter);
  const notifTypes = Array.from(new Set(notifications.map((n) => n.type).filter(Boolean)));

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader title="Notifications" desc="Notification log, queue, email log, device tokens, broadcasts." />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard label="Notifications Sent" value={notifications.length.toLocaleString()} />
        <StatCard label="Unread" value={unreadCount} />
        <StatCard label="Queue Pending" value={pendingQueue} accent={pendingQueue > 0} />
        <StatCard label="Queue Failed" value={failedQueue} accent={failedQueue > 0} />
        <StatCard label="Active Devices" value={activeTokens} />
      </div>

      <Tabs<TabKey>
        tabs={[
          { key: "log", label: `Notifications (${notifications.length})` },
          { key: "queue", label: `Queue${pendingQueue > 0 ? ` (${pendingQueue})` : ""}` },
          { key: "email", label: `Email Log (${emails.length})` },
          { key: "tokens", label: `Device Tokens (${activeTokens})` },
          { key: "broadcast", label: "📢 Broadcast" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {loading && tab !== "broadcast" ? (
        <div className="text-white/30 text-sm py-16 text-center">Loading…</div>
      ) : tab === "log" ? (
        <>
          <FilterBar>
            <Select
              value={typeFilter}
              onChange={setTypeFilter}
              options={[{ value: "all", label: "All Types" }, ...notifTypes.map((t) => ({ value: t, label: t }))]}
            />
            <span className="text-xs text-white/30 font-[family-name:var(--font-dm-sans)]">
              {filteredNotifs.length} notifications
            </span>
          </FilterBar>
          <AdminTable
            headers={["User", "Type", "Title", "Body", "Read", "Date"]}
            isEmpty={filteredNotifs.length === 0}
            empty="No notifications."
          >
            {filteredNotifs.map((n, i) => (
              <Tr key={n.id} last={i === filteredNotifs.length - 1}>
                <Td dim>{n.user_name ?? (n.user_id ? n.user_id.slice(0, 8) + "…" : "—")}</Td>
                <Td><Badge label={n.type} color="blue" /></Td>
                <Td>{n.title ?? "—"}</Td>
                <Td dim><span className="line-clamp-1 max-w-[240px] block">{n.body ?? "—"}</span></Td>
                <Td>
                  <Badge
                    label={n.read_at ? "Read" : "Unread"}
                    color={n.read_at ? "gray" : "green"}
                  />
                </Td>
                <Td dim>{new Date(n.created_at).toLocaleDateString("en-GB")}</Td>
              </Tr>
            ))}
          </AdminTable>
        </>
      ) : tab === "queue" ? (
        <AdminTable
          headers={["Type", "Status", "Attempts", "Error", "Created", "Processed"]}
          isEmpty={queue.length === 0}
          empty="Queue is empty."
        >
          {queue.map((q, i) => (
            <Tr key={q.id} last={i === queue.length - 1}>
              <Td><Badge label={q.type} color="blue" /></Td>
              <Td><Badge label={q.status} color={statusColor(q.status)} /></Td>
              <Td dim>{q.attempts}</Td>
              <Td dim><span className="line-clamp-1 max-w-[240px] block text-red-400/70">{q.error_message ?? "—"}</span></Td>
              <Td dim>{new Date(q.created_at).toLocaleDateString("en-GB")}</Td>
              <Td dim>{q.processed_at ? new Date(q.processed_at).toLocaleDateString("en-GB") : "—"}</Td>
            </Tr>
          ))}
        </AdminTable>
      ) : tab === "email" ? (
        <AdminTable
          headers={["Recipient", "Template", "Status", "Resend ID", "Session", "Date"]}
          isEmpty={emails.length === 0}
          empty="No emails logged."
        >
          {emails.map((e, i) => (
            <Tr key={e.id} last={i === emails.length - 1}>
              <Td mono dim>{e.recipient}</Td>
              <Td><Badge label={e.template} color="blue" /></Td>
              <Td><Badge label={e.status} color={statusColor(e.status)} /></Td>
              <Td mono dim>{e.resend_id ? e.resend_id.slice(0, 14) + "…" : "—"}</Td>
              <Td mono dim>{e.session_id ? e.session_id.slice(0, 8) + "…" : "—"}</Td>
              <Td dim>{new Date(e.created_at).toLocaleDateString("en-GB")}</Td>
            </Tr>
          ))}
        </AdminTable>
      ) : tab === "tokens" ? (
        <AdminTable
          headers={["User", "Platform", "Device", "Active", "Updated"]}
          isEmpty={tokens.length === 0}
          empty="No registered devices."
        >
          {tokens.map((t, i) => (
            <Tr key={t.id} last={i === tokens.length - 1}>
              <Td dim>{t.user_name ?? (t.user_id ? t.user_id.slice(0, 10) + "…" : "—")}</Td>
              <Td><Badge label={t.platform} color={t.platform === "ios" ? "blue" : t.platform === "android" ? "green" : "gray"} /></Td>
              <Td dim>{t.device_name ?? "—"}</Td>
              <Td><Badge label={t.is_active ? "Active" : "Inactive"} color={t.is_active ? "green" : "gray"} /></Td>
              <Td dim>{new Date(t.updated_at).toLocaleDateString("en-GB")}</Td>
            </Tr>
          ))}
        </AdminTable>
      ) : (
        <div className="max-w-lg">
          <SectionNote>
            Broadcasts are written to <code className="font-mono">notification_queue</code> with <code className="font-mono">type=&apos;broadcast&apos;</code>. Your FCM Edge Function should poll this table and fan-out to matching device tokens.
          </SectionNote>
          <div className="space-y-4">
            <FormField label="Title">
              <TextInput
                value={bcTitle}
                onChange={(e) => setBcTitle(e.target.value)}
                placeholder="e.g. New sessions near you!"
              />
            </FormField>
            <FormField label="Body">
              <TextArea
                value={bcBody}
                onChange={(e) => setBcBody(e.target.value)}
                placeholder="Push notification body text…"
                rows={3}
              />
            </FormField>
            <FormField label="Audience Segment">
              <Select value={bcSegment} onChange={setBcSegment} options={SPORT_SEGMENTS} />
            </FormField>
            <FormField label="Deep Link (optional)" hint="e.g. fittrybe://sessions">
              <TextInput
                value={bcDeepLink}
                onChange={(e) => setBcDeepLink(e.target.value)}
                placeholder="fittrybe://sessions"
              />
            </FormField>
            {sendMsg && (
              <p className={`text-sm font-[family-name:var(--font-dm-sans)] ${sendMsg.startsWith("✓") ? "text-[#B6FF00]" : "text-red-400"}`}>
                {sendMsg}
              </p>
            )}
            <PrimaryButton onClick={sendBroadcast} disabled={sending}>
              {sending ? "Queuing…" : "Send Broadcast"}
            </PrimaryButton>
          </div>
        </div>
      )}
    </div>
  );
}
