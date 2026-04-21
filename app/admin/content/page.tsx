// app/admin/content/page.tsx — Content: Posts, Stories, Match Reports
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  PageHeader, AdminTable, Tr, Td, Badge, FilterBar, Select, SearchInput,
  ActionButton, StatCard, Tabs,
} from "@/components/admin/AdminUI";

type TabKey = "posts" | "stories" | "matches";

interface Post {
  id: string;
  user_id: string;
  session_id: string | null;
  caption: string;
  image_url: string;
  post_type: "general" | "testimonial";
  is_testimonial: boolean;
  view_count: number;
  created_at: string;
  author_name: string | null;
}

interface Story {
  id: string;
  host_id: string;
  session_id: string;
  sport_id: string;
  team_a_name: string;
  team_b_name: string;
  team_a_score: number;
  team_b_score: number;
  winner: string | null;
  image_url: string;
  caption: string | null;
  expires_at: string | null;
  view_count: number;
  created_at: string;
  author_name: string | null;
}

interface MatchReport {
  id: string;
  session_id: string | null;
  submitted_by: string | null;
  submitted_at: string;
  photo_url: string | null;
  final_score_a: number | null;
  final_score_b: number | null;
  submitter_name: string | null;
}

export default function ContentPage() {
  const [tab, setTab] = useState<TabKey>("posts");
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [matches, setMatches] = useState<MatchReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [postTypeFilter, setPostTypeFilter] = useState("all");
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [pRes, sRes, mRes] = await Promise.all([
      supabase.from("posts")
        .select("id, user_id, session_id, caption, image_url, post_type, is_testimonial, view_count, created_at, profiles:user_id(full_name, display_name)")
        .order("created_at", { ascending: false })
        .limit(300),
      supabase.from("stories")
        .select("id, host_id, session_id, sport_id, team_a_name, team_b_name, team_a_score, team_b_score, winner, image_url, caption, expires_at, view_count, created_at, profiles:host_id(full_name, display_name)")
        .order("created_at", { ascending: false })
        .limit(300),
      supabase.from("session_post_match")
        .select("id, session_id, submitted_by, submitted_at, photo_url, final_score_a, final_score_b, profiles:submitted_by(full_name, display_name)")
        .order("submitted_at", { ascending: false })
        .limit(300),
    ]);

    setPosts((pRes.data ?? []).map((p: Record<string, unknown>) => {
      const prof = p.profiles as { full_name: string | null; display_name: string | null } | null;
      return { ...p, author_name: prof?.display_name ?? prof?.full_name ?? null };
    }) as Post[]);
    setStories((sRes.data ?? []).map((s: Record<string, unknown>) => {
      const prof = s.profiles as { full_name: string | null; display_name: string | null } | null;
      return { ...s, author_name: prof?.display_name ?? prof?.full_name ?? null };
    }) as Story[]);
    setMatches((mRes.data ?? []).map((m: Record<string, unknown>) => {
      const prof = m.profiles as { full_name: string | null; display_name: string | null } | null;
      return { ...m, submitter_name: prof?.display_name ?? prof?.full_name ?? null };
    }) as MatchReport[]);
    setLoading(false);
  }

  async function deletePost(id: string) {
    if (!confirm("Delete this post? This is permanent.")) return;
    setActionId(id);
    await supabase.from("posts").delete().eq("id", id);
    setPosts((prev) => prev.filter((p) => p.id !== id));
    setActionId(null);
  }

  async function deleteStory(id: string) {
    if (!confirm("Delete this story? This is permanent.")) return;
    setActionId(id);
    await supabase.from("stories").delete().eq("id", id);
    setStories((prev) => prev.filter((s) => s.id !== id));
    setActionId(null);
  }

  async function expireStory(id: string) {
    setActionId(id);
    await supabase.from("stories").update({ expires_at: new Date().toISOString() }).eq("id", id);
    setStories((prev) => prev.map((s) => s.id === id ? { ...s, expires_at: new Date().toISOString() } : s));
    setActionId(null);
  }

  async function deleteMatch(id: string) {
    if (!confirm("Delete this match report?")) return;
    setActionId(id);
    await supabase.from("session_post_match").delete().eq("id", id);
    setMatches((prev) => prev.filter((m) => m.id !== id));
    setActionId(null);
  }

  const testimonials = posts.filter((p) => p.is_testimonial || p.post_type === "testimonial").length;
  const activeStories = stories.filter((s) => !s.expires_at || new Date(s.expires_at) > new Date()).length;
  const totalViews = posts.reduce((s, p) => s + (p.view_count ?? 0), 0) + stories.reduce((s, st) => s + (st.view_count ?? 0), 0);

  const filteredPosts = posts.filter((p) => {
    const matchesType = postTypeFilter === "all" || p.post_type === postTypeFilter;
    const q = search.toLowerCase();
    const matchesSearch = !search || p.caption?.toLowerCase().includes(q) || p.author_name?.toLowerCase().includes(q);
    return matchesType && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader title="Content" desc="Posts, stories, and post-match reports." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Posts" value={posts.length} />
        <StatCard label="Testimonials" value={testimonials} accent={testimonials > 0} />
        <StatCard label="Active Stories" value={activeStories} />
        <StatCard label="Total Views" value={totalViews.toLocaleString()} />
      </div>

      <Tabs<TabKey>
        tabs={[
          { key: "posts", label: `Posts (${posts.length})` },
          { key: "stories", label: `Stories (${stories.length})` },
          { key: "matches", label: `Match Reports (${matches.length})` },
        ]}
        active={tab}
        onChange={setTab}
      />

      {loading ? (
        <div className="text-white/30 text-sm py-16 text-center">Loading…</div>
      ) : tab === "posts" ? (
        <>
          <FilterBar>
            <SearchInput value={search} onChange={setSearch} placeholder="Search caption or author…" />
            <Select
              value={postTypeFilter}
              onChange={setPostTypeFilter}
              options={[
                { value: "all", label: "All Types" },
                { value: "general", label: "General" },
                { value: "testimonial", label: "Testimonials" },
              ]}
            />
            <span className="text-xs text-white/30 font-[family-name:var(--font-dm-sans)]">{filteredPosts.length} posts</span>
          </FilterBar>
          <AdminTable
            headers={["Author", "Type", "Caption", "Image", "Session", "Views", "Date", ""]}
            isEmpty={filteredPosts.length === 0}
            empty="No posts."
          >
            {filteredPosts.map((p, i) => (
              <Tr key={p.id} last={i === filteredPosts.length - 1}>
                <Td>{p.author_name ?? <span className="font-mono text-xs text-white/30">{p.user_id.slice(0, 10)}…</span>}</Td>
                <Td>
                  <Badge
                    label={p.post_type}
                    color={p.post_type === "testimonial" ? "purple" : "gray"}
                  />
                </Td>
                <Td dim><span className="line-clamp-2 max-w-[260px] block">{p.caption}</span></Td>
                <Td>
                  {p.image_url ? (
                    <a href={p.image_url} target="_blank" rel="noreferrer" className="text-[#B6FF00]/80 hover:text-[#B6FF00] text-xs underline underline-offset-2">
                      View
                    </a>
                  ) : <span className="text-white/20">—</span>}
                </Td>
                <Td mono dim>{p.session_id ? p.session_id.slice(0, 8) + "…" : "—"}</Td>
                <Td dim>{p.view_count ?? 0}</Td>
                <Td dim>{new Date(p.created_at).toLocaleDateString("en-GB")}</Td>
                <Td>
                  <ActionButton
                    onClick={() => deletePost(p.id)}
                    label={actionId === p.id ? "…" : "Delete"}
                    variant="danger"
                  />
                </Td>
              </Tr>
            ))}
          </AdminTable>
        </>
      ) : tab === "stories" ? (
        <AdminTable
          headers={["Host", "Sport", "Match Result", "Image", "Caption", "Views", "Expires", ""]}
          isEmpty={stories.length === 0}
          empty="No stories."
        >
          {stories.map((s, i) => {
            const expired = s.expires_at && new Date(s.expires_at) <= new Date();
            return (
              <Tr key={s.id} last={i === stories.length - 1}>
                <Td>{s.author_name ?? <span className="font-mono text-xs text-white/30">{s.host_id.slice(0, 10)}…</span>}</Td>
                <Td dim className="capitalize">{s.sport_id}</Td>
                <Td dim>
                  <span className="whitespace-nowrap">
                    {s.team_a_name} {s.team_a_score} – {s.team_b_score} {s.team_b_name}
                  </span>
                </Td>
                <Td>
                  {s.image_url ? (
                    <a href={s.image_url} target="_blank" rel="noreferrer" className="text-[#B6FF00]/80 hover:text-[#B6FF00] text-xs underline underline-offset-2">
                      View
                    </a>
                  ) : <span className="text-white/20">—</span>}
                </Td>
                <Td dim><span className="line-clamp-1 max-w-[160px] block">{s.caption ?? "—"}</span></Td>
                <Td dim>{s.view_count}</Td>
                <Td>
                  <Badge
                    label={expired ? "Expired" : s.expires_at ? new Date(s.expires_at).toLocaleDateString("en-GB") : "—"}
                    color={expired ? "gray" : "green"}
                  />
                </Td>
                <Td>
                  <div className="flex items-center gap-3 justify-end whitespace-nowrap">
                    {!expired && (
                      <ActionButton
                        onClick={() => expireStory(s.id)}
                        label="Expire"
                        variant="ghost"
                      />
                    )}
                    <ActionButton
                      onClick={() => deleteStory(s.id)}
                      label={actionId === s.id ? "…" : "Delete"}
                      variant="danger"
                    />
                  </div>
                </Td>
              </Tr>
            );
          })}
        </AdminTable>
      ) : (
        <AdminTable
          headers={["Session", "Submitted By", "Final Score", "Photo", "Submitted", ""]}
          isEmpty={matches.length === 0}
          empty="No match reports."
        >
          {matches.map((m, i) => (
            <Tr key={m.id} last={i === matches.length - 1}>
              <Td mono dim>{m.session_id ? m.session_id.slice(0, 8) + "…" : "—"}</Td>
              <Td dim>{m.submitter_name ?? (m.submitted_by ? m.submitted_by.slice(0, 10) + "…" : "—")}</Td>
              <Td dim>
                {m.final_score_a != null && m.final_score_b != null
                  ? `${m.final_score_a} – ${m.final_score_b}`
                  : "—"}
              </Td>
              <Td>
                {m.photo_url ? (
                  <a href={m.photo_url} target="_blank" rel="noreferrer" className="text-[#B6FF00]/80 hover:text-[#B6FF00] text-xs underline underline-offset-2">
                    View
                  </a>
                ) : <span className="text-white/20">—</span>}
              </Td>
              <Td dim>{new Date(m.submitted_at).toLocaleDateString("en-GB")}</Td>
              <Td>
                <ActionButton
                  onClick={() => deleteMatch(m.id)}
                  label={actionId === m.id ? "…" : "Delete"}
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
