"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Save,
  Loader2,
  Tags,
  Upload,
  Image as ImageIcon,
} from "lucide-react";

type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  _count?: {
    heritage: number;
  };
};

type FormData = {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
};

const emptyForm: FormData = {
  name: "",
  slug: "",
  description: "",
  imageUrl: "",
};

function makeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState<FormData>(emptyForm);

  async function loadCategories() {
    try {
      setLoading(true);

      const response = await fetch("/api/admin/categories");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load categories.");
      }

      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Load categories error:", error);
      alert("Failed to load categories.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  const filteredCategories = useMemo(() => {
    const value = search.toLowerCase().trim();

    if (!value) return categories;

    return categories.filter(
      (category) =>
        category.name.toLowerCase().includes(value) ||
        category.slug.toLowerCase().includes(value)
    );
  }, [categories, search]);

  function openAddModal() {
    setEditingId(null);
    setForm(emptyForm);
    setUploadError("");
    setModalOpen(true);
  }

  function openEditModal(category: Category) {
    setEditingId(category.id);

    setForm({
      name: category.name || "",
      slug: category.slug || "",
      description: category.description || "",
      imageUrl: category.imageUrl || "",
    });

    setUploadError("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving || uploading) return;

    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setUploadError("");
  }

  async function handleUploadPhoto(file: File) {
    try {
      setUploading(true);
      setUploadError("");

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/categories/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload category image.");
      }

      setForm((previous) => ({
        ...previous,
        imageUrl: data.url,
      }));
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload image.");
    } finally {
      setUploading(false);
    }
  }

  function handleRemovePhoto() {
    setForm((previous) => ({
      ...previous,
      imageUrl: "",
    }));
    setUploadError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function saveCategory() {
    if (!form.name.trim()) {
      alert("Category name is required.");
      return;
    }

    if (!form.slug.trim()) {
      alert("Slug is required.");
      return;
    }

    try {
      setSaving(true);

      const url = editingId
        ? `/api/admin/categories/${editingId}`
        : "/api/admin/categories";

      const method = editingId ? "PUT" : "POST";

      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim() || null,
        imageUrl: form.imageUrl.trim() || null,
      };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Unable to save category.");
        return;
      }

      closeModal();
      await loadCategories();

      alert(
        editingId
          ? "Category updated successfully."
          : "Category created successfully."
      );
    } catch (error) {
      console.error("Save category error:", error);
      alert("Something went wrong while saving.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteCategory(id: string, name: string) {
    const confirmed = window.confirm(
      `Delete "${name}"?\n\nCategories currently used by heritage records cannot be deleted.`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Unable to delete category.");
        return;
      }

      await loadCategories();

      alert("Category deleted successfully.");
    } catch (error) {
      console.error("Delete category error:", error);
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
              Categories
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-white/55">
              Manage the cultural categories used to organize Virasat
              heritage records.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-medium text-black transition hover:bg-white/90"
          >
            <Plus size={18} />
            Add Category
          </button>
        </div>

        {/* Search */}
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="relative max-w-xl">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search categories..."
              className="w-full rounded-xl border border-white/10 bg-black/30 py-3 pl-10 pr-4 text-sm text-white outline-none transition focus:border-white/30"
            />
          </div>
        </div>

        {/* Category cards */}
        {loading ? (
          <div className="flex min-h-64 items-center justify-center">
            <Loader2 className="animate-spin text-white/50" />
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-center">
            <Tags className="mb-3 text-white/25" size={38} />

            <h2 className="text-lg font-medium">
              No categories found
            </h2>

            <p className="mt-1 text-sm text-white/40">
              Create a category to organize your heritage content.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCategories.map((category) => (
              <div
                key={category.id}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition hover:border-white/20 hover:bg-white/[0.05]"
              >
                {category.imageUrl ? (
                  <div className="relative h-44 overflow-hidden border-b border-white/10 bg-white/5">
                    <img
                      src={category.imageUrl}
                      alt={category.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex h-44 items-center justify-center border-b border-white/5 bg-white/[0.02]">
                    <Tags size={38} className="text-white/10" />
                  </div>
                )}

                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold">
                        {category.name}
                      </h2>

                      <p className="mt-1 text-xs text-white/30">
                        /{category.slug}
                      </p>
                    </div>

                    <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/50">
                      {category._count?.heritage || 0} heritage
                    </span>
                  </div>

                  {category.description && (
                    <p className="mt-4 line-clamp-3 text-sm leading-6 text-white/50">
                      {category.description}
                    </p>
                  )}

                  <div className="mt-5 flex gap-2">
                    <button
                      onClick={() => openEditModal(category)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 py-2.5 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
                    >
                      <Pencil size={15} />
                      Edit
                    </button>

                    <button
                      onClick={() =>
                        deleteCategory(category.id, category.name)
                      }
                      className="rounded-xl border border-red-400/10 px-4 py-2.5 text-red-300/70 transition hover:bg-red-400/10 hover:text-red-300"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-5 text-sm text-white/35">
          Showing {filteredCategories.length} of {categories.length} categories
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 p-4 backdrop-blur-sm">
          <div className="mx-auto my-12 max-w-2xl rounded-3xl border border-white/10 bg-[#111] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <div>
                <h2 className="text-xl font-semibold">
                  {editingId ? "Edit Category" : "Add Category"}
                </h2>

                <p className="mt-1 text-sm text-white/40">
                  Define how heritage content is organized.
                </p>
              </div>

              <button
                onClick={closeModal}
                className="rounded-xl p-2 text-white/50 transition hover:bg-white/10 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div>
                <label className="mb-2 block text-sm text-white/65">
                  Category Name *
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
                  placeholder="e.g. Folk Dance"
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
                    setForm((previous) => ({
                      ...previous,
                      slug: makeSlug(e.target.value),
                    }))
                  }
                  placeholder="folk-dance"
                  className="admin-input"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/65">
                  Description
                </label>

                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((previous) => ({
                      ...previous,
                      description: e.target.value,
                    }))
                  }
                  rows={4}
                  placeholder="Describe this cultural category..."
                  className="admin-input resize-y"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium text-white/70">
                    Category Photo / Thumbnail
                  </label>
                  {form.imageUrl && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="inline-flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition"
                    >
                      <Trash2 size={13} />
                      Remove Photo
                    </button>
                  )}
                </div>

                {form.imageUrl ? (
                  <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                    <div className="relative h-48 w-full overflow-hidden bg-white/5">
                      <img
                        src={form.imageUrl}
                        alt="Category preview"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100 flex items-end p-4">
                        <div className="flex w-full items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-2 text-xs font-semibold text-black transition hover:bg-white/90 disabled:opacity-50"
                          >
                            <Upload size={14} />
                            {uploading ? "Uploading..." : "Replace Photo"}
                          </button>
                          <button
                            type="button"
                            onClick={handleRemovePhoto}
                            className="inline-flex items-center gap-2 rounded-xl bg-red-500/90 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-red-600"
                          >
                            <Trash2 size={14} />
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-white/10 p-3 bg-white/[0.02]">
                      <div className="flex items-center gap-2 min-w-0">
                        <ImageIcon size={16} className="text-amber-400 shrink-0" />
                        <span className="truncate text-xs text-white/60">
                          {form.imageUrl}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="ml-2 shrink-0 text-xs text-white/70 hover:text-white underline"
                      >
                        Change
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div
                      onClick={() => !uploading && fileInputRef.current?.click()}
                      className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/15 bg-white/[0.02] p-8 text-center cursor-pointer transition hover:border-white/30 hover:bg-white/[0.04] ${
                        uploading ? "opacity-60 cursor-not-allowed" : ""
                      }`}
                    >
                      {uploading ? (
                        <div className="flex flex-col items-center">
                          <Loader2 size={32} className="animate-spin text-amber-400 mb-2" />
                          <p className="text-sm font-medium text-white/80">Uploading photo...</p>
                        </div>
                      ) : (
                        <>
                          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/60">
                            <Upload size={22} />
                          </div>
                          <p className="text-sm font-medium text-white/90">
                            Click to upload category photo
                          </p>
                          <p className="mt-1 text-xs text-white/40">
                            JPG, PNG, WEBP, or GIF up to 10 MB. Will appear as the card thumbnail.
                          </p>
                        </>
                      )}
                    </div>

                    <div className="mt-3">
                      <label className="mb-1 block text-xs text-white/40">
                        Or paste image URL directly
                      </label>
                      <input
                        value={form.imageUrl}
                        onChange={(e) =>
                          setForm((previous) => ({
                            ...previous,
                            imageUrl: e.target.value,
                          }))
                        }
                        placeholder="https://example.com/category.jpg"
                        className="admin-input text-xs"
                      />
                    </div>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleUploadPhoto(file);
                    }
                    e.target.value = "";
                  }}
                />

                {uploadError && (
                  <p className="mt-2 text-xs text-red-400">{uploadError}</p>
                )}
              </div>

              <div className="flex justify-end gap-3 border-t border-white/10 pt-5">
                <button
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-white/10 px-5 py-3 text-sm text-white/70 transition hover:bg-white/5"
                >
                  Cancel
                </button>

                <button
                  onClick={saveCategory}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : (
                    <Save size={17} />
                  )}

                  {editingId ? "Save Changes" : "Create Category"}
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
