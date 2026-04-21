// app/admin/venues/page.tsx — Partner Venue Management
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  PageHeader, AdminTable, Tr, Td, Badge, FilterBar, SearchInput, Select,
  ActionButton, StatCard, FormField, TextInput, TextArea, PrimaryButton, GhostButton,
} from "@/components/admin/AdminUI";

interface Venue {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  photo_url: string | null;
  logo_url: string | null;
  phone: string | null;
  website: string | null;
  booking_url: string | null;
  rating: number | null;
  description: string | null;
  sport_types: string[];
  amenities: string[] | null;
  is_active: boolean;
  priority: number;
  contact_email: string | null;
  created_at: string;
}

const EMPTY_VENUE: Partial<Venue> = {
  name: "",
  address: "",
  lat: 51.2400, // Redhill default
  lng: -0.1700,
  photo_url: "",
  logo_url: "",
  phone: "",
  website: "",
  booking_url: "",
  description: "",
  sport_types: [],
  amenities: [],
  is_active: true,
  priority: 0,
  contact_email: "",
};

const SPORT_OPTIONS = ["football", "basketball", "tennis", "badminton", "squash", "padel", "table_tennis", "running", "cycling", "gym"];
const AMENITY_OPTIONS = ["parking", "showers", "changing_rooms", "refreshments", "water_fountain", "floodlights", "indoor", "outdoor"];

