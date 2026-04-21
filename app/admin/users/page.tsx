// app/admin/users/page.tsx — User Management
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  PageHeader, AdminTable, Tr, Td, Badge, FilterBar, SearchInput, Select,
  ActionButton, StatCard, Tabs,
} from "@/components/admin/AdminUI";

type AccountTier = "free" | "pro";
type FilterMode = "all" | "banned" | "verified" | "pro" | "low_reliability" | "active_24h";

interface UserRow {
  id: string;
  full_name: string | null;
  display_name: string | null;
  username: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
  reliability_score: number | null;
  sessions_hosted: number | null;
  sessions_attended: number | null;
  sessions_noshow: number | null;
  is_banned: boolean | null;
  banned_until: string | null;
  ban_reason: string | null;
  is_verified: boolean | null;
  account_tier: AccountTier | null;
  tier_expires_at: string | null;
  report_count: number | null;
  is_online: boolean | null;
  last_seen: string | null;
  location: string | null;
}

interface WaitlistRow {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

type TabKey = "users" | "waitlist";

export default function UsersPage() {
  const [tab, setTab] = useState<TabKey>("users");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterMode>("all");
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [uRes, wRes] = await Promise.all([
      supabase
        .from("profiles")
        .select(`id, full_name, display_name, username, email, avatar_url, created_at,
                 reliability_score, sessions_hosted, sessions_attended, sessions_noshow,
                 is_banned, banned_until, ban_reason, is_verified, account_tier, tier_expires_at,
                 report_count, is_online, last_seen, location`)
        .order("created_at", { ascending: false })
        .limit(500),
      supabase.from("waitlist").select("*").order("createdAt", { ascending: false }).limit(500),
    ]);
    setUsers(uRes.data as UserRow[] ?? []);
    setWaitlist(wRes.data as WaitlistRow[] ?? []);
    setLoading(false);
  }

