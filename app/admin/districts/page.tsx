"use client";

import { FormEvent, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, MapPin } from "lucide-react";

type State = {
  id: string;
  name: string;
};

type District = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  state: State;
  _count: {
    heritage: number;
  };
};

export default function AdminDistrictsPage() {
  const [districts, setDistricts] = useState<District[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [stateId, setStateId] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const [search, setSearch] = useState("");
  const [filterState, setFilterState] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadData() {
    setLoading(true);

    try {
      const [districtResponse, stateResponse] = await Promise.all([
        fetch("/api/admin/districts"),
        fetch("/api/admin/states"),
      ]);

      const districtData = await districtResponse.json();
      const stateData = await stateResponse.json();

      if (!districtResponse.ok) {
        throw new Error(districtData.error || "Unable to load districts.");
      }

      if (!stateResponse.ok) {
        throw new Error(stateData.error || "Unable to load states.");
      }

      setDistricts(districtData);
      setStates(stateData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function generateSlug(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  function openCreate() {
    setEditingId(null);
    setName("");
    setSlug("");
    setStateId("");
    setImageUrl("");
    setError("");
    setMessage("");
    setModalOpen(true);
  }

  function openEdit(district: District) {
    setEditingId(district.id);
    setName(district.name);
    setSlug(district.slug);
    setStateId(district.state.id);
    setImageUrl(district.imageUrl || "");
    setError("");
    setMessage("");
    setModalOpen(true);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!stateId) {
      setError("Please select a state.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        editingId
          ? `/api/admin/districts/${editingId}`
          : "/api/admin/districts",
        {
          method: editingId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            slug,
            stateId,
            imageUrl: imageUrl || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to save district.");
      }

      setMessage(
        editingId
          ? "District updated successfully."
          : "District added successfully."
      );

      await loadData();

      setTimeout(() => {
        setModalOpen(false);
      }, 700);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(district: District) {
    const confirmed = window.confirm(
      `Delete "${district.name}" from ${district.state.name}?`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `/api/admin/districts/${district.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to delete district.");
      }

      setMessage(`${district.name} deleted successfully.`);
      await loadData();
    } catch (err: any) {
      setError(err.message);
    }
  }

  const filteredDistricts = districts.filter((district) => {
    const matchesSearch =
      district.name.toLowerCase().includes(search.toLowerCase()) ||
      district.state.name.toLowerCase().includes(search.toLowerCase());

    const matchesState =
      !filterState || district.state.id === filterState;

    return matchesSearch && matchesState;
  });

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.25em] text-white/30">
            Geography
          </div>

          <h2 className="mt-2 font-serif text-4xl font-semibold">
            Districts
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">
            Manage districts used by the Virasat interactive heritage
            map and heritage records.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-medium text-black hover:bg-white/90"
        >
          <Plus size={18} />
          Add District
        </button>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {message && (
        <div className="mb-5 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
          {message}
        </div>
      )}

      <div className="mb-5 flex flex-col gap-3 md:flex-row">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search districts or states..."
          className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/30"
        />

        <select
          value={filterState}
          onChange={(e) => setFilterState(e.target.value)}
          className="rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-sm text-white outline-none"
        >
          <option value="">All States</option>
          {states.map((state) => (
            <option key={state.id} value={state.id}>
              {state.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="h-80 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]" />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left">
              <thead className="border-b border-white/10 bg-white/[0.03]">
                <tr>
                  <th className="px-5 py-4 text-xs uppercase tracking-wider text-white/30">
                    District
                  </th>
                  <th className="px-5 py-4 text-xs uppercase tracking-wider text-white/30">
                    State
                  </th>
                  <th className="px-5 py-4 text-xs uppercase tracking-wider text-white/30">
                    Heritage
                  </th>
                  <th className="px-5 py-4 text-right text-xs uppercase tracking-wider text-white/30">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredDistricts.map((district) => (
                  <tr
                    key={district.id}
                    className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5">
                          <MapPin size={16} className="text-white/50" />
                        </div>

                        <div>
                          <div className="font-medium">
                            {district.name}
                          </div>
                          <div className="text-xs text-white/30">
                            /{district.slug}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-white/60">
                      {district.state.name}
                    </td>

                    <td className="px-5 py-4 text-sm text-white/60">
                      {district._count.heritage}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(district)}
                          className="rounded-lg p-2 text-white/40 hover:bg-white/10 hover:text-white"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(district)}
                          className="rounded-lg p-2 text-white/40 hover:bg-red-500/10 hover:text-red-300"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredDistricts.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-16 text-center text-sm text-white/40"
                    >
                      No districts found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-white/10 px-5 py-4 text-xs text-white/30">
            Showing {filteredDistricts.length} of {districts.length} districts
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#111] p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-white/30">
                  Geography
                </div>
                <h3 className="mt-1 text-xl font-semibold">
                  {editingId ? "Edit District" : "Add District"}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-xl p-2 text-white/40 hover:bg-white/10 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm text-white/60">
                  State
                </label>

                <select
                  value={stateId}
                  onChange={(e) => setStateId(e.target.value)}
                  required
                  className="w-full rounded-xl border border-white/10 bg-[#181818] px-4 py-3 text-sm text-white outline-none focus:border-white/30"
                >
                  <option value="">Select state</option>

                  {states.map((state) => (
                    <option key={state.id} value={state.id}>
                      {state.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/60">
                  District Name
                </label>

                <input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!editingId) {
                      setSlug(generateSlug(e.target.value));
                    }
                  }}
                  placeholder="e.g. Pune"
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/30"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/60">
                  Slug
                </label>

                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="pune"
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/30"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/60">
                  Image URL
                </label>

                <input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/30"
                />
              </div>

              {error && (
                <div className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              {message && (
                <div className="rounded-xl bg-white/5 px-4 py-3 text-sm text-white/70">
                  {message}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm text-white/60 hover:bg-white/10 hover:text-white"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-xl bg-white px-4 py-3 text-sm font-medium text-black hover:bg-white/90 disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Save Changes"
                      : "Add District"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
