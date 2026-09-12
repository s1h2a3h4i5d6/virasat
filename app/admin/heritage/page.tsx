"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Save,
  MapPin,
  ShieldCheck,
  Loader2,
} from "lucide-react";

type State = {
  id: string;
  name: string;
};

type District = {
  id: string;
  name: string;
  stateId: string;
};

type Category = {
  id: string;
  name: string;
};

type Heritage = {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string | null;
  description?: string | null;
  origin?: string | null;
  history?: string | null;
  significance?: string | null;
  story?: string | null;
  language?: string | null;
  regions?: string | null;
  practitioners?: string | null;
  festivals?: string | null;
  timeline?: string | null;
  preservationStatus:
    | "STABLE"
    | "VULNERABLE"
    | "ENDANGERED"
    | "CRITICAL";
  stateId?: string | null;
  districtId?: string | null;
  categoryId?: string | null;
  verified: boolean;
  state?: State | null;
  district?: District | null;
  category?: Category | null;
  _count?: {
    media: number;
    contributions: number;
  };
};

type FormData = {
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  origin: string;
  history: string;
  significance: string;
  story: string;
  language: string;
  regions: string;
  practitioners: string;
  festivals: string;
  timeline: string;
  preservationStatus:
    | "STABLE"
    | "VULNERABLE"
    | "ENDANGERED"
    | "CRITICAL";
  stateId: string;
  districtId: string;
  categoryId: string;
  verified: boolean;
};

const emptyForm: FormData = {
  name: "",
  slug: "",
  shortDescription: "",
  description: "",
  origin: "",
  history: "",
  significance: "",
  story: "",
  language: "",
  regions: "",
  practitioners: "",
  festivals: "",
  timeline: "",
  preservationStatus: "STABLE",
  stateId: "",
  districtId: "",
  categoryId: "",
  verified: false,
};

function makeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function AdminHeritagePage() {
  const [heritage, setHeritage] = useState<Heritage[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState<FormData>(emptyForm);

  async function loadData() {
    try {
      setLoading(true);

      const [heritageRes, statesRes, districtsRes, categoriesRes] =
        await Promise.all([
          fetch("/api/admin/heritage"),
          fetch("/api/admin/states"),
          fetch("/api/admin/districts"),
          fetch("/api/admin/categories"),
        ]);

      const heritageData = await heritageRes.json();
      const statesData = await statesRes.json();
      const districtsData = await districtsRes.json();
      const categoriesData = await categoriesRes.json();

      setHeritage(Array.isArray(heritageData) ? heritageData : []);
      setStates(Array.isArray(statesData) ? statesData : []);
      setDistricts(Array.isArray(districtsData) ? districtsData : []);
      setCategories(
        Array.isArray(categoriesData)
          ? categoriesData
          : []
      );
    } catch (error) {
      console.error("Failed to load heritage data:", error);
      alert("Failed to load heritage data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredDistricts = useMemo(() => {
    if (!form.stateId) return [];

    return districts.filter(
      (district) => district.stateId === form.stateId
    );
  }, [districts, form.stateId]);

  const filteredHeritage = useMemo(() => {
    const searchValue = search.toLowerCase().trim();

    return heritage.filter((item) => {
      const matchesSearch =
        !searchValue ||
        item.name.toLowerCase().includes(searchValue) ||
        item.slug.toLowerCase().includes(searchValue);

      const matchesState =
        !stateFilter || item.stateId === stateFilter;

      const matchesCategory =
        !categoryFilter || item.categoryId === categoryFilter;

      return matchesSearch && matchesState && matchesCategory;
    });
  }, [heritage, search, stateFilter, categoryFilter]);

  function updateField<K extends keyof FormData>(
    field: K,
    value: FormData[K]
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function openAddModal() {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEditModal(item: Heritage) {
    setEditingId(item.id);

    setForm({
      name: item.name || "",
      slug: item.slug || "",
      shortDescription: item.shortDescription || "",
      description: item.description || "",
      origin: item.origin || "",
      history: item.history || "",
      significance: item.significance || "",
      story: item.story || "",
      language: item.language || "",
      regions: item.regions || "",
      practitioners: item.practitioners || "",
      festivals: item.festivals || "",
      timeline: item.timeline || "",
      preservationStatus: item.preservationStatus || "STABLE",
      stateId: item.stateId || "",
      districtId: item.districtId || "",
      categoryId: item.categoryId || "",
      verified: item.verified || false,
    });

    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;

    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function saveHeritage() {
    if (!form.name.trim()) {
      alert("Heritage name is required.");
      return;
    }

    if (!form.slug.trim()) {
      alert("Slug is required.");
      return;
    }

    try {
      setSaving(true);

      const url = editingId
        ? `/api/admin/heritage/${editingId}`
        : "/api/admin/heritage";

      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Unable to save heritage.");
        return;
      }

      closeModal();
      await loadData();

      alert(
        editingId
          ? "Heritage updated successfully."
          : "Heritage created successfully."
      );
    } catch (error) {
      console.error("Save heritage error:", error);
      alert("Something went wrong while saving.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteHeritage(id: string, name: string) {
    const confirmed = window.confirm(
      `Delete "${name}"?\n\nThis will permanently remove this heritage record and its related media.`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/admin/heritage/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Unable to delete heritage.");
        return;
      }

      await loadData();
      alert("Heritage deleted successfully.");
    } catch (error) {
      console.error("Delete heritage error:", error);
      alert("Something went wrong while deleting.");
    }
  }

  return (
    <main className="min-h-screen bg-[#080808] px-4 py-8 text-white md:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="mb-2 text-sm uppercase tracking-[0.25em] text-amber-400">
              Heritage CMS
            </p>

            <h1 className="text-3xl font-semibold md:text-4xl">
              Traditions & Heritage
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-white/55">
              Create, edit and manage the cultural heritage records
              displayed across Virasat.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-medium text-black transition hover:bg-white/90"
          >
            <Plus size={18} />
            Add Heritage
          </button>
        </div>

        {/* Filters */}
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
              />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search heritage..."
                className="w-full rounded-xl border border-white/10 bg-black/30 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-white/30"
              />
            </div>

            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none"
            >
              <option value="">All States</option>

              {states.map((state) => (
                <option key={state.id} value={state.id}>
                  {state.name}
                </option>
              ))}
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none"
            >
              <option value="">All Categories</option>

              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Records */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
          {loading ? (
            <div className="flex min-h-64 items-center justify-center">
              <Loader2 className="animate-spin text-white/50" />
            </div>
          ) : filteredHeritage.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
              <MapPin className="mb-3 text-white/25" size={36} />

              <h2 className="text-lg font-medium">
                No heritage records found
              </h2>

              <p className="mt-1 text-sm text-white/40">
                Try changing the filters or create a new heritage record.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="border-b border-white/10 bg-white/[0.03]">
                  <tr className="text-left text-xs uppercase tracking-wider text-white/40">
                    <th className="px-5 py-4">Heritage</th>
                    <th className="px-5 py-4">Location</th>
                    <th className="px-5 py-4">Category</th>
                    <th className="px-5 py-4">Preservation</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredHeritage.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-white/5 transition hover:bg-white/[0.03]"
                    >
                      <td className="px-5 py-4">
                        <div className="font-medium">
                          {item.name}
                        </div>

                        <div className="mt-1 text-xs text-white/35">
                          /heritage/{item.slug}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-white/65">
                        {item.state?.name || "—"}
                        {item.district?.name
                          ? ` · ${item.district.name}`
                          : ""}
                      </td>

                      <td className="px-5 py-4 text-sm text-white/65">
                        {item.category?.name || "—"}
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-full border border-white/10 px-3 py-1 text-xs">
                          {item.preservationStatus}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        {item.verified ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
                            <ShieldCheck size={13} />
                            Verified
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-400/10 px-3 py-1 text-xs text-amber-300">
                            Draft
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEditModal(item)}
                            className="rounded-lg border border-white/10 p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
                            title="Edit"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            onClick={() =>
                              deleteHeritage(item.id, item.name)
                            }
                            className="rounded-lg border border-red-400/10 p-2 text-red-300/70 transition hover:bg-red-400/10 hover:text-red-300"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-4 text-sm text-white/35">
          Showing {filteredHeritage.length} of {heritage.length} heritage
          records
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 p-4 backdrop-blur-sm">
          <div className="mx-auto my-8 max-w-5xl rounded-3xl border border-white/10 bg-[#111] shadow-2xl">
            {/* Modal header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#111]/95 px-6 py-5 backdrop-blur">
              <div>
                <h2 className="text-xl font-semibold">
                  {editingId ? "Edit Heritage" : "Add Heritage"}
                </h2>

                <p className="mt-1 text-sm text-white/40">
                  Manage the complete cultural heritage profile.
                </p>
              </div>

              <button
                onClick={closeModal}
                className="rounded-xl p-2 text-white/50 transition hover:bg-white/10 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-8 p-6">
              {/* Basic */}
              <section>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-amber-400">
                  Basic Information
                </h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm text-white/65">
                      Heritage Name *
                    </label>

                    <input
                      value={form.name}
                      onChange={(e) => {
                        const name = e.target.value;

                        setForm((previous) => ({
                          ...previous,
                          name,
                          slug: editingId
                            ? previous.slug
                            : makeSlug(name),
                        }));
                      }}
                      placeholder="e.g. Lavani"
                      className="admin-input"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-white/65">
                      Slug *
                    </label>

                    <input
                      value={form.slug}
                      onChange={(e) =>
                        updateField("slug", makeSlug(e.target.value))
                      }
                      placeholder="lavani"
                      className="admin-input"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm text-white/65">
                      Short Description
                    </label>

                    <input
                      value={form.shortDescription}
                      onChange={(e) =>
                        updateField(
                          "shortDescription",
                          e.target.value
                        )
                      }
                      placeholder="Short description shown on cards..."
                      className="admin-input"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm text-white/65">
                      Full Description
                    </label>

                    <textarea
                      value={form.description}
                      onChange={(e) =>
                        updateField("description", e.target.value)
                      }
                      rows={5}
                      placeholder="Detailed description..."
                      className="admin-input resize-y"
                    />
                  </div>
                </div>
              </section>

              {/* Location */}
              <section>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-amber-400">
                  Geography
                </h3>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-sm text-white/65">
                      State
                    </label>

                    <select
                      value={form.stateId}
                      onChange={(e) => {
                        setForm((previous) => ({
                          ...previous,
                          stateId: e.target.value,
                          districtId: "",
                        }));
                      }}
                      className="admin-input"
                    >
                      <option value="">Select State</option>

                      {states.map((state) => (
                        <option key={state.id} value={state.id}>
                          {state.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-white/65">
                      District
                    </label>

                    <select
                      value={form.districtId}
                      onChange={(e) =>
                        updateField("districtId", e.target.value)
                      }
                      disabled={!form.stateId}
                      className="admin-input disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <option value="">
                        {form.stateId
                          ? "Select District"
                          : "Select State First"}
                      </option>

                      {filteredDistricts.map((district) => (
                        <option
                          key={district.id}
                          value={district.id}
                        >
                          {district.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-white/65">
                      Category
                    </label>

                    <select
                      value={form.categoryId}
                      onChange={(e) =>
                        updateField("categoryId", e.target.value)
                      }
                      className="admin-input"
                    >
                      <option value="">Select Category</option>

                      {categories.map((category) => (
                        <option
                          key={category.id}
                          value={category.id}
                        >
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </section>

              {/* Cultural details */}
              <section>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-amber-400">
                  Cultural Details
                </h3>

                <div className="grid gap-4 md:grid-cols-2">
                  {[
                    ["origin", "Origin"],
                    ["history", "History"],
                    ["significance", "Cultural Significance"],
                    ["story", "Story"],
                    ["language", "Language"],
                    ["regions", "Regions"],
                    ["practitioners", "Practitioners"],
                    ["festivals", "Festivals"],
                    ["timeline", "Timeline"],
                  ].map(([field, label]) => (
                    <div
                      key={field}
                      className={
                        field === "story" ||
                        field === "history" ||
                        field === "significance"
                          ? "md:col-span-2"
                          : ""
                      }
                    >
                      <label className="mb-2 block text-sm text-white/65">
                        {label}
                      </label>

                      <textarea
                        value={
                          form[field as keyof FormData] as string
                        }
                        onChange={(e) =>
                          updateField(
                            field as keyof FormData,
                            e.target.value as never
                          )
                        }
                        rows={
                          field === "story" ||
                          field === "history" ||
                          field === "significance"
                            ? 4
                            : 2
                        }
                        placeholder={`Enter ${label.toLowerCase()}...`}
                        className="admin-input resize-y"
                      />
                    </div>
                  ))}
                </div>
              </section>

              {/* Preservation */}
              <section>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-amber-400">
                  Preservation & Publishing
                </h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm text-white/65">
                      Preservation Status
                    </label>

                    <select
                      value={form.preservationStatus}
                      onChange={(e) =>
                        updateField(
                          "preservationStatus",
                          e.target.value as FormData["preservationStatus"]
                        )
                      }
                      className="admin-input"
                    >
                      <option value="STABLE">Stable</option>
                      <option value="VULNERABLE">Vulnerable</option>
                      <option value="ENDANGERED">Endangered</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>

                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                    <input
                      type="checkbox"
                      checked={form.verified}
                      onChange={(e) =>
                        updateField("verified", e.target.checked)
                      }
                      className="h-4 w-4"
                    />

                    <div>
                      <div className="text-sm font-medium">
                        Verified & Published
                      </div>

                      <div className="text-xs text-white/40">
                        Allow this record to appear as verified content.
                      </div>
                    </div>
                  </label>
                </div>
              </section>

              {/* Save */}
              <div className="flex justify-end gap-3 border-t border-white/10 pt-6">
                <button
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-white/10 px-5 py-3 text-sm text-white/70 transition hover:bg-white/5 disabled:opacity-40"
                >
                  Cancel
                </button>

                <button
                  onClick={saveHeritage}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : (
                    <Save size={17} />
                  )}

                  {editingId ? "Save Changes" : "Create Heritage"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .admin-input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(0, 0, 0, 0.3);
          padding: 0.75rem 1rem;
          color: white;
          outline: none;
          transition: border-color 0.2s;
        }

        .admin-input:focus {
          border-color: rgba(255, 255, 255, 0.3);
        }

        .admin-input::placeholder {
          color: rgba(255, 255, 255, 0.25);
        }

        .admin-input option {
          background: #111;
          color: white;
        }
      `}</style>
    </main>
  );
}
