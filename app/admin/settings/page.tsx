// app/admin/settings/page.tsx — Platform Settings
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  PageHeader, AdminTable, Tr, Td, Badge, FilterBar, SearchInput, ActionButton,
  StatCard, Tabs, FormField, TextInput, TextArea, PrimaryButton, GhostButton,
  SectionNote,
} from "@/components/admin/AdminUI";

type TabKey = "config" | "help" | "blog";

interface AppConfigRow {
  key: string;
  value: unknown;
  updated_at: string;
}

interface HelpContentRow {
  id: string;
  section: string;
  sort_order: number;
  title: string;
  body: string;
  icon: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface BlogRow {
  id: string;
  slug: string;
  title: string;
  status: "draft" | "published";
  published_at: string | null;
  created_at: string;
}

const EMPTY_HELP: Partial<HelpContentRow> = {
  section: "general",
  sort_order: 0,
  title: "",
  body: "",
  icon: "",
  is_active: true,
};

export default function SettingsPage() {
  const [tab, setTab] = useState<TabKey>("config");
  const [config, setConfig] = useState<AppConfigRow[]>([]);
  const [help, setHelp] = useState<HelpContentRow[]>([]);
  const [blogs, setBlogs] = useState<BlogRow[]>([]);
  const [loading, setLoading] = useState(true);

  // App Config editor
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [configMsg, setConfigMsg] = useState("");
  const [configSearch, setConfigSearch] = useState("");

  // Help editor
  const [editingHelp, setEditingHelp] = useState<Partial<HelpContentRow> | null>(null);
  const [helpSearch, setHelpSearch] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [cRes, hRes, bRes] = await Promise.all([
      supabase.from("app_config").select("*").order("key", { ascending: true }),
      supabase.from("help_content").select("*").order("section", { ascending: true }).order("sort_order", { ascending: true }),
      supabase.from("blogs").select("id, slug, title, status, published_at, created_at").order("created_at", { ascending: false }).limit(20),
    ]);
    setConfig((cRes.data as AppConfigRow[]) ?? []);
    setHelp((hRes.data as HelpContentRow[]) ?? []);
    setBlogs((bRes.data as BlogRow[]) ?? []);
    setLoading(false);
  }

  async function saveConfig() {
    if (!newKey) {
      setConfigMsg("Key required.");
      return;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(newValue);
    } catch {
      parsed = newValue;
    }
    const { error } = await supabase
      .from("app_config")
      .upsert({ key: newKey, value: parsed, updated_at: new Date().toISOString() });
    if (error) {
      setConfigMsg("Failed: " + error.message);
    } else {
      setConfigMsg("✓ Saved.");
      setNewKey("");
      setNewValue("");
      fetchAll();
    }
  }

  async function deleteConfigKey(key: string) {
    if (!confirm(`Delete config key "${key}"?`)) return;
    setActionId(key);
    await supabase.from("app_config").delete().eq("key", key);
    setConfig((prev) => prev.filter((c) => c.key !== key));
    setActionId(null);
  }

