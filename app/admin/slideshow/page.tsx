"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Edit3,
  Image as ImageIcon,
  Loader2,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";

type Slide = {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  buttonText: string | null;
  buttonUrl: string | null;
  active: boolean;
  sortOrder: number;
};

type SlideForm = {
  title: string;
  subtitle: string;
  imageUrl: string;
  buttonText: string;
  buttonUrl: string;
  active: boolean;
  sortOrder: number;
};

const emptyForm: SlideForm = {
  title: "",
  subtitle: "",
  imageUrl: "",
  buttonText: "",
  buttonUrl: "",
  active: true,
  sortOrder: 0,
};

export default function SlideshowAdminPage() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState<SlideForm>(emptyForm);
  const [previewUrl, setPreviewUrl] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function loadSlides() {
    try {
      setLoading(true);

      const response = await fetch("/api/admin/slideshow", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to load slides.");
      }

      setSlides(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to load slideshow records."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSlides();
  }, []);

  function openCreate() {
    setEditingId(null);

    const nextSortOrder =
      slides.length > 0
        ? Math.max(...slides.map((slide) => slide.sortOrder)) + 1
        : 0;

    const newForm = {
      ...emptyForm,
      sortOrder: nextSortOrder,
    };

    setForm(newForm);
    setPreviewUrl("");
    setShowForm(true);
  }

  function openEdit(slide: Slide) {
    setEditingId(slide.id);

    setForm({
      title: slide.title,
      subtitle: slide.subtitle || "",
      imageUrl: slide.imageUrl,
      buttonText: slide.buttonText || "",
      buttonUrl: slide.buttonUrl || "",
      active: slide.active,
      sortOrder: slide.sortOrder,
    });

    setPreviewUrl(slide.imageUrl);
    setShowForm(true);
  }

  function closeForm() {
    if (saving || uploading) return;

    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setPreviewUrl("");
  }

  function updateField<K extends keyof SlideForm>(
    field: K,
    value: SlideForm[K]
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type.toLowerCase())) {
      alert("Please upload a JPG, JPEG, PNG, or WEBP image.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/slideshow/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Image upload failed.");
      }

      setForm((current) => ({
        ...current,
        imageUrl: data.url,
      }));

      setPreviewUrl(data.url);
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to upload slideshow image."
      );
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  function handleUrlChange(value: string) {
    updateField("imageUrl", value);
    setPreviewUrl(value);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.title.trim()) {
      alert("Title is required.");
      return;
    }

    if (!form.imageUrl.trim()) {
      alert("Slideshow image is required.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        title: form.title.trim(),
        subtitle: form.subtitle.trim() || null,
        imageUrl: form.imageUrl.trim(),
        buttonText: form.buttonText.trim() || null,
        buttonUrl: form.buttonUrl.trim() || null,
        active: form.active,
        sortOrder: Number(form.sortOrder),
      };

      const response = await fetch("/api/admin/slideshow", {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          editingId
            ? {
                id: editingId,
                ...payload,
              }
            : payload
        ),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to save slide.");
      }

      await loadSlides();
      closeForm();
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to save slideshow slide."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteSlide(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this slide?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch("/api/admin/slideshow", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to delete slide.");
      }

      await loadSlides();
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete slideshow slide."
      );
    }
  }

  async function toggleActive(slide: Slide) {
    try {
      const response = await fetch("/api/admin/slideshow", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: slide.id,
          active: !slide.active,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to update slide.");
      }

      await loadSlides();
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to update slide status."
      );
    }
  }

  async function moveSlide(slide: Slide, direction: "up" | "down") {
    const sorted = [...slides].sort((a, b) => a.sortOrder - b.sortOrder);
    const currentIndex = sorted.findIndex((item) => item.id === slide.id);

    const targetIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    const target = sorted[targetIndex];

    try {
      const firstResponse = await fetch("/api/admin/slideshow", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: slide.id,
          sortOrder: target.sortOrder,
        }),
      });

      const firstData = await firstResponse.json();

      if (!firstResponse.ok) {
        throw new Error(firstData?.error || "Failed to reorder slide.");
      }

      const secondResponse = await fetch("/api/admin/slideshow", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: target.id,
          sortOrder: slide.sortOrder,
        }),
      });

      const secondData = await secondResponse.json();

      if (!secondResponse.ok) {
        throw new Error(secondData?.error || "Failed to reorder slide.");
      }

      await loadSlides();
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to reorder slideshow."
      );
    }
  }

  const sortedSlides = [...slides].sort(
    (a, b) => a.sortOrder - b.sortOrder
  );

  return (
    <main className="min-h-screen bg-white px-5 py-8 text-black md:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-5 border-b border-gray-200 pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.28em] text-gray-500">
              Homepage Experience
            </p>

            <h1 className="font-serif text-4xl font-bold text-black">
              Slideshow
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-gray-600">
              Manage the cinematic hero slideshow displayed on the Virasat
              homepage.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-gray-200 px-5 py-3 text-sm font-semibold text-black transition hover:bg-gray-300"
          >
            <Plus size={18} />
            Add Slide
          </button>
        </div>

        {showForm && (
          <section className="mb-8 rounded-2xl border border-gray-300 bg-gray-100 p-6 shadow-sm">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-serif text-2xl font-bold text-black">
                  {editingId ? "Edit Slide" : "Create Slide"}
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                  Upload an image directly from your computer or use an
                  existing image URL.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg p-2 text-gray-700 transition hover:bg-gray-200 hover:text-black"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-black">
                    Title
                  </label>

                  <input
                    value={form.title}
                    onChange={(event) =>
                      updateField("title", event.target.value)
                    }
                    placeholder="Discover Maharashtra"
                    className="w-full rounded-xl border border-gray-300 bg-gray-200 px-4 py-3 text-sm text-black outline-none placeholder:text-gray-500 focus:border-gray-500 focus:ring-2 focus:ring-gray-300"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-black">
                    Slideshow Image
                  </label>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-gray-200 px-4 py-3 text-sm font-semibold text-black transition hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {uploading ? (
                        <Loader2 size={17} className="animate-spin" />
                      ) : (
                        <Upload size={17} />
                      )}

                      {uploading ? "Uploading..." : "Upload Image"}
                    </button>

                    <span className="text-xs text-gray-600">
                      JPG, PNG, WEBP - Maximum 5 MB
                    </span>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-black">
                  Image URL
                </label>

                <input
                  value={form.imageUrl}
                  onChange={(event) =>
                    handleUrlChange(event.target.value)
                  }
                  placeholder="/uploads/slideshow/example.jpg"
                  className="w-full rounded-xl border border-gray-300 bg-gray-200 px-4 py-3 text-sm text-black outline-none placeholder:text-gray-500 focus:border-gray-500 focus:ring-2 focus:ring-gray-300"
                />
              </div>

              {previewUrl && (
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-medium text-black">
                      Preview
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        setPreviewUrl("");
                        updateField("imageUrl", "");
                      }}
                      className="text-xs font-medium text-gray-700 hover:text-black"
                    >
                      Remove image
                    </button>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-gray-300 bg-gray-200">
                    <img
                      src={previewUrl}
                      alt="Slideshow preview"
                      className="h-64 w-full object-cover"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-black">
                  Subtitle
                </label>

                <textarea
                  value={form.subtitle}
                  onChange={(event) =>
                    updateField("subtitle", event.target.value)
                  }
                  placeholder="Explore forts, traditions, stories and living heritage."
                  rows={3}
                  className="w-full resize-none rounded-xl border border-gray-300 bg-gray-200 px-4 py-3 text-sm text-black outline-none placeholder:text-gray-500 focus:border-gray-500 focus:ring-2 focus:ring-gray-300"
                />
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-black">
                    Button Text
                  </label>

                  <input
                    value={form.buttonText}
                    onChange={(event) =>
                      updateField("buttonText", event.target.value)
                    }
                    placeholder="Explore Heritage"
                    className="w-full rounded-xl border border-gray-300 bg-gray-200 px-4 py-3 text-sm text-black outline-none placeholder:text-gray-500 focus:border-gray-500 focus:ring-2 focus:ring-gray-300"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-black">
                    Button URL
                  </label>

                  <input
                    value={form.buttonUrl}
                    onChange={(event) =>
                      updateField("buttonUrl", event.target.value)
                    }
                    placeholder="/heritage/shivneri-fort"
                    className="w-full rounded-xl border border-gray-300 bg-gray-200 px-4 py-3 text-sm text-black outline-none placeholder:text-gray-500 focus:border-gray-500 focus:ring-2 focus:ring-gray-300"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-black">
                    Sort Order
                  </label>

                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(event) =>
                      updateField(
                        "sortOrder",
                        Number(event.target.value)
                      )
                    }
                    className="w-full rounded-xl border border-gray-300 bg-gray-200 px-4 py-3 text-sm text-black outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-300"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 text-sm font-medium text-black">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(event) =>
                    updateField("active", event.target.checked)
                  }
                  className="h-4 w-4 rounded border-gray-400"
                />

                Show this slide on the homepage
              </label>

              <div className="flex flex-col-reverse gap-3 border-t border-gray-300 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving || uploading}
                  className="rounded-xl border border-gray-300 bg-gray-200 px-5 py-3 text-sm font-semibold text-black transition hover:bg-gray-300 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-gray-300 px-5 py-3 text-sm font-semibold text-black transition hover:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving && (
                    <Loader2 size={17} className="animate-spin" />
                  )}

                  {editingId ? "Update Slide" : "Create Slide"}
                </button>
              </div>
            </form>
          </section>
        )}

        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-gray-300 bg-gray-100">
            <Loader2
              size={28}
              className="animate-spin text-gray-600"
            />
          </div>
        ) : sortedSlides.length === 0 ? (
          <div className="rounded-2xl border border-gray-300 bg-gray-100 px-6 py-16 text-center">
            <ImageIcon
              size={40}
              className="mx-auto mb-4 text-gray-500"
            />

            <h2 className="font-serif text-2xl font-bold text-black">
              No Slides Yet
            </h2>

            <p className="mt-2 text-sm text-gray-600">
              Add your first homepage slideshow image.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {sortedSlides.map((slide, index) => (
              <article
                key={slide.id}
                className="overflow-hidden rounded-2xl border border-gray-300 bg-gray-100 shadow-sm"
              >
                <div className="grid lg:grid-cols-[280px_1fr_auto]">
                  <div className="relative h-52 bg-gray-300 lg:h-full lg:min-h-[210px]">
                    {slide.imageUrl ? (
                      <img
                        src={slide.imageUrl}
                        alt={slide.title}
                        className="h-full w-full object-cover"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-600">
                        <ImageIcon size={36} />
                      </div>
                    )}

                    <div className="absolute left-4 top-4 rounded-lg border border-gray-300 bg-gray-100 px-3 py-1 text-xs font-bold text-black">
                      #{slide.sortOrder}
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-lg border px-3 py-1 text-xs font-bold ${
                          slide.active
                            ? "border-gray-400 bg-gray-200 text-black"
                            : "border-gray-300 bg-gray-300 text-gray-700"
                        }`}
                      >
                        {slide.active ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </div>

                    <h2 className="font-serif text-2xl font-bold text-black">
                      {slide.title}
                    </h2>

                    {slide.subtitle && (
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-700">
                        {slide.subtitle}
                      </p>
                    )}

                    {slide.buttonText && (
                      <p className="mt-4 text-sm text-gray-700">
                        Button:{" "}
                        <span className="font-semibold text-black">
                          {slide.buttonText}
                        </span>
                      </p>
                    )}

                    {slide.buttonUrl && (
                      <p className="mt-1 break-all text-xs text-gray-500">
                        {slide.buttonUrl}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-row items-center justify-start gap-2 border-t border-gray-300 bg-gray-200 p-4 lg:flex-col lg:border-l lg:border-t-0 lg:justify-center">
                    <button
                      type="button"
                      onClick={() => moveSlide(slide, "up")}
                      disabled={index === 0}
                      title="Move up"
                      className="rounded-lg border border-gray-300 bg-gray-100 p-2 text-black transition hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <ArrowUp size={18} />
                    </button>

                    <button
                      type="button"
                      onClick={() => moveSlide(slide, "down")}
                      disabled={index === sortedSlides.length - 1}
                      title="Move down"
                      className="rounded-lg border border-gray-300 bg-gray-100 p-2 text-black transition hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <ArrowDown size={18} />
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleActive(slide)}
                      title={slide.active ? "Deactivate" : "Activate"}
                      className="rounded-lg border border-gray-300 bg-gray-100 p-2 text-black transition hover:bg-gray-300"
                    >
                      <ImageIcon size={18} />
                    </button>

                    <button
                      type="button"
                      onClick={() => openEdit(slide)}
                      title="Edit"
                      className="rounded-lg border border-gray-300 bg-gray-100 p-2 text-black transition hover:bg-gray-300"
                    >
                      <Edit3 size={18} />
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteSlide(slide.id)}
                      title="Delete"
                      className="rounded-lg border border-gray-300 bg-gray-100 p-2 text-black transition hover:bg-gray-300"
                    >
                      <Trash2 size={18} />
                    </button>
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