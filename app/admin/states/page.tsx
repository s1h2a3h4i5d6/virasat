"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Map,
  Landmark,
} from "lucide-react";

type State = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  _count: {
    districts: number;
    heritage: number;
  };
};

export default function AdminStatesPage() {
  const [states, setStates] = useState<State[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  async function loadStates() {
    setLoading(true);

    try {
      const response = await fetch("/api/admin/states");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load states.");
      }

      setStates(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStates();
  }, []);

  function openCreate() {
    setEditingId(null);
    setName("");
    setSlug("");
    setDescription("");
    setImageUrl("");
    setError("");
    setMessage("");
    setModalOpen(true);
  }

  function openEdit(state: State) {
    setEditingId(state.id);
    setName(state.name);
    setSlug(state.slug);
    setDescription(state.description || "");
    setImageUrl(state.imageUrl || "");
    setError("");
    setMessage("");
    setModalOpen(true);
  }

  function closeModal() {
    if (!saving) {
      setModalOpen(false);
    }
  }

  function generateSlug(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  function handleNameChange(value: string) {
    setName(value);

    if (!editingId) {
      setSlug(generateSlug(value));
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const url = editingId
        ? `/api/admin/states/${editingId}`
        : "/api/admin/states";

      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          slug,
          description: description || null,
          imageUrl: imageUrl || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to save state.");
      }

      setMessage(
        editingId
          ? "State updated successfully."
          : "State added successfully."
      );

      await loadStates();

      setTimeout(() => {
        setModalOpen(false);
      }, 700);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(state: State) {
    const confirmed = window.confirm(
      `Delete "${state.name}"? This may also remove related districts and heritage records.`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/admin/states/${state.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to delete state.");
      }

      setMessage(`${state.name} deleted successfully.`);
      await loadStates();
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.25em] text-white/30">
            Geography
          </div>

          <h2 className="mt-2 font-serif text-4xl font-semibold">
            States
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">
            Manage the states and union territories displayed throughout
            the Virasat heritage map.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-white/90"
        >
          <Plus size={18} />
          Add State
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

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-40 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]"
            />
          ))}
        </div>
      ) : states.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 p-12 text-center">
          <Map className="mx-auto text-white/30" size={36} />
          <h3 className="mt-4 font-medium">No states found</h3>
          <p className="mt-2 text-sm text-white/40">
            Add your first state to begin managing geography.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {states.map((state) => (
            <div
              key={state.id}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:bg-white/[0.05]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05]">
                  <Map size={20} className="text-white/70" />
                </div>

                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(state)}
                    className="rounded-lg p-2 text-white/40 transition hover:bg-white/10 hover:text-white"
                    title="Edit state"
                  >
                    <Pencil size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(state)}
                    className="rounded-lg p-2 text-white/40 transition hover:bg-red-500/10 hover:text-red-300"
                    title="Delete state"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <h3 className="mt-5 text-lg font-semibold">
                {state.name}
              </h3>

              <p className="mt-1 text-xs text-white/30">
                /{state.slug}
              </p>

              {state.description && (
                <p className="mt-3 line-clamp-2 text-sm leading-5 text-white/45">
                  {state.description}
                </p>
              )}

              <div className="mt-5 flex gap-3 border-t border-white/10 pt-4">
                <div className="text-xs text-white/40">
                  <span className="font-semibold text-white/70">
                    {state._count.districts}
                  </span>{" "}
                  districts
                </div>

                <div className="flex items-center gap-1 text-xs text-white/40">
                  <Landmark size={13} />
                  <span className="font-semibold text-white/70">
                    {state._count.heritage}
                  </span>{" "}
                  heritage
                </div>
              </div>
            </div>
          ))}
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
                  {editingId ? "Edit State" : "Add State"}
                </h3>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl p-2 text-white/40 hover:bg-white/10 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm text-white/60">
                  State / UT Name
                </label>

                <input
                  value={name}
                  onChange={(event) =>
                    handleNameChange(event.target.value)
                  }
                  placeholder="e.g. Maharashtra"
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
                  onChange={(event) => setSlug(event.target.value)}
                  placeholder="maharashtra"
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/30"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/60">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  rows={4}
                  placeholder="Short description of the state..."
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/30"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/60">
                  Image URL
                </label>

                <input
                  value={imageUrl}
                  onChange={(event) =>
                    setImageUrl(event.target.value)
                  }
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
                  onClick={closeModal}
                  className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm text-white/60 transition hover:bg-white/10 hover:text-white"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Save Changes"
                      : "Add State"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
