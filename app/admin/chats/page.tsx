// app/admin/chats/page.tsx — Chat Moderation
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  PageHeader, AdminTable, Tr, Td, Badge, FilterBar, SearchInput,
  ActionButton, StatCard, Tabs, SectionNote,
} from "@/components/admin/AdminUI";

type TabKey = "chats" | "messages";

interface ChatRow {
  id: string;
  chat_type: "group" | "direct";
  session_id: string | null;
  name: string | null;
  is_active: boolean;
  last_message_at: string;
  created_at: string;
  participant_count: number;
  message_count: number;
}

interface MessageRow {
  id: string;
  chat_id: string;
  user_id: string | null;
  message: string | null;
  message_type: string;
  media_url: string | null;
  is_deleted: boolean;
  created_at: string;
  user_name: string | null;
}

export default function ChatsPage() {
  const [tab, setTab] = useState<TabKey>("chats");
  const [chats, setChats] = useState<ChatRow[]>([]);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [cRes, pRes, mRes, msgRes] = await Promise.all([
      supabase.from("chats")
        .select("id, chat_type, session_id, name, is_active, last_message_at, created_at")
        .order("last_message_at", { ascending: false })
        .limit(300),
      supabase.from("chat_participants").select("chat_id"),
      supabase.from("chat_messages").select("chat_id").eq("is_deleted", false),
      supabase.from("chat_messages")
        .select("id, chat_id, user_id, message, message_type, media_url, is_deleted, created_at, profiles:user_id(full_name)")
        .order("created_at", { ascending: false })
        .limit(300),
    ]);

    const partCount: Record<string, number> = {};
    (pRes.data ?? []).forEach((r: { chat_id: string }) => {
      partCount[r.chat_id] = (partCount[r.chat_id] ?? 0) + 1;
    });
    const msgCount: Record<string, number> = {};
    (mRes.data ?? []).forEach((r: { chat_id: string }) => {
      msgCount[r.chat_id] = (msgCount[r.chat_id] ?? 0) + 1;
    });

    const enriched: ChatRow[] = (cRes.data ?? []).map((c: Record<string, unknown>) => ({
      ...(c as Omit<ChatRow, "participant_count" | "message_count">),
      participant_count: partCount[c.id as string] ?? 0,
      message_count: msgCount[c.id as string] ?? 0,
    }));

    setChats(enriched);
    setMessages((msgRes.data ?? []).map((m: Record<string, unknown>) => ({
      ...m,
      user_name: (m.profiles as { full_name: string } | null)?.full_name ?? null,
    })) as MessageRow[]);
    setLoading(false);
  }

  async function toggleChatActive(c: ChatRow) {
    setActionId(c.id);
    await supabase.from("chats").update({ is_active: !c.is_active }).eq("id", c.id);
    setChats((prev) => prev.map((x) => x.id === c.id ? { ...x, is_active: !c.is_active } : x));
    setActionId(null);
  }

  async function softDeleteMessage(m: MessageRow) {
    if (!confirm("Soft-delete this message? Users will see it as deleted.")) return;
    setActionId(m.id);
    await supabase.from("chat_messages").update({ is_deleted: true }).eq("id", m.id);
    setMessages((prev) => prev.map((x) => x.id === m.id ? { ...x, is_deleted: true } : x));
    setActionId(null);
  }

  const filteredChats = search
    ? chats.filter((c) =>
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.id.includes(search)
      )
    : chats;

  const filteredMessages = selectedChat
    ? messages.filter((m) => m.chat_id === selectedChat)
    : search
      ? messages.filter((m) =>
          m.message?.toLowerCase().includes(search.toLowerCase()) ||
          m.user_name?.toLowerCase().includes(search.toLowerCase())
        )
      : messages;

  const sessionChats = chats.filter((c) => c.chat_type === "group").length;
  const directChats = chats.filter((c) => c.chat_type === "direct").length;
  const mediaMessages = messages.filter((m) => m.media_url).length;
  const deletedMessages = messages.filter((m) => m.is_deleted).length;

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader title="Chats" desc="Session chats, direct messages, and content moderation." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Group Chats" value={sessionChats} />
        <StatCard label="Direct Chats" value={directChats} />
        <StatCard label="Media Messages" value={mediaMessages} />
        <StatCard label="Deleted" value={deletedMessages} accent={deletedMessages > 0} />
      </div>

      <Tabs<TabKey>
        tabs={[
          { key: "chats", label: `Chats (${chats.length})` },
          { key: "messages", label: `Messages (${messages.length})` },
        ]}
        active={tab}
        onChange={setTab}
      />

      {selectedChat && tab === "messages" && (
        <SectionNote>
          Filtering to messages in chat <code className="font-mono">{selectedChat.slice(0, 10)}…</code>.{" "}
          <button onClick={() => setSelectedChat(null)} className="text-[#B6FF00] underline underline-offset-2">Clear</button>
        </SectionNote>
      )}

      {loading ? (
        <div className="text-white/30 text-sm py-16 text-center">Loading…</div>
      ) : tab === "chats" ? (
        <>
          <FilterBar>
            <SearchInput value={search} onChange={setSearch} placeholder="Search chat name or ID…" />
            <span className="text-xs text-white/30 font-[family-name:var(--font-dm-sans)]">
              {filteredChats.length} chats
            </span>
          </FilterBar>
          <AdminTable
            headers={["Chat", "Type", "Participants", "Messages", "Session", "Last Activity", "Active", ""]}
            isEmpty={filteredChats.length === 0}
            empty="No chats found."
          >
            {filteredChats.map((c, i) => (
              <Tr key={c.id} last={i === filteredChats.length - 1}>
                <Td>
                  <p className="font-medium text-white">{c.name ?? (c.chat_type === "direct" ? "Direct" : "Unnamed group")}</p>
                  <p className="text-white/30 text-xs mt-0.5 font-mono">{c.id.slice(0, 10)}…</p>
                </Td>
                <Td><Badge label={c.chat_type} color={c.chat_type === "group" ? "blue" : "gray"} /></Td>
                <Td dim>{c.participant_count}</Td>
                <Td dim>{c.message_count}</Td>
                <Td mono dim>{c.session_id ? c.session_id.slice(0, 8) + "…" : "—"}</Td>
                <Td dim>{new Date(c.last_message_at).toLocaleDateString("en-GB")}</Td>
                <Td>
                  <Badge label={c.is_active ? "Active" : "Archived"} color={c.is_active ? "green" : "gray"} />
                </Td>
                <Td>
                  <div className="flex gap-3 justify-end whitespace-nowrap">
                    <ActionButton
                      onClick={() => { setSelectedChat(c.id); setTab("messages"); }}
                      label="View Messages"
                      variant="primary"
                    />
                    <ActionButton
                      onClick={() => toggleChatActive(c)}
                      label={actionId === c.id ? "…" : c.is_active ? "Archive" : "Reactivate"}
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
            <SearchInput value={search} onChange={setSearch} placeholder="Search message text or sender…" />
            <span className="text-xs text-white/30 font-[family-name:var(--font-dm-sans)]">
              {filteredMessages.length} messages
            </span>
          </FilterBar>
          <AdminTable
            headers={["Sender", "Type", "Message", "Media", "Chat", "Date", "Status", ""]}
            isEmpty={filteredMessages.length === 0}
            empty="No messages."
          >
            {filteredMessages.map((m, i) => (
              <Tr key={m.id} last={i === filteredMessages.length - 1}>
                <Td dim>{m.user_name ?? (m.user_id ? m.user_id.slice(0, 10) + "…" : "System")}</Td>
                <Td><Badge label={m.message_type} color={m.message_type === "text" ? "gray" : "blue"} /></Td>
                <Td dim><span className="line-clamp-2 max-w-[280px] block">{m.message ?? "—"}</span></Td>
                <Td>
                  {m.media_url ? (
                    <a href={m.media_url} target="_blank" rel="noreferrer" className="text-[#B6FF00]/80 hover:text-[#B6FF00] text-xs underline underline-offset-2">
                      View
                    </a>
                  ) : <span className="text-white/20">—</span>}
                </Td>
                <Td mono dim>{m.chat_id.slice(0, 8)}…</Td>
                <Td dim>{new Date(m.created_at).toLocaleDateString("en-GB")}</Td>
                <Td>
                  {m.is_deleted ? <Badge label="Deleted" color="red" /> : <Badge label="Live" color="green" />}
                </Td>
                <Td>
                  {!m.is_deleted && (
                    <ActionButton
                      onClick={() => softDeleteMessage(m)}
                      label={actionId === m.id ? "…" : "Delete"}
                      variant="danger"
                    />
                  )}
                </Td>
              </Tr>
            ))}
          </AdminTable>
        </>
      )}
    </div>
  );
}
