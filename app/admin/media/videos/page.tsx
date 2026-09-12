"use client";

import { useEffect, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Plus,
  RotateCcw,
  RotateCw,
  Trash2,
  Upload,
  X,
} from "lucide-react";

type HomepageVideo = {
  id: string;
  title: string;
  description: string | null;
  url: string;
  thumbnail: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "NEEDS_CHANGES";
  published: boolean;
  sortOrder: number;
  rotation: number;
  createdAt: string;
};

const emptyForm = {
  title: "",
  description: "",
  url: "",
  thumbnail: "",
  sortOrder: 0,
  rotation: 0,
};

export default function AdminHomepageVideosPage() {
  const [videos, setVideos] = useState<HomepageVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  async function loadVideos() {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/media/videos");

      if (!response.ok) {
        throw new Error("Failed to load homepage videos.");
      }

      setVideos(await response.json());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load homepage videos."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVideos();
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  }

  function editVideo(video: HomepageVideo) {
    setEditingId(video.id);
    setForm({
      title: video.title,
      description: video.description || "",
      url: video.url,
      thumbnail: video.thumbnail || "",
      sortOrder: video.sortOrder,
      rotation: video.rotation ?? 0,
    });
    setShowForm(true);
    setMessage("");
    setError("");
  }

  async function uploadVideo(file: File) {
    try {
      setUploading(true);
      setError("");

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/media/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Video upload failed.");
      }

      setForm((current) => ({
        ...current,
        url: data.url,
      }));

      setMessage("Video uploaded successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Video upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function saveVideo(event: React.FormEvent) {
    event.preventDefault();

    if (!form.title.trim() || !form.url.trim()) {
      setError("Title and video URL are required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        url: form.url.trim(),
        thumbnail: form.thumbnail.trim() || null,
        sortOrder: Number(form.sortOrder) || 0,
        rotation: Number(form.rotation) || 0,
      };

      const response = await fetch(
        editingId
          ? `/api/admin/media/videos/${editingId}`
          : "/api/admin/media/videos",
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
        let errorMsg = data.error || "Failed to save video.";
        if (data.details?.fieldErrors) {
          const fieldMsgs = Object.values(data.details.fieldErrors)
            .flat()
            .filter(Boolean);
          if (fieldMsgs.length > 0) {
            errorMsg = `${errorMsg} (${fieldMsgs.join(", ")})`;
          }
        }
        throw new Error(errorMsg);
      }

      setMessage(
        editingId
          ? "Homepage video updated."
          : "Homepage video added in Pending status."
      );

      resetForm();
      await loadVideos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save video.");
    } finally {
      setSaving(false);
    }
  }

  async function updateVideo(id: string, changes: Partial<HomepageVideo>) {
    try {
      setError("");
      setMessage("");

      const response = await fetch(`/api/admin/media/videos/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(changes),
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMsg = data.error || "Failed to update video.";
        if (data.details?.fieldErrors) {
          const fieldMsgs = Object.values(data.details.fieldErrors)
            .flat()
            .filter(Boolean);
          if (fieldMsgs.length > 0) {
            errorMsg = `${errorMsg} (${fieldMsgs.join(", ")})`;
          }
        }
        throw new Error(errorMsg);
      }

      setMessage("Video status updated.");
      await loadVideos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update video.");
    }
  }

  async function deleteVideo(id: string) {
    if (
      !window.confirm(
        "Delete this homepage video? This removes only its HomepageVideo record."
      )
    ) {
      return;
    }

    try {
      setError("");

      const response = await fetch(`/api/admin/media/videos/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete video.");
      }

      setMessage("Homepage video deleted.");
      await loadVideos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete video.");
    }
  }

  function statusClass(status: string) {
    if (status === "APPROVED") {
      return "border-green-400/20 bg-green-400/10 text-green-300";
    }

    if (status === "REJECTED") {
      return "border-red-400/20 bg-red-400/10 text-red-300";
    }

    if (status === "NEEDS_CHANGES") {
      return "border-yellow-400/20 bg-yellow-400/10 text-yellow-300";
    }

    return "border-white/10 bg-white/5 text-white/50";
  }

  return (
    <main className="min-h-screen bg-[#071014] px-6 py-10 text-white md:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-3 text-xs uppercase tracking-[0.35em] text-white/35">
              Admin / Media
            </p>

            <h1 className="font-serif text-4xl md:text-5xl">
              Homepage Videos
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">
              Manage videos displayed between Discover India and Featured Archive.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              resetForm();
              setShowForm(true);
              setMessage("");
              setError("");
            }}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-black"
          >
            <Plus size={17} />
            Add Video
          </button>
        </div>

        {message && (
          <div className="mb-5 rounded-2xl border border-green-400/20 bg-green-400/10 px-5 py-4 text-sm text-green-300">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {showForm && (
          <form
            onSubmit={saveVideo}
            className="mb-8 rounded-3xl border border-white/10 bg-white/[0.035] p-6 md:p-8"
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/35">
                  {editingId ? "Edit video" : "New video"}
                </p>

                <h2 className="mt-2 font-serif text-2xl">
                  {editingId ? "Update homepage video" : "Add homepage video"}
                </h2>
              </div>

              <button
                type="button"
                onClick={resetForm}
                className="rounded-full border border-white/10 p-2 text-white/50 hover:bg-white/10 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="md:col-span-2">
                <span className="mb-2 block text-sm text-white/60">
                  Title
                </span>

                <input
                  value={form.title}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      title: e.target.value,
                    })
                  }
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-white/30"
                  placeholder="Living Traditions of Maharashtra"
                  maxLength={200}
                  required
                />
              </label>

              <label className="md:col-span-2">
                <span className="mb-2 block text-sm text-white/60">
                  Description
                </span>

                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      description: e.target.value,
                    })
                  }
                  className="min-h-28 w-full resize-y rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-white/30"
                  placeholder="Short description shown over the video."
                  maxLength={1000}
                />
              </label>

              <div className="md:col-span-2">
                <span className="mb-2 block text-sm text-white/60">
                  Video
                </span>

                <div className="flex flex-col gap-3 md:flex-row">
                  <input
                    value={form.url}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        url: e.target.value,
                      })
                    }
                    className="flex-1 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-white/30"
                    placeholder="/uploads/media/video.mp4 or https://..."
                    required
                  />

                  <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm hover:bg-white/10">
                    <Upload size={17} />
                    {uploading ? "Uploading..." : "Upload video"}

                    <input
                      type="file"
                      accept="video/mp4,video/webm"
                      className="hidden"
                      disabled={uploading}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          uploadVideo(file);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <label>
                <span className="mb-2 block text-sm text-white/60">
                  Thumbnail / Poster URL
                </span>

                <input
                  value={form.thumbnail}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      thumbnail: e.target.value,
                    })
                  }
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-white/30"
                  placeholder="/uploads/media/poster.jpg"
                />
              </label>

              <label>
                <span className="mb-2 block text-sm text-white/60">
                  Display order
                </span>

                <input
                  type="number"
                  min="0"
                  value={form.sortOrder}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      sortOrder: Number(e.target.value),
                    })
                  }
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-white/30"
                />
              </label>

              <div className="md:col-span-2">
                <span className="mb-2 block text-sm text-white/60">
                  Video rotation
                </span>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        rotation: (current.rotation + 270) % 360,
                      }))
                    }
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm hover:bg-white/10"
                  >
                    <RotateCcw size={17} />
                    90° Anticlockwise
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        rotation: (current.rotation + 90) % 360,
                      }))
                    }
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm hover:bg-white/10"
                  >
                    <RotateCw size={17} />
                    90° Clockwise
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        rotation: 0,
                      }))
                    }
                    className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm hover:bg-white/10"
                  >
                    Reset
                  </button>

                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/50">
                    {form.rotation}°
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving || uploading}
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-black disabled:opacity-50"
              >
                <Check size={17} />
                {saving
                  ? "Saving..."
                  : editingId
                  ? "Save changes"
                  : "Add video"}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="rounded-full border border-white/10 px-5 py-3 text-sm text-white/60 hover:bg-white/5 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <p className="text-xs uppercase tracking-widest text-white/35">
              Total
            </p>
            <p className="mt-2 text-3xl font-semibold">
              {videos.length}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <p className="text-xs uppercase tracking-widest text-white/35">
              Approved
            </p>
            <p className="mt-2 text-3xl font-semibold">
              {videos.filter((v) => v.status === "APPROVED").length}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <p className="text-xs uppercase tracking-widest text-white/35">
              Published
            </p>
            <p className="mt-2 text-3xl font-semibold">
              {videos.filter((v) => v.published).length}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-10 text-center text-white/40">
            Loading homepage videos...
          </div>
        ) : videos.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center">
            <h2 className="font-serif text-2xl">
              No homepage videos yet
            </h2>

            <p className="mt-3 text-sm text-white/40">
              Add a video to begin building the homepage showcase.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {videos.map((video, index) => (
              <article
                key={video.id}
                className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035]"
              >
                <div className="grid md:grid-cols-[320px_1fr]">
                  <div className="aspect-video bg-black flex items-center justify-center overflow-hidden">
                    <video
                      src={video.url}
                      poster={video.thumbnail || undefined}
                      controls
                      preload="metadata"
                      className="h-full w-full object-contain"
                      style={{
                        transform: `rotate(${video.rotation ?? 0}deg)`,
                      }}
                    />
                  </div>

                  <div className="p-6 md:p-7">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="mb-3 flex flex-wrap gap-2">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs ${statusClass(
                              video.status
                            )}`}
                          >
                            {video.status.replace("_", " ")}
                          </span>

                          {video.published && (
                            <span className="rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1 text-xs text-blue-300">
                              Published
                            </span>
                          )}
                        </div>

                        <h2 className="font-serif text-2xl">
                          {video.title}
                        </h2>

                        {video.description && (
                          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
                            {video.description}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => {
                            if (index === 0) return;
                            const previous = videos[index - 1];
                            updateVideo(video.id, {
                              sortOrder: previous.sortOrder,
                            });
                            updateVideo(previous.id, {
                              sortOrder: video.sortOrder,
                            });
                          }}
                          className="rounded-full border border-white/10 p-2 text-white/45 hover:bg-white/10 hover:text-white disabled:opacity-20"
                        >
                          <ChevronUp size={17} />
                        </button>

                        <button
                          type="button"
                          disabled={index === videos.length - 1}
                          onClick={() => {
                            if (index === videos.length - 1) return;
                            const next = videos[index + 1];
                            updateVideo(video.id, {
                              sortOrder: next.sortOrder,
                            });
                            updateVideo(next.id, {
                              sortOrder: video.sortOrder,
                            });
                          }}
                          className="rounded-full border border-white/10 p-2 text-white/45 hover:bg-white/10 hover:text-white disabled:opacity-20"
                        >
                          <ChevronDown size={17} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-2">
                      {video.status !== "APPROVED" && (
                        <button
                          type="button"
                          onClick={() =>
                            updateVideo(video.id, {
                              status: "APPROVED",
                              published: true,
                            })
                          }
                          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-medium text-black"
                        >
                          <Check size={14} />
                          Approve & Publish
                        </button>
                      )}

                      {video.status === "APPROVED" && !video.published && (
                        <button
                          type="button"
                          onClick={() =>
                            updateVideo(video.id, {
                              published: true,
                            })
                          }
                          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-medium text-black"
                        >
                          <Eye size={14} />
                          Publish
                        </button>
                      )}

                      {video.published && (
                        <button
                          type="button"
                          onClick={() =>
                            updateVideo(video.id, {
                              published: false,
                            })
                          }
                          className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs text-white/60 hover:bg-white/10 hover:text-white"
                        >
                          <EyeOff size={14} />
                          Unpublish
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          updateVideo(video.id, {
                            status: "REJECTED",
                            published: false,
                          })
                        }
                        className="rounded-full border border-red-400/20 px-4 py-2 text-xs text-red-300 hover:bg-red-400/10"
                      >
                        Reject
                      </button>

                      <button
                        type="button"
                        onClick={() => editVideo(video)}
                        className="rounded-full border border-white/10 px-4 py-2 text-xs text-white/60 hover:bg-white/10 hover:text-white"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteVideo(video.id)}
                        className="inline-flex items-center gap-2 rounded-full border border-red-400/20 px-4 py-2 text-xs text-red-300 hover:bg-red-400/10"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}