  async function editConfigValue(row: AppConfigRow) {
    const current = typeof row.value === "string" ? row.value : JSON.stringify(row.value, null, 2);
    const updated = window.prompt(`Edit value for "${row.key}"`, current);
    if (updated == null || updated === current) return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(updated);
    } catch {
      parsed = updated;
    }
    setActionId(row.key);
    await supabase
      .from("app_config")
      .update({ value: parsed, updated_at: new Date().toISOString() })
      .eq("key", row.key);
    setConfig((prev) => prev.map((c) => c.key === row.key ? { ...c, value: parsed, updated_at: new Date().toISOString() } : c));
    setActionId(null);
  }

  async function saveHelp() {
    if (!editingHelp?.title || !editingHelp?.section) {
      alert("Section and title are required.");
      return;
    }
    setSaving(true);
    const payload = {
      section: editingHelp.section,
      sort_order: Number(editingHelp.sort_order ?? 0),
      title: editingHelp.title,
      body: editingHelp.body ?? "",
      icon: editingHelp.icon || null,
      is_active: editingHelp.is_active ?? true,
      updated_at: new Date().toISOString(),
    };
    if (editingHelp.id) {
      await supabase.from("help_content").update(payload).eq("id", editingHelp.id);
    } else {
      await supabase.from("help_content").insert(payload);
    }
    setEditingHelp(null);
    setSaving(false);
    fetchAll();
  }

  async function toggleHelpActive(h: HelpContentRow) {
    setActionId(h.id);
    await supabase.from("help_content").update({ is_active: !h.is_active }).eq("id", h.id);
    setHelp((prev) => prev.map((x) => x.id === h.id ? { ...x, is_active: !h.is_active } : x));
    setActionId(null);
  }

  async function deleteHelp(h: HelpContentRow) {
    if (!confirm(`Delete "${h.title}"?`)) return;
    setActionId(h.id);
    await supabase.from("help_content").delete().eq("id", h.id);
    setHelp((prev) => prev.filter((x) => x.id !== h.id));
    setActionId(null);
  }

  const filteredConfig = configSearch
    ? config.filter((c) => c.key.toLowerCase().includes(configSearch.toLowerCase()))
    : config;

  const filteredHelp = helpSearch
    ? help.filter((h) =>
        h.title.toLowerCase().includes(helpSearch.toLowerCase()) ||
        h.section.toLowerCase().includes(helpSearch.toLowerCase()) ||
        h.body.toLowerCase().includes(helpSearch.toLowerCase())
      )
    : help;

  const activeHelp = help.filter((h) => h.is_active).length;
  const publishedBlogs = blogs.filter((b) => b.status === "published").length;

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title="Settings" desc="Platform configuration, in-app help, and quick links." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Config Keys" value={config.length} />
        <StatCard label="Help Entries" value={help.length} sub={`${activeHelp} active`} />
        <StatCard label="Blog Posts" value={blogs.length} sub={`${publishedBlogs} published`} />
        <StatCard label="Sections" value={new Set(help.map((h) => h.section)).size} />
      </div>

      <Tabs<TabKey>
        tabs={[
          { key: "config", label: `App Config (${config.length})` },
          { key: "help", label: `Help Content (${help.length})` },
          { key: "blog", label: "Blog Quick-links" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {loading ? (
        <div className="text-white/30 text-sm py-16 text-center">Loading…</div>
      ) : tab === "config" ? (
        <>
          <SectionNote>
            <code className="font-mono">app_config</code> stores runtime settings as JSON values. Strings, numbers, objects, and arrays are all supported — anything non-JSON is stored as text.
          </SectionNote>

          <div className="border border-[#B6FF00]/20 bg-[#B6FF00]/3 rounded-2xl p-6 mb-6">
            <h3 className="text-xs font-medium text-white/40 uppercase tracking-widest mb-4 font-[family-name:var(--font-dm-sans)]">
              Add or Update Key
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <FormField label="Key">
                <TextInput value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="e.g. platform_fee_pct" />
              </FormField>
              <FormField label="Value (JSON or text)">
                <TextInput value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder='e.g. 10  or  {"enabled":true}' />
              </FormField>
            </div>
            {configMsg && (
              <p className={`text-sm mb-3 ${configMsg.startsWith("✓") ? "text-[#B6FF00]" : "text-red-400"}`}>{configMsg}</p>
            )}
            <PrimaryButton onClick={saveConfig}>Save Key</PrimaryButton>
          </div>

          <FilterBar>
            <SearchInput value={configSearch} onChange={setConfigSearch} placeholder="Search keys…" />
            <span className="text-xs text-white/30 font-[family-name:var(--font-dm-sans)]">{filteredConfig.length} keys</span>
          </FilterBar>

          <AdminTable
            headers={["Key", "Value", "Updated", ""]}
            isEmpty={filteredConfig.length === 0}
            empty="No config keys."
          >
            {filteredConfig.map((c, i) => (
              <Tr key={c.key} last={i === filteredConfig.length - 1}>
                <Td mono>{c.key}</Td>
                <Td dim>
                  <code className="text-xs font-mono text-white/60 line-clamp-2 max-w-[360px] block break-all">
                    {typeof c.value === "string" ? c.value : JSON.stringify(c.value)}
                  </code>
                </Td>
                <Td dim>{new Date(c.updated_at).toLocaleDateString("en-GB")}</Td>
                <Td>
                  <div className="flex gap-3 justify-end whitespace-nowrap">
                    <ActionButton onClick={() => editConfigValue(c)} label={actionId === c.key ? "…" : "Edit"} variant="primary" />
                    <ActionButton onClick={() => deleteConfigKey(c.key)} label="Delete" variant="danger" />
                  </div>
                </Td>
              </Tr>
            ))}
          </AdminTable>
        </>
      ) : tab === "help" ? (
        <>
          {editingHelp ? (
            <div className="border border-[#B6FF00]/20 bg-[#B6FF00]/3 rounded-2xl p-6 mb-6">
              <h3 className="text-lg font-black font-[family-name:var(--font-barlow-condensed)] uppercase text-white mb-5">
                {editingHelp.id ? "Edit Help Entry" : "New Help Entry"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <FormField label="Section *">
                  <TextInput
                    value={editingHelp.section ?? ""}
                    onChange={(e) => setEditingHelp({ ...editingHelp, section: e.target.value })}
                    placeholder="e.g. getting_started"
                  />
                </FormField>
                <FormField label="Sort Order">
                  <TextInput
                    type="number"
                    value={editingHelp.sort_order ?? 0}
                    onChange={(e) => setEditingHelp({ ...editingHelp, sort_order: parseInt(e.target.value, 10) || 0 })}
                  />
                </FormField>
                <FormField label="Icon (emoji or name)">
                  <TextInput
                    value={editingHelp.icon ?? ""}
                    onChange={(e) => setEditingHelp({ ...editingHelp, icon: e.target.value })}
                    placeholder="e.g. 🏀 or hoop"
                  />
                </FormField>
              </div>
              <FormField label="Title *">
                <TextInput
                  value={editingHelp.title ?? ""}
                  onChange={(e) => setEditingHelp({ ...editingHelp, title: e.target.value })}
                />
              </FormField>
              <div className="mt-4" />
              <FormField label="Body (markdown supported)">
                <TextArea
                  value={editingHelp.body ?? ""}
                  onChange={(e) => setEditingHelp({ ...editingHelp, body: e.target.value })}
                  rows={8}
                />
              </FormField>
              <div className="flex items-center gap-2 mt-4">
                <input
                  type="checkbox"
                  id="help-active"
                  checked={editingHelp.is_active ?? true}
                  onChange={(e) => setEditingHelp({ ...editingHelp, is_active: e.target.checked })}
                  className="accent-[#B6FF00]"
                />
                <label htmlFor="help-active" className="text-sm text-white/70 font-[family-name:var(--font-dm-sans)]">
                  Active (visible to users)
                </label>
              </div>
              <div className="flex gap-3 mt-6">
                <PrimaryButton onClick={saveHelp} disabled={saving}>
                  {saving ? "Saving…" : editingHelp.id ? "Save" : "Create"}
                </PrimaryButton>
                <GhostButton onClick={() => setEditingHelp(null)}>Cancel</GhostButton>
              </div>
            </div>
          ) : null}

          <FilterBar>
            <SearchInput value={helpSearch} onChange={setHelpSearch} placeholder="Search section, title, body…" />
            <PrimaryButton onClick={() => setEditingHelp({ ...EMPTY_HELP })}>+ New Entry</PrimaryButton>
            <span className="text-xs text-white/30 font-[family-name:var(--font-dm-sans)]">{filteredHelp.length} entries</span>
          </FilterBar>

          <AdminTable
            headers={["Section", "Icon", "Title", "Body", "Order", "Active", ""]}
            isEmpty={filteredHelp.length === 0}
            empty="No help entries."
          >
            {filteredHelp.map((h, i) => (
              <Tr key={h.id} last={i === filteredHelp.length - 1}>
                <Td><Badge label={h.section} color="blue" /></Td>
                <Td>{h.icon ?? <span className="text-white/20">—</span>}</Td>
                <Td>{h.title}</Td>
                <Td dim><span className="line-clamp-2 max-w-[280px] block">{h.body}</span></Td>
                <Td dim>{h.sort_order}</Td>
                <Td><Badge label={h.is_active ? "Active" : "Hidden"} color={h.is_active ? "green" : "gray"} /></Td>
                <Td>
                  <div className="flex gap-3 justify-end whitespace-nowrap">
                    <ActionButton onClick={() => setEditingHelp(h)} label="Edit" variant="primary" />
                    <ActionButton
                      onClick={() => toggleHelpActive(h)}
                      label={actionId === h.id ? "…" : h.is_active ? "Hide" : "Show"}
                      variant="ghost"
                    />
                    <ActionButton onClick={() => deleteHelp(h)} label="Delete" variant="danger" />
                  </div>
                </Td>
              </Tr>
            ))}
          </AdminTable>
        </>
      ) : (
        <>
          <SectionNote>
            Quick view of blog posts. Use <a className="text-[#B6FF00] underline underline-offset-2" href="/admin/posts">Blog</a> for full editing.
          </SectionNote>
          <AdminTable
            headers={["Title", "Slug", "Status", "Published", "Created"]}
            isEmpty={blogs.length === 0}
            empty="No blog posts."
          >
            {blogs.map((b, i) => (
              <Tr key={b.id} last={i === blogs.length - 1}>
                <Td>{b.title}</Td>
                <Td mono dim>{b.slug}</Td>
                <Td>
                  <Badge label={b.status} color={b.status === "published" ? "green" : "gray"} />
                </Td>
                <Td dim>{b.published_at ? new Date(b.published_at).toLocaleDateString("en-GB") : "—"}</Td>
                <Td dim>{new Date(b.created_at).toLocaleDateString("en-GB")}</Td>
              </Tr>
            ))}
          </AdminTable>
        </>
      )}
    </div>
  );
}
