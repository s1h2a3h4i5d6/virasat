"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  FileAudio,
  MapPin,
  RefreshCw,
  XCircle,
  Trash2,
  BookOpen,
  Music,
  Tag,
  Loader2,
} from "lucide-react";

type CategoryOption = {
  id: string;
  name: string;
  slug: string;
};

type RecordItem = {
  id: string;
  title: string;
  speakerName?: string | null;
  originalLanguage: string;
  transcript?: string | null;
  translation?: string | null;
  audioUrl?: string | null;
  description?: string | null;
  type?: string;
  categoryId?: string | null;
  status: string;
  verified: boolean;
  createdAt: string;
  user?: {
    name?: string | null;
    email?: string | null;
  } | null;
  state?: {
    name: string;
  } | null;
  district?: {
    name: string;
  } | null;
  heritage?: {
    name: string;
    slug: string;
  } | null;
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
};

const filters = [
  "ALL",
  "PENDING",
  "APPROVED",
  "NEEDS_CHANGES",
  "REJECTED",
];

export default function AdminOralHistoryPage() {
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "STORY" | "SONG">("ALL");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function loadRecords() {
    setLoading(true);

    try {
      const url =
        filter === "ALL"
          ? "/api/admin/oral-history"
          : `/api/admin/oral-history?status=${filter}`;

      const response = await fetch(url, {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to load records");
      }

      setRecords(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Load records error:", error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRecords();
  }, [filter]);

  async function loadCategories() {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      const list = Array.isArray(data) ? data : data?.value || [];
      setCategories(list);
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  async function updateStatus(id: string, status: string) {
    setBusyId(id);

    try {
      const response = await fetch("/api/admin/oral-history", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          status,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.details ||
          data?.error ||
          `Server returned ${response.status}`
        );
      }

      await loadRecords();
    } catch (error) {
      console.error("Update record error:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to update verification status."
      );
    } finally {
      setBusyId(null);
    }
  }

  async function updateClassification(
    id: string,
    categoryId: string | null,
    type: string
  ) {
    setBusyId(id);

    try {
      const response = await fetch("/api/admin/oral-history", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          categoryId,
          type,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.details ||
          data?.error ||
          "Failed to update classification"
        );
      }

      await loadRecords();
    } catch (error) {
      console.error("Classification error:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to update category or type."
      );
    } finally {
      setBusyId(null);
    }
  }

  async function deleteRecord(id: string, title: string) {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete the oral history "${title}"?\nThis action cannot be undone.`
      )
    ) {
      return;
    }

    setBusyId(id);

    try {
      const response = await fetch(`/api/admin/oral-history?id=${id}`, {
        method: "DELETE",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Failed to delete oral history");
      }

      await loadRecords();
    } catch (error) {
      console.error("Delete error:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete oral history record."
      );
    } finally {
      setBusyId(null);
    }
  }

  function statusBadge(record: RecordItem) {
    if (record.status === "APPROVED" && record.verified) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
          <CheckCircle2 size={14} />
          Approved & Verified
        </span>
      );
    }

    if (record.status === "REJECTED") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
          <XCircle size={14} />
          Rejected
        </span>
      );
    }

    if (record.status === "NEEDS_CHANGES") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
          <RefreshCw size={14} />
          Needs Changes
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
        <Clock3 size={14} />
        Pending
      </span>
    );
  }

  function typeBadge(type?: string) {
    const isSong = (type || "").toUpperCase() === "SONG";
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
          isSong
            ? "bg-purple-100 text-purple-800 border border-purple-200"
            : "bg-blue-100 text-blue-800 border border-blue-200"
        }`}
      >
        {isSong ? <Music size={13} /> : <BookOpen size={13} />}
        {isSong ? "Song" : "Story"}
      </span>
    );
  }

  function actionButtons(record: RecordItem) {
    return (
      <div className="flex flex-col gap-3">
        {record.status === "APPROVED" && record.verified ? (
          <div className="rounded-2xl bg-emerald-50 p-4 text-center">
            <CheckCircle2
              className="mx-auto mb-2 text-emerald-600"
              size={28}
            />
            <p className="font-semibold text-emerald-800">
              Published & Verified
            </p>
            <p className="mt-1 text-xs text-emerald-600">
              Visible in the public archive.
            </p>
            <button
              disabled={busyId === record.id}
              onClick={() => updateStatus(record.id, "PENDING")}
              className="mt-3 w-full rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              Move to Pending
            </button>
          </div>
        ) : record.status === "REJECTED" ? (
          <div className="rounded-2xl bg-red-50 p-4 text-center">
            <XCircle
              className="mx-auto mb-2 text-red-600"
              size={28}
            />
            <p className="font-semibold text-red-800">
              Submission Rejected
            </p>
            <button
              disabled={busyId === record.id}
              onClick={() => updateStatus(record.id, "PENDING")}
              className="mt-3 w-full rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              Move to Pending
            </button>
          </div>
        ) : record.status === "NEEDS_CHANGES" ? (
          <div className="space-y-2">
            <div className="rounded-2xl bg-amber-50 p-4 text-center">
              <RefreshCw
                className="mx-auto mb-2 text-amber-600"
                size={28}
              />
              <p className="font-semibold text-amber-800">
                Changes Requested
              </p>
              <p className="mt-1 text-xs text-amber-600">
                Waiting for contributor changes.
              </p>
            </div>

            <button
              disabled={busyId === record.id}
              onClick={() => updateStatus(record.id, "APPROVED")}
              className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              Approve & Publish
            </button>

            <button
              disabled={busyId === record.id}
              onClick={() => updateStatus(record.id, "REJECTED")}
              className="w-full rounded-xl bg-red-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        ) : (
          <div className="grid gap-2">
            <button
              disabled={busyId === record.id}
              onClick={() => updateStatus(record.id, "APPROVED")}
              className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              Approve & Publish
            </button>

            <button
              disabled={busyId === record.id}
              onClick={() => updateStatus(record.id, "NEEDS_CHANGES")}
              className="rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-amber-600 disabled:opacity-50"
            >
              Request Changes
            </button>

            <button
              disabled={busyId === record.id}
              onClick={() => updateStatus(record.id, "REJECTED")}
              className="rounded-xl bg-red-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        )}

        <button
          disabled={busyId === record.id}
          onClick={() => deleteRecord(record.id, record.title)}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50/80 px-4 py-2.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 hover:text-red-800 disabled:opacity-50"
        >
          <Trash2 size={14} />
          <span>Delete Oral History</span>
        </button>
      </div>
    );
  }

  const filteredRecords = records.filter((r) => {
    if (typeFilter === "ALL") return true;
    const itemType = (r.type || "STORY").toUpperCase();
    return itemType === typeFilter;
  });

  return (
    <main className="min-h-screen bg-[#f7f5f0] px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
            Virasat Admin
          </p>

          <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
            Oral History Verification & Management
          </h1>

          <p className="mt-2 max-w-2xl text-slate-600">
            Review community-submitted voices, classify them into cultural categories
            and Story/Song types, or delete records from the Virasat archive.
          </p>
        </div>

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {filters.map((item) => (
              <button
                key={item}
                onClick={() => setFilter(item)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  filter === item
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 shadow-sm hover:bg-slate-100"
                }`}
              >
                {item === "ALL"
                  ? "All Statuses"
                  : item === "NEEDS_CHANGES"
                    ? "Needs Changes"
                    : item.charAt(0) + item.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 rounded-full bg-white p-1 shadow-sm ring-1 ring-slate-200">
            <button
              onClick={() => setTypeFilter("ALL")}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                typeFilter === "ALL"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setTypeFilter("STORY")}
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                typeFilter === "STORY"
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BookOpen size={12} />
              Stories
            </button>
            <button
              onClick={() => setTypeFilter("SONG")}
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                typeFilter === "SONG"
                  ? "bg-purple-600 text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Music size={12} />
              Songs
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center rounded-3xl bg-white p-16 shadow-sm">
            <Loader2 className="animate-spin text-slate-400" size={32} />
            <span className="ml-3 text-slate-500 font-medium">
              Loading oral history records...
            </span>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="rounded-3xl bg-white p-12 text-center shadow-sm">
            <FileAudio className="mx-auto mb-4 text-slate-400" size={42} />

            <h2 className="text-xl font-semibold text-slate-900">
              No records found
            </h2>

            <p className="mt-2 text-slate-500">
              There are no oral history submissions matching the selected filters.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredRecords.map((record) => (
              <article
                key={record.id}
                className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-3 flex flex-wrap items-center gap-2.5">
                      {statusBadge(record)}
                      {typeBadge(record.type)}

                      {record.category ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 border border-amber-200">
                          <Tag size={12} />
                          {record.category.name}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                          Uncategorized
                        </span>
                      )}

                      <span className="text-xs text-slate-400">
                        {new Date(record.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <h2 className="text-2xl font-semibold text-slate-900">
                      {record.title}
                    </h2>

                    {record.speakerName && (
                      <p className="mt-2 text-slate-600">
                        Speaker:{" "}
                        <span className="font-medium">
                          {record.speakerName}
                        </span>
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2 text-sm">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                        Language: {record.originalLanguage}
                      </span>

                      {(record.state || record.district) && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                          <MapPin size={14} />
                          {[
                            record.district?.name,
                            record.state?.name,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      )}

                      {record.heritage && (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                          Heritage: {record.heritage.name}
                        </span>
                      )}
                    </div>

                    {/* Classification & Taxonomy Selector Box */}
                    <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                        <Tag size={13} />
                        Classification & Taxonomy
                      </p>

                      <div className="grid gap-3 sm:grid-cols-2">
                        {/* Sub-Classification Type */}
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-600">
                            Sub-Classification (Type)
                          </label>
                          <select
                            disabled={busyId === record.id}
                            value={(record.type || "STORY").toUpperCase()}
                            onChange={(e) =>
                              updateClassification(
                                record.id,
                                record.categoryId ||
                                  record.category?.id ||
                                  null,
                                e.target.value
                              )
                            }
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-1 focus:ring-slate-500 disabled:opacity-50"
                          >
                            <option value="STORY">📖 Story</option>
                            <option value="SONG">🎵 Song</option>
                          </select>
                        </div>

                        {/* Cultural Category */}
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-600">
                            Cultural Category
                          </label>
                          <select
                            disabled={busyId === record.id}
                            value={
                              record.categoryId ||
                              record.category?.id ||
                              ""
                            }
                            onChange={(e) =>
                              updateClassification(
                                record.id,
                                e.target.value || null,
                                record.type || "STORY"
                              )
                            }
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-1 focus:ring-slate-500 disabled:opacity-50"
                          >
                            <option value="">-- Select Category --</option>
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {record.description && (
                      <div className="mt-5">
                        <h3 className="mb-2 font-semibold text-slate-900">
                          Description
                        </h3>

                        <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">
                          {record.description}
                        </p>
                      </div>
                    )}

                    {record.transcript && (
                      <div className="mt-5">
                        <h3 className="mb-2 font-semibold text-slate-900">
                          Transcript
                        </h3>

                        <div className="max-h-64 overflow-y-auto rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-700">
                          {record.transcript}
                        </div>
                      </div>
                    )}

                    {record.translation && (
                      <details className="mt-4">
                        <summary className="cursor-pointer font-semibold text-slate-900">
                          View translation
                        </summary>

                        <div className="mt-3 rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-700">
                          {record.translation}
                        </div>
                      </details>
                    )}

                    {record.audioUrl && (
                      <div className="mt-5">
                        <h3 className="mb-2 font-semibold text-slate-900">
                          Audio Recording
                        </h3>

                        <audio
                          controls
                          className="w-full max-w-xl"
                          src={record.audioUrl}
                        />
                      </div>
                    )}

                    {record.user && (
                      <p className="mt-5 text-xs text-slate-400">
                        Submitted by:{" "}
                        {record.user.name || "User"}{" "}
                        {record.user.email
                          ? `(${record.user.email})`
                          : ""}
                      </p>
                    )}
                  </div>

                  <div className="w-full lg:w-72">
                    {actionButtons(record)}
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