export default function VenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [filtered, setFiltered] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sportFilter, setSportFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState("all");
  const [editing, setEditing] = useState<Partial<Venue> | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => { fetchVenues(); }, []);

  useEffect(() => {
    let res = venues;
    if (sportFilter !== "all") res = res.filter((v) => v.sport_types?.includes(sportFilter));
    if (activeFilter === "active") res = res.filter((v) => v.is_active);
    if (activeFilter === "inactive") res = res.filter((v) => !v.is_active);
    if (search) {
      const q = search.toLowerCase();
      res = res.filter((v) =>
        v.name.toLowerCase().includes(q) ||
        v.address.toLowerCase().includes(q) ||
        v.contact_email?.toLowerCase().includes(q)
      );
    }
    setFiltered(res);
  }, [venues, search, sportFilter, activeFilter]);

  async function fetchVenues() {
    setLoading(true);
    const { data } = await supabase
      .from("partner_venues")
      .select("*")
      .order("priority", { ascending: false })
      .order("name", { ascending: true });
    setVenues((data as Venue[]) ?? []);
    setLoading(false);
  }

  async function saveVenue() {
    if (!editing?.name || !editing?.address) {
      alert("Name and address are required.");
      return;
    }
    setSaving(true);
    const payload = {
      name: editing.name,
      address: editing.address,
      lat: Number(editing.lat ?? 0),
      lng: Number(editing.lng ?? 0),
      photo_url: editing.photo_url || null,
      logo_url: editing.logo_url || null,
      phone: editing.phone || null,
      website: editing.website || null,
      booking_url: editing.booking_url || null,
      description: editing.description || null,
      sport_types: editing.sport_types ?? [],
      amenities: editing.amenities ?? [],
      is_active: editing.is_active ?? true,
      priority: Number(editing.priority ?? 0),
      contact_email: editing.contact_email || null,
    };

    if (editing.id) {
      await supabase.from("partner_venues").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("partner_venues").insert(payload);
    }
    setEditing(null);
    setSaving(false);
    fetchVenues();
  }

  async function toggleActive(v: Venue) {
    setActionId(v.id);
    await supabase.from("partner_venues").update({ is_active: !v.is_active }).eq("id", v.id);
    setVenues((prev) => prev.map((x) => x.id === v.id ? { ...x, is_active: !v.is_active } : x));
    setActionId(null);
  }

  async function deleteVenue(v: Venue) {
    if (!confirm(`Delete "${v.name}"? This is permanent.`)) return;
    setActionId(v.id);
    await supabase.from("partner_venues").delete().eq("id", v.id);
    setVenues((prev) => prev.filter((x) => x.id !== v.id));
    setActionId(null);
  }

  function toggleSport(sport: string) {
    const list = editing?.sport_types ?? [];
    const next = list.includes(sport) ? list.filter((s) => s !== sport) : [...list, sport];
    setEditing({ ...editing, sport_types: next });
  }

  function toggleAmenity(a: string) {
    const list = editing?.amenities ?? [];
    const next = list.includes(a) ? list.filter((x) => x !== a) : [...list, a];
    setEditing({ ...editing, amenities: next });
  }

  const active = venues.filter((v) => v.is_active).length;
  const totalSports = new Set(venues.flatMap((v) => v.sport_types ?? [])).size;

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Partner Venues"
        desc="Featured venues shown in-app for session discovery & booking."
        action={
          <PrimaryButton onClick={() => setEditing({ ...EMPTY_VENUE })}>
            + New Venue
          </PrimaryButton>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Venues" value={venues.length} />
        <StatCard label="Active" value={active} accent={active > 0} />
        <StatCard label="Inactive" value={venues.length - active} />
        <StatCard label="Sports Covered" value={totalSports} />
      </div>

      {editing ? (
        <div className="border border-[#B6FF00]/20 bg-[#B6FF00]/3 rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-black font-[family-name:var(--font-barlow-condensed)] uppercase text-white mb-6">
            {editing.id ? "Edit Venue" : "New Venue"}
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <FormField label="Name *">
              <TextInput value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </FormField>
            <FormField label="Contact Email">
              <TextInput type="email" value={editing.contact_email ?? ""} onChange={(e) => setEditing({ ...editing, contact_email: e.target.value })} />
            </FormField>
            <FormField label="Address *">
              <TextInput value={editing.address ?? ""} onChange={(e) => setEditing({ ...editing, address: e.target.value })} />
            </FormField>
            <FormField label="Phone">
              <TextInput value={editing.phone ?? ""} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} />
            </FormField>
            <FormField label="Latitude">
              <TextInput type="number" step="any" value={editing.lat ?? ""} onChange={(e) => setEditing({ ...editing, lat: parseFloat(e.target.value) })} />
            </FormField>
            <FormField label="Longitude">
              <TextInput type="number" step="any" value={editing.lng ?? ""} onChange={(e) => setEditing({ ...editing, lng: parseFloat(e.target.value) })} />
            </FormField>
            <FormField label="Website">
              <TextInput value={editing.website ?? ""} onChange={(e) => setEditing({ ...editing, website: e.target.value })} />
            </FormField>
            <FormField label="Booking URL">
              <TextInput value={editing.booking_url ?? ""} onChange={(e) => setEditing({ ...editing, booking_url: e.target.value })} />
            </FormField>
            <FormField label="Photo URL">
              <TextInput value={editing.photo_url ?? ""} onChange={(e) => setEditing({ ...editing, photo_url: e.target.value })} />
            </FormField>
            <FormField label="Logo URL">
              <TextInput value={editing.logo_url ?? ""} onChange={(e) => setEditing({ ...editing, logo_url: e.target.value })} />
            </FormField>
            <FormField label="Priority" hint="Higher = shown first">
              <TextInput type="number" value={editing.priority ?? 0} onChange={(e) => setEditing({ ...editing, priority: parseInt(e.target.value, 10) || 0 })} />
            </FormField>
            <FormField label="Active">
              <Select
                value={editing.is_active ? "yes" : "no"}
                onChange={(v) => setEditing({ ...editing, is_active: v === "yes" })}
                options={[{ value: "yes", label: "Active" }, { value: "no", label: "Inactive" }]}
              />
            </FormField>
          </div>

          <FormField label="Description">
            <TextArea value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={3} />
          </FormField>

          <div className="mt-4">
            <label className="text-xs text-white/40 uppercase tracking-wider font-[family-name:var(--font-dm-sans)] block mb-2">
              Sport Types
            </label>
            <div className="flex flex-wrap gap-2">
              {SPORT_OPTIONS.map((s) => {
                const on = editing.sport_types?.includes(s) ?? false;
                return (
                  <button
                    key={s}
                    onClick={() => toggleSport(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                      on
                        ? "bg-[#B6FF00]/15 text-[#B6FF00] border border-[#B6FF00]/30"
                        : "bg-white/5 text-white/50 border border-white/10 hover:text-white"
                    }`}
                  >
                    {s.replace(/_/g, " ")}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4">
            <label className="text-xs text-white/40 uppercase tracking-wider font-[family-name:var(--font-dm-sans)] block mb-2">
              Amenities
            </label>
            <div className="flex flex-wrap gap-2">
              {AMENITY_OPTIONS.map((a) => {
                const on = editing.amenities?.includes(a) ?? false;
                return (
                  <button
                    key={a}
                    onClick={() => toggleAmenity(a)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                      on
                        ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                        : "bg-white/5 text-white/50 border border-white/10 hover:text-white"
                    }`}
                  >
                    {a.replace(/_/g, " ")}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <PrimaryButton onClick={saveVenue} disabled={saving}>
              {saving ? "Saving…" : editing.id ? "Save Changes" : "Create Venue"}
            </PrimaryButton>
            <GhostButton onClick={() => setEditing(null)}>Cancel</GhostButton>
          </div>
        </div>
      ) : null}

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search name, address, email…" />
        <Select
          value={sportFilter}
          onChange={setSportFilter}
          options={[{ value: "all", label: "All Sports" }, ...SPORT_OPTIONS.map((s) => ({ value: s, label: s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) }))]}
        />
        <Select
          value={activeFilter}
          onChange={setActiveFilter}
          options={[
            { value: "all", label: "All" },
            { value: "active", label: "Active Only" },
            { value: "inactive", label: "Inactive Only" },
          ]}
        />
        <span className="text-xs text-white/30 font-[family-name:var(--font-dm-sans)]">
          {filtered.length} of {venues.length}
        </span>
      </FilterBar>

      {loading ? (
        <div className="text-white/30 text-sm py-16 text-center">Loading…</div>
      ) : (
        <AdminTable
          headers={["Venue", "Sports", "Rating", "Priority", "Contact", "Status", ""]}
          isEmpty={filtered.length === 0}
          empty="No venues found."
        >
          {filtered.map((v, i) => (
            <Tr key={v.id} last={i === filtered.length - 1}>
              <Td>
                <p className="font-medium text-white">{v.name}</p>
                <p className="text-white/40 text-xs mt-0.5">{v.address}</p>
              </Td>
              <Td dim>
                <div className="flex flex-wrap gap-1 max-w-[200px]">
                  {(v.sport_types ?? []).slice(0, 4).map((s) => (
                    <span key={s} className="text-xs px-1.5 py-0.5 bg-white/5 rounded capitalize">{s.replace(/_/g, " ")}</span>
                  ))}
                  {(v.sport_types?.length ?? 0) > 4 && (
                    <span className="text-xs text-white/30">+{(v.sport_types!.length) - 4}</span>
                  )}
                </div>
              </Td>
              <Td dim>{v.rating ? v.rating.toFixed(1) : "—"}</Td>
              <Td dim>{v.priority}</Td>
              <Td dim><span className="line-clamp-1 max-w-[180px] block text-xs">{v.contact_email ?? v.phone ?? "—"}</span></Td>
              <Td>
                <Badge label={v.is_active ? "Active" : "Inactive"} color={v.is_active ? "green" : "gray"} />
              </Td>
              <Td>
                <div className="flex items-center gap-3 justify-end whitespace-nowrap">
                  <ActionButton onClick={() => setEditing(v)} label="Edit" variant="primary" />
                  <ActionButton
                    onClick={() => toggleActive(v)}
                    label={actionId === v.id ? "…" : v.is_active ? "Deactivate" : "Activate"}
                    variant="ghost"
                  />
                  <ActionButton onClick={() => deleteVenue(v)} label="Delete" variant="danger" />
                </div>
              </Td>
            </Tr>
          ))}
        </AdminTable>
      )}
    </div>
  );
}
