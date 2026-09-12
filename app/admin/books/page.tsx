"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  ExternalLink,
  FileText,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";

type Book = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverUrl: string | null;
  createdAt: string;
  _count: {
    pages: number;
  };
};

export default function AdminBooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<"MANUAL" | "PDF">("PDF");

  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [coverUrl, setCoverUrl] = useState("");

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  async function loadBooks() {
    try {
      setLoading(true);

      const response = await fetch("/api/admin/books", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to load books."
        );
      }

      setBooks(
        Array.isArray(data)
          ? data
          : data.books || []
      );
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Unable to load books."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBooks();
  }, []);

  const filteredBooks = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return books;
    }

    return books.filter(
      (book) =>
        book.title
          .toLowerCase()
          .includes(query) ||
        book.slug
          .toLowerCase()
          .includes(query) ||
        book.description
          ?.toLowerCase()
          .includes(query)
    );
  }, [books, search]);

  function makeSlug(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function openAddModal() {
    setEditingId(null);
    setTitle("");
    setSlug("");
    setDescription("");
    setCoverUrl("");
    setPdfFile(null);
    setMode("PDF");
    setUploadProgress("");
    setModalOpen(true);
  }

  function openEditModal(book: Book) {
    setEditingId(book.id);
    setTitle(book.title);
    setSlug(book.slug);
    setDescription(book.description || "");
    setCoverUrl(book.coverUrl || "");
    setPdfFile(null);
    setMode("MANUAL");
    setUploadProgress("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
  }

  async function handleManualSubmit(
    event: React.FormEvent
  ) {
    event.preventDefault();

    if (!title.trim()) {
      alert("Please enter a book title.");
      return;
    }

    if (!slug.trim()) {
      alert("Please enter a book slug.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        title,
        slug,
        description,
        coverUrl,
      };

      const response = await fetch(
        editingId
          ? `/api/admin/books/${editingId}`
          : "/api/admin/books",
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
        throw new Error(
          data.error || "Unable to save book."
        );
      }

      setModalOpen(false);
      await loadBooks();
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Unable to save book."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handlePdfUpload(
    event: React.FormEvent
  ) {
    event.preventDefault();

    if (!title.trim()) {
      alert("Please enter a book title.");
      return;
    }

    if (!slug.trim()) {
      alert("Please enter a book slug.");
      return;
    }

    if (!pdfFile) {
      alert("Please select a PDF file.");
      return;
    }

    try {
      setSaving(true);
      setUploadProgress(
        "Uploading PDF..."
      );

      const formData = new FormData();

      formData.append("file", pdfFile);
      formData.append("title", title);
      formData.append("slug", slug);
      formData.append(
        "description",
        description
      );

      setUploadProgress(
        "Processing PDF and generating pages..."
      );

      const response = await fetch(
        "/api/admin/books/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to process PDF."
        );
      }

      setUploadProgress(
        `${data.book.pageCount} pages created successfully.`
      );

      await loadBooks();

      setTimeout(() => {
        setModalOpen(false);
        setUploadProgress("");
      }, 700);
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Unable to process PDF."
      );

      setUploadProgress("");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const book = books.find(
      (item) => item.id === id
    );

    if (!book) return;

    const message =
      book._count.pages > 0
        ? `This book has ${book._count.pages} pages. Deleting it will also delete its database pages. Continue?`
        : "Delete this book?";

    if (!confirm(message)) {
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/books/${id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to delete book."
        );
      }

      await loadBooks();
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Unable to delete book."
      );
    }
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
              Digital Library
            </h1>

            <p className="mt-2 text-sm text-white/45">
              Create, upload and manage heritage books.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-white/90"
          >
            <Plus size={18} />
            Add Book
          </button>
        </div>

        <div className="mb-6 flex items-center rounded-xl border border-white/10 bg-white/[0.03] px-4">
          <Search
            size={18}
            className="mr-3 shrink-0 text-white/35"
          />

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search books..."
            className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-white/30"
          />
        </div>

        <div className="mb-4 text-sm text-white/40">
          Showing {filteredBooks.length} of{" "}
          {books.length} books
        </div>

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-12 text-center text-white/40">
            Loading books...
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-12 text-center">
            <BookOpen
              size={42}
              className="mx-auto mb-4 text-white/20"
            />

            <p className="text-white/50">
              No books found.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredBooks.map((book) => (
              <div
                key={book.id}
                className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition hover:border-white/20"
              >
                <div className="aspect-[16/9] overflow-hidden bg-white/[0.04]">
                  {book.coverUrl ? (
                    <img
                      src={book.coverUrl}
                      alt={book.title}
                      className="h-full w-full object-cover transition duration-500 hover:scale-105"
                      onError={(event) => {
                        event.currentTarget.style.display =
                          "none";
                      }}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <BookOpen
                        size={50}
                        className="text-white/15"
                      />
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <h2 className="line-clamp-2 text-lg font-semibold">
                      {book.title}
                    </h2>

                    <span className="shrink-0 rounded-full border border-white/10 px-2.5 py-1 text-[10px] uppercase tracking-wider text-white/40">
                      {book._count.pages}{" "}
                      {book._count.pages === 1
                        ? "Page"
                        : "Pages"}
                    </span>
                  </div>

                  {book.description && (
                    <p className="mb-4 line-clamp-3 text-sm leading-6 text-white/40">
                      {book.description}
                    </p>
                  )}

                  <p className="mb-4 truncate text-xs text-white/20">
                    /books/{book.slug}
                  </p>

                  <div className="flex gap-2">
                    <a
                      href={`/books/${book.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2.5 text-sm text-white/55 transition hover:bg-white/10 hover:text-white"
                    >
                      <ExternalLink size={15} />
                      Open
                    </a>

                    <button
                      onClick={() =>
                        openEditModal(book)
                      }
                      className="rounded-lg border border-white/10 p-2.5 text-white/50 transition hover:bg-white/10 hover:text-white"
                      title="Edit book"
                    >
                      <Pencil size={17} />
                    </button>

                    <button
                      onClick={() =>
                        handleDelete(book.id)
                      }
                      className="rounded-lg border border-red-500/20 p-2.5 text-red-400/70 transition hover:bg-red-500/10 hover:text-red-400"
                      title="Delete book"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {modalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#111] shadow-2xl">

              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#111] px-6 py-5">
                <div>
                  <h2 className="text-xl font-semibold">
                    {editingId
                      ? "Edit Book"
                      : "Add Book"}
                  </h2>

                  <p className="mt-1 text-xs text-white/35">
                    Upload a PDF or create a book manually.
                  </p>
                </div>

                <button
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-lg p-2 text-white/40 transition hover:bg-white/10 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              {!editingId && (
                <div className="flex border-b border-white/10 p-3">
                  <button
                    type="button"
                    onClick={() => setMode("PDF")}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm transition ${
                      mode === "PDF"
                        ? "bg-white text-black"
                        : "text-white/45 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <FileText size={17} />
                    Upload PDF
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode("MANUAL")}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm transition ${
                      mode === "MANUAL"
                        ? "bg-white text-black"
                        : "text-white/45 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <BookOpen size={17} />
                    Manual Book
                  </button>
                </div>
              )}

              <form
                onSubmit={
                  mode === "PDF" && !editingId
                    ? handlePdfUpload
                    : handleManualSubmit
                }
                className="space-y-5 p-6"
              >

                <div>
                  <label className="mb-2 block text-sm text-white/60">
                    Book Title
                  </label>

                  <input
                    value={title}
                    onChange={(event) => {
                      const value =
                        event.target.value;

                      setTitle(value);

                      if (!editingId) {
                        setSlug(
                          makeSlug(value)
                        );
                      }
                    }}
                    placeholder="Example: Living Heritage of Maharashtra"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm outline-none placeholder:text-white/25 focus:border-white/30"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-white/60">
                    Slug
                  </label>

                  <input
                    value={slug}
                    onChange={(event) =>
                      setSlug(
                        makeSlug(
                          event.target.value
                        )
                      )
                    }
                    placeholder="living-heritage-of-maharashtra"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm outline-none placeholder:text-white/25 focus:border-white/30"
                  />

                  <p className="mt-2 text-xs text-white/25">
                    Public URL: /books/
                    {slug || "your-book"}
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-white/60">
                    Description
                  </label>

                  <textarea
                    value={description}
                    onChange={(event) =>
                      setDescription(
                        event.target.value
                      )
                    }
                    rows={4}
                    placeholder="Describe this heritage book..."
                    className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm outline-none placeholder:text-white/25 focus:border-white/30"
                  />
                </div>

                {mode === "PDF" &&
                  !editingId && (
                    <div>
                      <label className="mb-2 block text-sm text-white/60">
                        PDF Book
                      </label>

                      <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-12 text-center transition hover:border-white/30 hover:bg-white/[0.04]">
                        {pdfFile ? (
                          <>
                            <FileText
                              size={38}
                              className="mb-3 text-white/50"
                            />

                            <span className="max-w-full truncate text-sm text-white/70">
                              {pdfFile.name}
                            </span>

                            <span className="mt-2 text-xs text-white/30">
                              {(
                                pdfFile.size /
                                (1024 * 1024)
                              ).toFixed(2)}{" "}
                              MB
                            </span>
                          </>
                        ) : (
                          <>
                            <Upload
                              size={38}
                              className="mb-3 text-white/30"
                            />

                            <span className="text-sm text-white/60">
                              Click to choose PDF
                            </span>

                            <span className="mt-2 text-xs text-white/30">
                              Maximum size: 100 MB
                            </span>
                          </>
                        )}

                        <input
                          type="file"
                          accept="application/pdf,.pdf"
                          className="hidden"
                          disabled={saving}
                          onChange={(event) => {
                            const file =
                              event.target
                                .files?.[0];

                            if (!file) return;

                            if (
                              file.type !==
                              "application/pdf"
                            ) {
                              alert(
                                "Please select a PDF file."
                              );
                              return;
                            }

                            if (
                              file.size >
                              100 *
                                1024 *
                                1024
                            ) {
                              alert(
                                "PDF must be 100 MB or less."
                              );
                              return;
                            }

                            setPdfFile(file);
                          }}
                        />
                      </label>

                      <p className="mt-3 text-xs leading-5 text-white/30">
                        Virasat will automatically convert
                        every PDF page into a high-quality
                        image and create the corresponding
                        Book Page records.
                      </p>
                    </div>
                  )}

                {mode === "MANUAL" && (
                  <div>
                    <label className="mb-2 block text-sm text-white/60">
                      Cover Image URL
                    </label>

                    <input
                      value={coverUrl}
                      onChange={(event) =>
                        setCoverUrl(
                          event.target.value
                        )
                      }
                      placeholder="https://example.com/cover.jpg"
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm outline-none placeholder:text-white/25 focus:border-white/30"
                    />

                    {coverUrl && (
                      <div className="mt-3 overflow-hidden rounded-xl border border-white/10">
                        <img
                          src={coverUrl}
                          alt="Cover preview"
                          className="h-40 w-full object-cover"
                          onError={(event) => {
                            event.currentTarget.style.display =
                              "none";
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {uploadProgress && (
                  <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-4 text-sm text-white/60">
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />
                    {uploadProgress}
                  </div>
                )}

                <div className="flex justify-end gap-3 border-t border-white/10 pt-5">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={saving}
                    className="rounded-xl border border-white/10 px-5 py-3 text-sm text-white/60 transition hover:bg-white/5 hover:text-white"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={
                      saving ||
                      (mode === "PDF" &&
                        !editingId &&
                        !pdfFile)
                    }
                    className="flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving && (
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                    )}

                    {saving
                      ? "Processing..."
                      : editingId
                        ? "Update Book"
                        : mode === "PDF"
                          ? "Upload & Create Book"
                          : "Create Book"}
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
