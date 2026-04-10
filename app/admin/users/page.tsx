// app/admin/users/page.tsx — User Management
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  PageHeader, AdminTable, Tr, Td, Badge, FilterBar, SearchInput, ActionButton, StatCard
} from "@/components/admin/AdminUI";

interface UserRow {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
  reliability_score: number | null;
  sessions_hosted: number | null;
  sessions_attended: number | null;
  suspended: boolean | null;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [filtered, setFiltered] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => { fetchUsers(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(q
      ? users.filter((u) =>
          u.full_name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.id.includes(q)
        )
      : users
    );
  }, [search, users]);

  async function fetchUsers() {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, email, created_at, reliability_score, sessions_hosted, sessions_attended, suspended")
      .order("created_at", { ascending: false })
      .limit(200);
    setUsers(data ?? []);
    setFiltered(data ?? []);
    setLoading(false);
  }

  async function toggleSuspend(user: UserRow) {
    setActionId(user.id);
    const newVal = !user.suspended;
    const { error } = await supabase.from("profiles").update({ suspended: newVal }).eq("id", user.id);
    if (!error) setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, suspended: newVal } : u));
    setActionId(null);
  }

  async function adjustReliability(user: UserRow) {
    const val = window.prompt(
      `New reliability score for ${user.full_name ?? user.id} (0–100):`,
      String(user.reliability_score ?? 50)
    );
    if (!val) return;
    const score = parseInt(val, 10);
    if (isNaN(score)) return;
    setActionId(user.id);
    await supabase.from("profiles").update({ reliability_score: score }).eq("id", user.id);
    setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, reliability_score: score } : u));
    setActionId(null);
  }

  const suspended = users.filter((u) => u.suspended).length;
  const lowReliability = users.filter((u) => (u.reliability_score ?? 100) < 50).length;

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title="User Management" desc="Full user directory — search, inspect, suspend." />

      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Users" value={users.length.toLocaleString()} />
        <StatCard label="Suspended" value={suspended} accent={suspended > 0} />
        <StatCard label="Low Reliability (<50)" value={lowReliability} accent={lowReliability > 0} />
      </div>

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search name, email, ID…" />
        <span className="text-xs text-white/30 font-[family-name:var(--font-dm-sans)]">
          {filtered.length} of {users.length} users
        </span>
      </FilterBar>

      {loading ? (
        <div className="text-white/30 text-sm py-16 text-center">Loading…</div>
      ) : (
        <AdminTable
          headers={["Name / Email", "Reliability", "Hosted", "Attended", "Joined", "Status", ""]}
          isEmpty={filtered.length === 0}
          empty="No users found."
        >
          {filtered.map((user, i) => (
            <Tr key={user.id} last={i === filtered.length - 1}>
              <Td>
                <p className="font-medium text-white">{user.full_name ?? "—"}</p>
                <p className="text-white/40 text-xs mt-0.5 font-mono">{user.email ?? user.id.slice(0, 12) + "…"}</p>
              </Td>
              <Td>
                <button
                  onClick={() => adjustReliability(user)}
                  disabled={actionId === user.id}
                  className={`text-sm font-bold font-[family-name:var(--font-barlow-condensed)] transition-colors hover:text-[#B6FF00] ${
                    (user.reliability_score ?? 100) < 50 ? "text-red-400" : "text-white/70"
                  }`}
                >
                  {user.reliability_score ?? "—"}
                </button>
              </Td>
              <Td dim>{user.sessions_hosted ?? 0}</Td>
              <Td dim>{user.sessions_attended ?? 0}</Td>
              <Td dim>{new Date(user.created_at).toLocaleDateString("en-GB")}</Td>
              <Td>
                <Badge label={user.suspended ? "Suspended" : "Active"} color={user.suspended ? "red" : "green"} />
              </Td>
              <Td>
                <ActionButton
                  onClick={() => toggleSuspend(user)}
                  label={actionId === user.id ? "…" : user.suspended ? "Unsuspend" : "Suspend"}
                  variant={user.suspended ? "primary" : "danger"}
                />
              </Td>
            </Tr>
          ))}
        </AdminTable>
      )}
    </div>
  );
}