  async function toggleBan(user: UserRow) {
    const willBan = !user.is_banned;
    let reason: string | null = null;
    if (willBan) {
      reason = window.prompt(`Ban "${user.full_name ?? user.id}" — reason?`, "Terms violation");
      if (reason == null) return;
    }
    setActionId(user.id);
    const patch = willBan
      ? { is_banned: true, banned_at: new Date().toISOString(), ban_reason: reason }
      : { is_banned: false, banned_at: null, ban_reason: null, banned_until: null };
    const { error } = await supabase.from("profiles").update(patch).eq("id", user.id);
    if (!error) setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, ...patch } : u));
    setActionId(null);
  }

  async function toggleVerify(user: UserRow) {
    setActionId(user.id);
    const willVerify = !user.is_verified;
    const patch = willVerify
      ? { is_verified: true, verified_at: new Date().toISOString() }
      : { is_verified: false, verified_at: null };
    await supabase.from("profiles").update(patch).eq("id", user.id);
    setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, ...patch } : u));
    setActionId(null);
  }

  async function toggleTier(user: UserRow) {
    setActionId(user.id);
    const newTier: AccountTier = user.account_tier === "pro" ? "free" : "pro";
    const patch = newTier === "pro"
      ? { account_tier: newTier, tier_expires_at: new Date(Date.now() + 30 * 86400000).toISOString() }
      : { account_tier: newTier, tier_expires_at: null };
    await supabase.from("profiles").update(patch).eq("id", user.id);
    setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, ...patch } : u));
    setActionId(null);
  }

  async function adjustReliability(user: UserRow) {
    const val = window.prompt(
      `New reliability score for ${user.full_name ?? user.id} (0–100):`,
      String(user.reliability_score ?? 100),
    );
    if (!val) return;
    const score = parseFloat(val);
    if (isNaN(score) || score < 0 || score > 100) return;
    setActionId(user.id);
    await supabase.from("profiles").update({ reliability_score: score }).eq("id", user.id);
    setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, reliability_score: score } : u));
    setActionId(null);
  }

  async function deleteWaitlist(id: string) {
    if (!confirm("Remove this entry from waitlist?")) return;
    setActionId(id);
    await supabase.from("waitlist").delete().eq("id", id);
    setWaitlist((prev) => prev.filter((w) => w.id !== id));
    setActionId(null);
  }

  // Filtering
  const now = Date.now();
  const filteredUsers = users.filter((u) => {
    if (filter === "banned" && !u.is_banned) return false;
    if (filter === "verified" && !u.is_verified) return false;
    if (filter === "pro" && u.account_tier !== "pro") return false;
    if (filter === "low_reliability" && (u.reliability_score ?? 100) >= 50) return false;
    if (filter === "active_24h" && (!u.last_seen || now - new Date(u.last_seen).getTime() > 86400000)) return false;

    if (search) {
      const q = search.toLowerCase();
      const hay = [u.full_name, u.display_name, u.username, u.email, u.id].join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const filteredWaitlist = waitlist.filter((w) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return w.name.toLowerCase().includes(q) || w.email.toLowerCase().includes(q);
  });

  const banned = users.filter((u) => u.is_banned).length;
  const verified = users.filter((u) => u.is_verified).length;
  const pro = users.filter((u) => u.account_tier === "pro").length;
  const lowReliability = users.filter((u) => (u.reliability_score ?? 100) < 50).length;

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader title="User Management" desc="Full user directory — search, inspect, ban, verify, promote." />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard label="Total Users" value={users.length.toLocaleString()} />
        <StatCard label="Banned" value={banned} accent={banned > 0} />
        <StatCard label="Verified" value={verified} />
        <StatCard label="Pro Accounts" value={pro} accent={pro > 0} />
        <StatCard label="Low Reliability" value={lowReliability} accent={lowReliability > 0} sub="< 50 score" />
      </div>

      <Tabs<TabKey>
        tabs={[
          { key: "users", label: `Users (${users.length})` },
          { key: "waitlist", label: `Waitlist (${waitlist.length})` },
        ]}
        active={tab}
        onChange={setTab}
      />

      {loading ? (
        <div className="text-white/30 text-sm py-16 text-center">Loading…</div>
      ) : tab === "users" ? (
        <>
          <FilterBar>
            <SearchInput value={search} onChange={setSearch} placeholder="Search name, email, username, ID…" />
            <Select
              value={filter}
              onChange={(v) => setFilter(v as FilterMode)}
              options={[
                { value: "all", label: "All Users" },
                { value: "banned", label: "Banned" },
                { value: "verified", label: "Verified Only" },
                { value: "pro", label: "Pro Only" },
                { value: "low_reliability", label: "Low Reliability (<50)" },
                { value: "active_24h", label: "Active Last 24h" },
              ]}
            />
            <span className="text-xs text-white/30 font-[family-name:var(--font-dm-sans)]">
              {filteredUsers.length} of {users.length}
            </span>
          </FilterBar>

          <AdminTable
            headers={["User", "Tier", "Reliability", "Hosted / Attended", "No-shows", "Reports", "Joined", "Status", "Actions"]}
            isEmpty={filteredUsers.length === 0}
            empty="No users found."
          >
            {filteredUsers.map((user, i) => (
              <Tr key={user.id} last={i === filteredUsers.length - 1}>
                <Td>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-white">{user.display_name ?? user.full_name ?? "—"}</p>
                    {user.is_verified && <span className="text-[#B6FF00] text-xs">✓</span>}
                    {user.is_online && <span className="w-1.5 h-1.5 rounded-full bg-[#B6FF00]" title="online" />}
                  </div>
                  <p className="text-white/40 text-xs mt-0.5 font-mono">
                    {user.email ?? user.username ?? user.id.slice(0, 12) + "…"}
                  </p>
                </Td>
                <Td>
                  <Badge
                    label={user.account_tier === "pro" ? "Pro" : "Free"}
                    color={user.account_tier === "pro" ? "blue" : "gray"}
                  />
                </Td>
                <Td>
                  <button
                    onClick={() => adjustReliability(user)}
                    disabled={actionId === user.id}
                    className={`text-sm font-bold font-[family-name:var(--font-barlow-condensed)] transition-colors hover:text-[#B6FF00] ${
                      (user.reliability_score ?? 100) < 50 ? "text-red-400" : "text-white/70"
                    }`}
                  >
                    {user.reliability_score?.toFixed(0) ?? "—"}
                  </button>
                </Td>
                <Td dim>{user.sessions_hosted ?? 0} / {user.sessions_attended ?? 0}</Td>
                <Td dim>{user.sessions_noshow ?? 0}</Td>
                <Td dim>{user.report_count ?? 0}</Td>
                <Td dim>{new Date(user.created_at).toLocaleDateString("en-GB")}</Td>
                <Td>
                  {user.is_banned ? (
                    <Badge label="Banned" color="red" />
                  ) : user.is_verified ? (
                    <Badge label="Verified" color="green" />
                  ) : (
                    <Badge label="Active" color="gray" />
                  )}
                </Td>
                <Td>
                  <div className="flex gap-3 justify-end whitespace-nowrap">
                    <ActionButton
                      onClick={() => toggleBan(user)}
                      label={actionId === user.id ? "…" : user.is_banned ? "Unban" : "Ban"}
                      variant={user.is_banned ? "primary" : "danger"}
                    />
                    <ActionButton
                      onClick={() => toggleVerify(user)}
                      label={user.is_verified ? "Unverify" : "Verify"}
                      variant={user.is_verified ? "ghost" : "primary"}
                    />
                    <ActionButton
                      onClick={() => toggleTier(user)}
                      label={user.account_tier === "pro" ? "→ Free" : "→ Pro"}
                      variant="ghost"
                    />
                  </div>
                </Td>
              </Tr>
            ))}
          </AdminTable>
        </>
      ) : (
        <>
          <FilterBar>
            <SearchInput value={search} onChange={setSearch} placeholder="Search name or email…" />
            <span className="text-xs text-white/30 font-[family-name:var(--font-dm-sans)]">
              {filteredWaitlist.length} of {waitlist.length}
            </span>
          </FilterBar>

          <AdminTable
            headers={["Name", "Email", "Joined Waitlist", ""]}
            isEmpty={filteredWaitlist.length === 0}
            empty="No waitlist entries."
          >
            {filteredWaitlist.map((w, i) => (
              <Tr key={w.id} last={i === filteredWaitlist.length - 1}>
                <Td>{w.name}</Td>
                <Td mono dim>{w.email}</Td>
                <Td dim>{new Date(w.createdAt).toLocaleDateString("en-GB")}</Td>
                <Td>
                  <ActionButton
                    onClick={() => deleteWaitlist(w.id)}
                    label={actionId === w.id ? "…" : "Remove"}
                    variant="danger"
                  />
                </Td>
              </Tr>
            ))}
          </AdminTable>
        </>
      )}
    </div>
  );
}
