// app/admin/content/page.tsx — Content / Posts & Stories
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  PageHeader, AdminTable, Tr, Td, Badge, FilterBar, Select, SearchInput, ActionButton, StatCard
} from "@/components/admin/AdminUI";

interface Post {
  id: string;
  author_id: string;
  session_id: string | null;
  content: string | null;
  sport: string | null;
  hidden: boolean | null;
  created_at: string;
  author_name: string | null;
}

interface Story {
  id: string;
  author_id: string;
  media_url: string | null;
  expires_at: string | null;
  view_count: number | null;
  created_at: string;
  author_name: string | null;
}

export default function ContentPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"posts" | "stories">("posts");
  const [search, setSearch] = useState("");
  const [sportFilter, setSportFilter] = useState("all");
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [postRes, storyRes] = await Promise.all([
      supabase
        .from("posts")
        .select("id, author_id, session_id, content, sport, hidden, created_at, profiles:author_id(full_name)")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("stories")
        .select("id, author_id, media_url, expires_at, view_count, created_at, profiles:author_id(full_name)")
        .order("created_at", { ascending: false })
        .limit(200),
    ]);

    setPosts((postRes.data ?? []).map((p: Record<string, unknown>) => ({
      ...p,
      author_name: (p.profiles as { full_name: string } | null)?.full_name ?? null,
    })) as Post[]);
    setStories((storyRes.data ?? []).map((s: Record<string, unknown>) => ({
      ...s,
      author_name: (s.profiles as { full_name: string } | null)?.full_name ?? null,
    })) as Story[]);
    setLoading(false);
  }

  async function toggleHidePost(post: Post) {
    setActionId(post.id);
    const newVal = !post.hidden;
    await supabase.from("posts").update({ hidden: newVal }).eq("id", post.id);
    setPosts((prev) => prev.map((p) => p.id === post.id ? { ...p, hidden: newVal } : p));
    setActionId(null);
  }

  async function deleteStory(id: string) {
    if (!confirm("Delete this story?")) return;
    setActionId(id);
    await supabase.from("stories").delete().eq("id", id);
    setStories((prev) => prev.filter((s) => s.id !== id));
    setActionId(null);
  }

  const hiddenPosts = posts.filter((p) => p.hidden).length;
  const activeStories = stories.filter((s) => !s.expires_at || new Date(s.expires_at) > new Date()).length;

  const filteredPosts = posts.filter((p) => {
    const matchesSport = sportFilter === "all" || p.sport === sportFilter;
    const matchesSearch = !search || p.content?.toLowerCase().includes(search.toLowerCase()) || p.author_name?.toLowerCase().includes(search.toLowerCase());
    return matchesSport && matchesSearch;
  });

  const SPORTS = ["all", "football", "basketball", "racket", "running", "cycling", "gym"];

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title="Content" desc="Posts, stories, and session media oversight." />

      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Posts" value={posts.length} />
        <StatCard label="Hidden Posts" value={hiddenPosts} accent={hiddenPosts > 0} />
        <StatCard label="Active Stories" value={activeStories} accent={activeStories > 0} />
      </div>

      <div className="flex gap-2 mb-6">
        {([
          { key: "posts", label: `Posts (${posts.length})` },
          { key: "stories", label: `Stories (${stories.length})` },
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

      {loading ? (
        <div className="text-white/30 text-sm py-16 text-center">Loading…</div>
      ) : tab === "posts" ? (
        <>
          <FilterBar>
            <SearchInput value={search} onChange={setSearch} placeholder="Search content or author…" />
            <Select
              value={sportFilter}
              onChange={setSportFilter}
              options={SPORTS.map((s) => ({ value: s, label: s === "all" ? "All Sports" : s.charAt(0).toUpperCase() + s.slice(1) }))}
            />
            <span className="text-xs text-white/30 font-[family-name:var(--font-dm-sans)]">{filteredPosts.length} posts</span>
          </FilterBar>
          <AdminTable
            headers={["Author", "Sport", "Content", "Session", "Status", "Date", ""]}
            isEmpty={filteredPosts.length === 0}
            empty="No posts."
          >
            {filteredPosts.map((p, i) => (
              <Tr key={p.id} last={i === filteredPosts.length - 1}>
                <Td>{p.author_name ?? "—"}</Td>
                <Td dim>{p.sport ?? "—"}</Td>
                <Td dim><span className="line-clamp-1 max-w-[200px] block">{p.content ?? "—"}</span></Td>
                <Td mono dim>{p.session_id ? p.session_id.slice(0, 8) + "…" : "—"}</Td>
                <Td><Badge label={p.hidden ? "Hidden" : "Visible"} color={p.hidden ? "red" : "green"} /></Td>
                <Td dim>{new Date(p.created_at).toLocaleDateString("en-GB")}</Td>
                <Td>
                  <ActionButton
                    onClick={() => toggleHidePost(p)}
                    label={actionId === p.id ? "…" : p.hidden ? "Unhide" : "Hide"}
                    variant={p.hidden ? "primary" : "danger"}
                  />
                </Td>
              </Tr>
            ))}
          </AdminTable>
        </>
      ) : (
        <AdminTable
          headers={["Author", "Views", "Expires", "Date", ""]}
          isEmpty={stories.length === 0}
          empty="No stories."
        >
          {stories.map((s, i) => {
            const expired = s.expires_at && new Date(s.expires_at) <= new Date();
            return (
              <Tr key={s.id} last={i === stories.length - 1}>
                <Td>{s.author_name ?? "—"}</Td>
                <Td dim>{s.view_count ?? 0}</Td>
                <Td>
                  {s.expires_at ? (
                    <Badge
                      label={expired ? "Expired" : new Date(s.expires_at).toLocaleDateString("en-GB")}
                      color={expired ? "gray" : "green"}
                    />
                  ) : <span className="text-white/30">—</span>}
                </Td>
                <Td dim>{new Date(s.created_at).toLocaleDateString("en-GB")}</Td>
                <Td>
                  <ActionButton onClick={() => deleteStory(s.id)} label={actionId === s.id ? "…" : "Delete"} variant="danger" />
                </Td>
              </Tr>
            );
          })}
        </AdminTable>
      )}
    </div>
  );
}
