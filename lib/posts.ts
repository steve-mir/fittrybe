// lib/posts.ts — Supabase CRUD for blog posts
import { supabase } from "./supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  content: string;
  coverImage: string;
  tags: string[];
  author: { name: string };
  status: "draft" | "published";
  publishedAt: string;
  updatedAt: string;
}

// ─── Mappers (DB row ↔ app type) ─────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToPost(row: any): BlogPost & { id: string } {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    content: row.content,
    coverImage: row.cover_image ?? "",
    tags: row.tags ?? [],
    author: row.author ?? { name: "Fittrybe" },
    status: row.status,
    publishedAt: row.published_at ?? "",
    updatedAt: row.updated_at ?? "",
  };
}

type RowInput = Partial<PostInput> & { publishedAt?: string | null; updatedAt?: string };

function postInputToRow(input: RowInput) {
  return {
    ...(input.slug !== undefined && { slug: input.slug }),
    ...(input.title !== undefined && { title: input.title }),
    ...(input.description !== undefined && { description: input.description }),
    ...(input.content !== undefined && { content: input.content }),
    ...(input.coverImage !== undefined && { cover_image: input.coverImage }),
    ...(input.tags !== undefined && { tags: input.tags }),
    ...(input.author !== undefined && { author: input.author }),
    ...(input.status !== undefined && { status: input.status }),
    ...(input.publishedAt !== undefined && { published_at: input.publishedAt }),
    ...(input.updatedAt !== undefined && { updated_at: input.updatedAt }),
  };
}

// ─── Public reads ─────────────────────────────────────────────────────────────

/** Fetch a single published post by slug. Returns null if not found. */
export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  const { data, error } = await supabase
    .from("blogs")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error || !data) return null;
  return rowToPost(data);
}

/** Fetch all published posts ordered by published_at descending. */
export async function getPublishedPosts(): Promise<BlogPost[]> {
  const { data, error } = await supabase
    .from("blogs")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error || !data) return [];
  return data.map(rowToPost);
}

/** Return slugs of all published posts (for generateStaticParams). */
export async function getAllBlogSlugs(): Promise<string[]> {
  const posts = await getPublishedPosts();
  return posts.map((p) => p.slug);
}

// ─── Admin reads (all statuses) ───────────────────────────────────────────────

/** Fetch ALL posts (draft + published) for the admin dashboard. */
export async function getAllPostsAdmin(): Promise<(BlogPost & { id: string })[]> {
  const { data, error } = await supabase
    .from("blogs")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error || !data) return [];
  return data.map(rowToPost);
}

/** Fetch a single post by slug (any status) for the admin editor. */
export async function getPostBySlugAdmin(slug: string): Promise<(BlogPost & { id: string }) | null> {
  const { data, error } = await supabase
    .from("blogs")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) return null;
  return rowToPost(data);
}

// ─── Admin writes ─────────────────────────────────────────────────────────────

export interface PostInput {
  slug: string;
  title: string;
  description: string;
  content: string;
  coverImage: string;
  tags: string[];
  author: { name: string };
  status: "draft" | "published";
}

/** Create a new post. Returns the new document ID. */
export async function createPost(input: PostInput): Promise<string> {
  const now = new Date().toISOString();
  const row = postInputToRow({
    ...input,
    publishedAt: input.status === "published" ? now : null,
    updatedAt: now,
  });

  const { data, error } = await supabase
    .from("blogs")
    .insert(row)
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

/** Update an existing post by document ID. */
export async function updatePost(id: string, input: Partial<PostInput>): Promise<void> {
  const { data: existing } = await supabase
    .from("blogs")
    .select("status")
    .eq("id", id)
    .single();

  const isPublishing = input.status === "published" && existing?.status !== "published";
  const now = new Date().toISOString();

  const row = postInputToRow({
    ...input,
    ...(isPublishing && { publishedAt: now }),
    updatedAt: now,
  });

  const { error } = await supabase
    .from("blogs")
    .update(row)
    .eq("id", id);

  if (error) throw error;
}

/** Delete a post by document ID. */
export async function deletePost(id: string): Promise<void> {
  const { error } = await supabase.from("blogs").delete().eq("id", id);
  if (error) throw error;
}

/** Toggle a post's status between draft and published. */
export async function togglePublish(id: string, currentStatus: "draft" | "published"): Promise<void> {
  const newStatus = currentStatus === "published" ? "draft" : "published";
  const now = new Date().toISOString();

  const row = postInputToRow({
    status: newStatus,
    ...(newStatus === "published" && { publishedAt: now }),
    updatedAt: now,
  });

  const { error } = await supabase
    .from("blogs")
    .update(row)
    .eq("id", id);

  if (error) throw error;
}