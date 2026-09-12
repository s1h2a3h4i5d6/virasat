"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ClipboardCheck,
  Clock3,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  Trash2,
  RefreshCw,
  Loader2,
  MessageSquareQuote,
  Landmark,
  User,
  ChevronDown,
  ChevronUp,
  X,
  Send,
  ExternalLink,
} from "lucide-react";

type ContributionItem = {
  id: string;
  title: string;
  content: string;
  status: "PENDING" | "APPROVED" | "NEEDS_CHANGES" | "REJECTED";
  reviewNote: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
  heritage?: {
    id: string;
    name: string;
    slug: string;
    category?: {
      id: string;
      name: string;
      slug: string;
    } | null;
  } | null;
};

type Counts = {
  ALL: number;
  PENDING: number;
  APPROVED: number;
  NEEDS_CHANGES: number;
  REJECTED: number;
};

const statusFilters = [
  { key: "ALL", label: "All Contributions" },
  { key: "PENDING", label: "Pending Review" },
  { key: "APPROVED", label: "Approved" },
  { key: "NEEDS_CHANGES", label: "Needs Changes" },
  { key: "REJECTED", label: "Rejected" },
];

export default function AdminContributionsPage() {
  const [contributions, setContributions] = useState<ContributionItem[]>([]);
  const [counts, setCounts] = useState<Counts>({
    ALL: 0,
    PENDING: 0,
    APPROVED: 0,
    NEEDS_CHANGES: 0,
    REJECTED: 0,
  });
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Expanded cards tracker
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  // Review note modal state
  const [modalItem, setModalItem] = useState<{
    id: string;
    targetStatus: "NEEDS_CHANGES" | "REJECTED" | "APPROVED";
    currentNote: string;
  } | null>(null);
  const [noteText, setNoteText] = useState("");

  async function loadContributions() {
    setLoading(true);
    try {
      const url =
        statusFilter === "ALL"
          ? `/api/admin/contributions${search ? `?search=${encodeURIComponent(search)}` : ""}`
          : `/api/admin/contributions?status=${statusFilter}${search ? `&search=${encodeURIComponent(search)}` : ""}`;

      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load contributions.");
      }

      setContributions(Array.isArray(data.contributions) ? data.contributions : []);
      if (data.counts) {
        setCounts(data.counts);
      }
    } catch (error) {
      console.error("Load contributions error:", error);
      alert(error instanceof Error ? error.message : "Failed to load contributions.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadContributions();
  }, [statusFilter]);

  // Client-side search filtering fallback for instant responsiveness
  const filteredContributions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return contributions;

    return contributions.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.content.toLowerCase().includes(q) ||
        (c.user?.name && c.user.name.toLowerCase().includes(q)) ||
        (c.user?.email && c.user.email.toLowerCase().includes(q)) ||
        (c.heritage?.name && c.heritage.name.toLowerCase().includes(q))
    );
  }, [contributions, search]);

  async function updateStatus(
    id: string,
    status: "PENDING" | "APPROVED" | "NEEDS_CHANGES" | "REJECTED",
    reviewNote?: string
  ) {
    setActionLoadingId(id);
    try {
      const res = await fetch("/api/admin/contributions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, reviewNote }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update status.");
      }

      // Update local state smoothly
      setContributions((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, status, reviewNote: reviewNote !== undefined ? reviewNote : c.reviewNote }
            : c
        )
      );

      // Refresh counts
      loadContributions();
    } catch (error) {
      console.error("Update status error:", error);
      alert(error instanceof Error ? error.message : "Failed to update contribution status.");
    } finally {
      setActionLoadingId(null);
      setModalItem(null);
    }
  }

  async function deleteContribution(id: string, title: string) {
    const confirmed = window.confirm(
      `Are you sure you want to delete the contribution "${title}"? This cannot be undone.`
    );
    if (!confirmed) return;

    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/admin/contributions?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete contribution.");
      }

      setContributions((prev) => prev.filter((c) => c.id !== id));
      loadContributions();
    } catch (error) {
      console.error("Delete contribution error:", error);
      alert(error instanceof Error ? error.message : "Failed to delete contribution.");
    } finally {
      setActionLoadingId(null);
    }
  }

  function toggleExpand(id: string) {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function openNoteModal(
    id: string,
    targetStatus: "NEEDS_CHANGES" | "REJECTED" | "APPROVED",
    currentNote: string | null
  ) {
    setModalItem({ id, targetStatus, currentNote: currentNote || "" });
    setNoteText(currentNote || "");
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-white/40">
            Community Moderation
          </div>
          <h1 className="mt-1 font-serif text-3xl font-semibold sm:text-4xl">
            Community Contributions
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">
            Review, verify, and moderate living traditions, historical knowledge, and
            cultural narratives contributed by users across India.
          </p>
        </div>

        <button
          onClick={loadContributions}
          disabled={loading}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-medium text-white/80 transition hover:bg-white/10"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center justify-between text-white/40">
            <span className="text-xs uppercase tracking-wider">Total</span>
            <ClipboardCheck size={18} />
          </div>
          <div className="mt-3 text-3xl font-semibold">{counts.ALL}</div>
          <div className="mt-1 text-xs text-white/40">All submissions</div>
        </div>

        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-5">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-xs uppercase tracking-wider">Pending</span>
            <Clock3 size={18} />
          </div>
          <div className="mt-3 text-3xl font-semibold text-amber-300">
            {counts.PENDING}
          </div>
          <div className="mt-1 text-xs text-amber-200/50">Awaiting verification</div>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-5">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-xs uppercase tracking-wider">Approved</span>
            <CheckCircle2 size={18} />
          </div>
          <div className="mt-3 text-3xl font-semibold text-emerald-300">
            {counts.APPROVED}
          </div>
          <div className="mt-1 text-xs text-emerald-200/50">Published & verified</div>
        </div>

        <div className="rounded-2xl border border-orange-500/20 bg-orange-500/[0.04] p-5">
          <div className="flex items-center justify-between text-orange-400">
            <span className="text-xs uppercase tracking-wider">Needs Changes</span>
            <AlertTriangle size={18} />
          </div>
          <div className="mt-3 text-3xl font-semibold text-orange-300">
            {counts.NEEDS_CHANGES}
          </div>
          <div className="mt-1 text-xs text-orange-200/50">Feedback sent</div>
        </div>

        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.04] p-5">
          <div className="flex items-center justify-between text-rose-400">
            <span className="text-xs uppercase tracking-wider">Rejected</span>
            <XCircle size={18} />
          </div>
          <div className="mt-3 text-3xl font-semibold text-rose-300">
            {counts.REJECTED}
          </div>
          <div className="mt-1 text-xs text-rose-200/50">Declined submissions</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Status Pills */}
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((tab) => {
            const active = statusFilter === tab.key;
            const count = counts[tab.key as keyof Counts] ?? 0;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-medium transition ${
                  active
                    ? "bg-white text-black"
                    : "border border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/[0.08] hover:text-white"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                    active ? "bg-black/15 text-black" : "bg-white/10 text-white/70"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative min-w-[280px]">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40"
          />
          <input
            type="text"
            placeholder="Search title, content, author, heritage..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadContributions()}
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 pl-9 pr-4 text-xs text-white placeholder-white/40 focus:border-white/30 focus:outline-none"
          />
        </div>
      </div>

      {/* Contributions List */}
      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center rounded-3xl border border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3 text-white/50">
            <Loader2 size={20} className="animate-spin" />
            <span>Loading contributions...</span>
          </div>
        </div>
      ) : filteredContributions.length === 0 ? (
        <div className="flex min-h-[260px] flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/[0.02] p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-white/40">
            <ClipboardCheck size={24} />
          </div>
          <h3 className="mt-4 font-medium text-white">No contributions found</h3>
          <p className="mt-1 max-w-sm text-xs text-white/40">
            {search
              ? "No contributions matched your search criteria."
              : "No contributions currently in this status queue."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredContributions.map((item) => {
            const isExpanded = !!expandedIds[item.id];
            const isBusy = actionLoadingId === item.id;

            return (
              <div
                key={item.id}
                className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-white/20"
              >
                {/* Card Header */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {/* Submitter */}
                      <span className="inline-flex items-center gap-1.5 font-medium text-white/80">
                        <User size={13} className="text-white/40" />
                        {item.user?.name || "Community Member"}
                      </span>
                      <span className="text-white/30">·</span>
                      <span className="text-white/50">{item.user?.email}</span>
                      <span className="text-white/30">·</span>
                      <span className="text-white/40">
                        {new Date(item.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    <h2 className="font-serif text-xl font-medium text-white">
                      {item.title}
                    </h2>
                  </div>

                  {/* Status & Linked Heritage Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    {item.heritage ? (
                      <Link
                        href={`/heritage/${item.heritage.slug}`}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-[11px] font-medium text-sky-300 transition hover:bg-sky-400/20"
                      >
                        <Landmark size={12} />
                        {item.heritage.name}
                        <ExternalLink size={10} className="opacity-60" />
                      </Link>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] text-white/60">
                        General Living Heritage
                      </span>
                    )}

                    {item.status === "PENDING" && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[11px] font-semibold text-amber-300">
                        <Clock3 size={12} />
                        Pending Review
                      </span>
                    )}

                    {item.status === "APPROVED" && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold text-emerald-300">
                        <CheckCircle2 size={12} />
                        Approved & Verified
                      </span>
                    )}

                    {item.status === "NEEDS_CHANGES" && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-400/30 bg-orange-400/10 px-3 py-1 text-[11px] font-semibold text-orange-300">
                        <AlertTriangle size={12} />
                        Changes Requested
                      </span>
                    )}

                    {item.status === "REJECTED" && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-400/30 bg-rose-400/10 px-3 py-1 text-[11px] font-semibold text-rose-300">
                        <XCircle size={12} />
                        Rejected
                      </span>
                    )}
                  </div>
                </div>

                {/* Content Body */}
                <div className="mt-4 rounded-xl border border-white/5 bg-black/30 p-4">
                  <p
                    className={`whitespace-pre-line text-sm leading-relaxed text-white/80 ${
                      !isExpanded && item.content.length > 300 ? "line-clamp-4" : ""
                    }`}
                  >
                    {item.content}
                  </p>

                  {item.content.length > 300 && (
                    <button
                      type="button"
                      onClick={() => toggleExpand(item.id)}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-amber-300/80 transition hover:text-amber-300"
                    >
                      {isExpanded ? (
                        <>
                          Show less <ChevronUp size={14} />
                        </>
                      ) : (
                        <>
                          Read full contribution ({item.content.length} characters){" "}
                          <ChevronDown size={14} />
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Admin Review Note display */}
                {item.reviewNote && (
                  <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-amber-400/20 bg-amber-400/[0.04] p-3 text-xs text-amber-200/90">
                    <MessageSquareQuote size={16} className="mt-0.5 shrink-0 text-amber-400" />
                    <div>
                      <span className="font-semibold text-amber-300">Admin Review Note: </span>
                      {item.reviewNote}
                    </div>
                  </div>
                )}

                {/* Moderation Actions Bar */}
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Approve Button */}
                    <button
                      type="button"
                      disabled={isBusy || item.status === "APPROVED"}
                      onClick={() => updateStatus(item.id, "APPROVED")}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                        item.status === "APPROVED"
                          ? "cursor-default border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 opacity-60"
                          : "border border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/30"
                      }`}
                    >
                      <CheckCircle2 size={13} />
                      {item.status === "APPROVED" ? "Approved" : "Approve"}
                    </button>

                    {/* Request Changes Button */}
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() =>
                        openNoteModal(item.id, "NEEDS_CHANGES", item.reviewNote)
                      }
                      className="inline-flex items-center gap-1.5 rounded-xl border border-orange-500/40 bg-orange-500/15 px-3.5 py-1.5 text-xs font-semibold text-orange-300 transition hover:bg-orange-500/30"
                    >
                      <AlertTriangle size={13} />
                      Request Changes
                    </button>

                    {/* Reject Button */}
                    <button
                      type="button"
                      disabled={isBusy || item.status === "REJECTED"}
                      onClick={() =>
                        openNoteModal(item.id, "REJECTED", item.reviewNote)
                      }
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                        item.status === "REJECTED"
                          ? "cursor-default border border-rose-500/30 bg-rose-500/10 text-rose-400 opacity-60"
                          : "border border-rose-500/40 bg-rose-500/15 text-rose-300 hover:bg-rose-500/30"
                      }`}
                    >
                      <XCircle size={13} />
                      Reject
                    </button>

                    {/* Reset to Pending if processed */}
                    {item.status !== "PENDING" && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => updateStatus(item.id, "PENDING")}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/60 transition hover:bg-white/10 hover:text-white"
                      >
                        <Clock3 size={13} />
                        Reset to Pending
                      </button>
                    )}
                  </div>

                  {/* Delete Button */}
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => deleteContribution(item.id, item.title)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-500/5 px-3 py-1.5 text-xs text-rose-400 transition hover:border-rose-500/40 hover:bg-rose-500/15"
                  >
                    <Trash2 size={13} />
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Note Modal */}
      {modalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/15 bg-[#121212] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <MessageSquareQuote size={18} className="text-amber-400" />
                <h3 className="font-semibold text-white">
                  {modalItem.targetStatus === "NEEDS_CHANGES"
                    ? "Request Changes on Contribution"
                    : modalItem.targetStatus === "REJECTED"
                    ? "Reject Contribution with Reason"
                    : "Add Review Note"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalItem(null)}
                className="rounded-lg p-1 text-white/40 hover:bg-white/10 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-xs text-white/60">
                Provide constructive feedback or requirements for the contributor. This
                note will be attached to the contribution record.
              </p>

              <textarea
                rows={4}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="e.g. Please specify the district or provide historical reference sources for this tradition..."
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm text-white placeholder-white/30 focus:border-amber-400/50 focus:outline-none"
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-white/10 pt-4">
              <button
                type="button"
                onClick={() => setModalItem(null)}
                className="rounded-xl border border-white/10 px-4 py-2 text-xs font-medium text-white/60 hover:bg-white/10 hover:text-white"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() =>
                  updateStatus(modalItem.id, modalItem.targetStatus, noteText)
                }
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-black transition hover:bg-white/90"
              >
                <Send size={13} />
                Save & Update Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
