"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Image as ImageIcon,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import SearchableHeritageSelect from "@/components/admin/SearchableHeritageSelect";

type Media = {
  id: string;
  title: string | null;
  type: "PHOTO" | "VIDEO" | "AUDIO" | "DOCUMENT";
  url: string;
  description: string | null;
  heritageId: string | null;
  heritage?: {
    id: string;
    name: string;
  } | null;
};

type Heritage = {
  id: string;
  name: string;
};

const mediaTypes = ["PHOTO", "VIDEO", "AUDIO", "DOCUMENT"] as const;

export default function AdminMediaPage() {
  const [media, setMedia] = useState<Media[]>([]);
  const [heritage, setHeritage] = useState<Heritage[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [heritageFilter, setHeritageFilter] = useState("ALL");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [type, setType] = useState<(typeof mediaTypes)[number]>("PHOTO");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [heritageId, setHeritageId] = useState("");

  const [sourceMode, setSourceMode] = useState<"URL" | "UPLOAD">("URL");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function loadData() {
    try {
      setLoading(true);

      const [mediaRes, heritageRes] = await Promise.all([
        fetch("/api/admin/media", { cache: "no-store" }),
        fetch("/api/admin/heritage", { cache: "no-store" }),
      ]);

      if (!mediaRes.ok || !heritageRes.ok) {
        throw new Error("Failed to load data");
      }

      const mediaData = await mediaRes.json();
      const heritageData = await heritageRes.json();

      // APIs currently return plain arrays.
      // This also supports object responses for future compatibility.
      setMedia(
        Array.isArray(mediaData)
          ? mediaData
          : mediaData.media || []
      );

      setHeritage(
        Array.isArray(heritageData)
          ? heritageData
          : heritageData.heritage || []
      );
    } catch (error) {
      console.error(error);
      alert("Failed to load media data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredMedia = useMemo(() => {
    const query = search.trim().toLowerCase();

    return media.filter((item) => {
      const matchesSearch =
        !query ||
        item.title?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.heritage?.name?.toLowerCase().includes(query);

      const matchesType =
        typeFilter === "ALL" || item.type === typeFilter;

      const matchesHeritage =
        heritageFilter === "ALL" ||
        item.heritageId === heritageFilter;

      return matchesSearch && matchesType && matchesHeritage;
    });
  }, [media, search, typeFilter, heritageFilter]);

  function openAddModal() {
    setEditingId(null);
    setTitle("");
    setType("PHOTO");
    setUrl("");
    setDescription("");
    setHeritageId("");
    setSourceMode("URL");
    setModalOpen(true);
  }

  function openEditModal(item: Media) {
    setEditingId(item.id);
    setTitle(item.title || "");
    setType(item.type);
    setUrl(item.url);
    setDescription(item.description || "");
    setHeritageId(item.heritageId || "");
    setSourceMode("URL");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving || uploading) return;
    setModalOpen(false);
  }

  async function handleUpload(file: File) {
    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/media/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setUrl(data.url);

      if (data.type) {
        setType(data.type);
      }

      alert("File uploaded successfully.");
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error
          ? error.message
          : "Upload failed."
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!url.trim()) {
      alert("Please provide a media URL or upload a file.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        title,
        type,
        url,
        description,
        heritageId,
      };

      const response = await fetch(
        editingId
          ? `/api/admin/media/${editingId}`
          : "/api/admin/media",
        {
          method: editingId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to save media.");
      }

      setModalOpen(false);
      await loadData();
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error
          ? error.message
          : "Unable to save media."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this media record?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/media/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to delete media.");
      }

      await loadData();
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error
          ? error.message
          : "Unable to delete media."
      );
    }
  }

  function getMediaPreview(item: Media) {
    if (item.type === "PHOTO") {
      return (
        <img
          src={item.url}
          alt={item.title || "Media"}
          className="h-20 w-28 rounded-lg object-cover"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      );
    }

    if (item.type === "VIDEO") {
      return (
        <video
          src={item.url}
          className="h-20 w-28 rounded-lg object-cover"
          controls
        />
      );
    }

    if (item.type === "AUDIO") {
      return (
        <div className="flex h-20 w-28 items-center justify-center rounded-lg bg-white/[0.05]">
          <span className="text-xs text-white/50">AUDIO</span>
        </div>
      );
    }

    return (
      <div className="flex h-20 w-28 items-center justify-center rounded-lg bg-white/[0.05]">
        <span className="text-xs text-white/50">DOCUMENT</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0b0b] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="mb-2 text-sm uppercase tracking-[0.25em] text-white/40">
              Admin CMS
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">
              Media Library
            </h1>
            <p className="mt-2 text-sm text-white/45">
              Manage photos, videos, audio and documents.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-white/90"
          >
            <Plus size={18} />
            Add Media
          </button>
        </div>

        <div className="mb-6 grid gap-3 md:grid-cols-[1fr_180px_220px]">
          <div className="flex items-center rounded-xl border border-white/10 bg-white/[0.03] px-4">
            <Search size={18} className="mr-3 text-white/35" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search media..."
              className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-white/30"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-sm text-white outline-none"
          >
            <option value="ALL">All Types</option>
            <option value="PHOTO">Photos</option>
            <option value="VIDEO">Videos</option>
            <option value="AUDIO">Audio</option>
            <option value="DOCUMENT">Documents</option>
          </select>

          <select
            value={heritageFilter}
            onChange={(e) => setHeritageFilter(e.target.value)}
            className="rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-sm text-white outline-none"
          >
            <option value="ALL">All Heritage</option>
            {heritage.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4 text-sm text-white/40">
          Showing {filteredMedia.length} of {media.length} media records
        </div>

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-12 text-center text-white/40">
            Loading media...
          </div>
        ) : filteredMedia.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-12 text-center">
            <ImageIcon className="mx-auto mb-4 text-white/20" size={40} />
            <p className="text-white/50">No media records found.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
            <div className="divide-y divide-white/10">
              {filteredMedia.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-4 p-4 transition hover:bg-white/[0.025] md:flex-row md:items-center"
                >
                  <div className="shrink-0">
                    {getMediaPreview(item)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium">
                        {item.title || "Untitled Media"}
                      </h3>

                      <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-wider text-white/45">
                        {item.type}
                      </span>
                    </div>

                    {item.description && (
                      <p className="mt-1 text-sm text-white/40">
                        {item.description}
                      </p>
                    )}

                    {item.heritage && (
                      <p className="mt-2 text-xs text-white/30">
                        Heritage:{" "}
                        <span className="text-white/55">
                          {item.heritage.name}
                        </span>
                      </p>
                    )}

                    <p className="mt-1 truncate text-xs text-white/20">
                      {item.url}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => openEditModal(item)}
                      className="rounded-lg border border-white/10 p-2.5 text-white/50 transition hover:bg-white/10 hover:text-white"
                      title="Edit"
                    >
                      <Pencil size={17} />
                    </button>

                    <button
                      onClick={() => handleDelete(item.id)}
                      className="rounded-lg border border-red-500/20 p-2.5 text-red-400/70 transition hover:bg-red-500/10 hover:text-red-400"
                      title="Delete"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {modalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#111] shadow-2xl">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#111] px-6 py-5">
                <div>
                  <h2 className="text-xl font-semibold">
                    {editingId ? "Edit Media" : "Add Media"}
                  </h2>
                  <p className="mt-1 text-xs text-white/35">
                    Add a URL or upload a media file.
                  </p>
                </div>

                <button
                  onClick={closeModal}
                  className="rounded-lg p-2 text-white/40 hover:bg-white/10 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 p-6">
                <div>
                  <label className="mb-2 block text-sm text-white/60">
                    Title
                  </label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Example: Shivneri Fort"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm outline-none placeholder:text-white/25 focus:border-white/30"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-white/60">
                    Media Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) =>
                      setType(e.target.value as (typeof mediaTypes)[number])
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm outline-none"
                  >
                    <option value="PHOTO">Photo</option>
                    <option value="VIDEO">Video</option>
                    <option value="AUDIO">Audio</option>
                    <option value="DOCUMENT">Document</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-white/60">
                    Heritage
                  </label>

                  <SearchableHeritageSelect
                    heritage={heritage}
                    value={heritageId}
                    onChange={setHeritageId}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-white/60">
                    Media Source
                  </label>

                  <div className="mb-3 flex rounded-xl border border-white/10 bg-white/[0.03] p-1">
                    <button
                      type="button"
                      onClick={() => setSourceMode("URL")}
                      className={`flex-1 rounded-lg px-4 py-2.5 text-sm transition ${
                        sourceMode === "URL"
                          ? "bg-white text-black"
                          : "text-white/50 hover:text-white"
                      }`}
                    >
                      URL
                    </button>

                    <button
                      type="button"
                      onClick={() => setSourceMode("UPLOAD")}
                      className={`flex-1 rounded-lg px-4 py-2.5 text-sm transition ${
                        sourceMode === "UPLOAD"
                          ? "bg-white text-black"
                          : "text-white/50 hover:text-white"
                      }`}
                    >
                      Upload
                    </button>
                  </div>

                  {sourceMode === "URL" ? (
                    <input
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://example.com/image.jpg or /uploads/media/file.jpg"
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm outline-none placeholder:text-white/25 focus:border-white/30"
                    />
                  ) : (
                    <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-10 text-center transition hover:border-white/30 hover:bg-white/[0.04]">
                      <Upload size={28} className="mb-3 text-white/35" />

                      <span className="text-sm text-white/60">
                        {uploading
                          ? "Uploading..."
                          : "Choose a file to upload"}
                      </span>

                      <span className="mt-2 text-xs text-white/25">
                        JPG, PNG, WEBP, GIF, MP4, WEBM, MP3, WAV, OGG, PDF
                        · Max 50 MB
                      </span>

                      <input
                        type="file"
                        className="hidden"
                        accept=".jpg,.jpeg,.png,.webp,.gif,.mp4,.webm,.mp3,.wav,.ogg,.pdf"
                        disabled={uploading}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleUpload(file);
                          }
                        }}
                      />
                    </label>
                  )}

                  {url && (
                    <p className="mt-2 truncate text-xs text-emerald-400/70">
                      Selected: {url}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm text-white/60">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe this media..."
                    rows={4}
                    className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm outline-none placeholder:text-white/25 focus:border-white/30"
                  />
                </div>

                <div className="flex justify-end gap-3 border-t border-white/10 pt-5">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={saving || uploading}
                    className="rounded-xl border border-white/10 px-5 py-3 text-sm text-white/60 transition hover:bg-white/5 hover:text-white"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving || uploading}
                    className="rounded-xl bg-white px-6 py-3 text-sm font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : editingId
                        ? "Update Media"
                        : "Add Media"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
