"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Clock3,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Landmark,
  Mic2,
  ClipboardCheck,
  Video,
  ExternalLink,
  User,
  MapPin,
  Tag,
  Music,
  BookOpen,
} from "lucide-react";

type VerificationCounts = {
  contributions: number;
  oralHistories: number;
  heritage: number;
  videos: number;
  aiDocuments: number;
  total: number;
};

type VerificationData = {
  counts: VerificationCounts;
  queue: string;
  items: {
    contributions: any[];
    oralHistories: any[];
    heritage: any[];
    videos: any[];
    aiDocuments: any[];
  };
};

const queueTabs = [
  { key: "ALL", label: "All Pending" },
  { key: "CONTRIBUTION", label: "Contributions" },
  { key: "ORAL_HISTORY", label: "Oral History & Songs" },
  { key: "HERITAGE", label: "Heritage Entries" },
  { key: "VIDEO", label: "Videos" },
];

export default function AdminVerificationPage() {
  const [data, setData] = useState<VerificationData | null>(null);
  const [activeQueue, setActiveQueue] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  async function loadQueues() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/verification?queue=${activeQueue}`, {
        cache: "no-store",
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to load verification queues.");
      }

      setData(json);
    } catch (error) {
      console.error("Load verification queues error:", error);
      alert(error instanceof Error ? error.message : "Failed to load queues.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQueues();
  }, [activeQueue]);

  async function handleVerification(
    entityType: "CONTRIBUTION" | "ORAL_HISTORY" | "HERITAGE" | "VIDEO" | "AI_DOCUMENT",
    id: string,
    action: "APPROVE" | "REJECT" | "NEEDS_CHANGES" | "VERIFY" | "UNVERIFY",
    note?: string
  ) {
    setActionLoadingId(`${entityType}-${id}`);
    try {
      const res = await fetch("/api/admin/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityType, id, action, note }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to process verification action.");
      }

      // Reload updated queues
      await loadQueues();
    } catch (error) {
      console.error("Verification action error:", error);
      alert(error instanceof Error ? error.message : "Verification action failed.");
    } finally {
      setActionLoadingId(null);
    }
  }

  const counts = data?.counts || {
    contributions: 0,
    oralHistories: 0,
    heritage: 0,
    videos: 0,
    aiDocuments: 0,
    total: 0,
  };

  const hasItems =
    data &&
    (data.items.contributions.length > 0 ||
      data.items.oralHistories.length > 0 ||
      data.items.heritage.length > 0 ||
      data.items.videos.length > 0);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-white/40">
            Quality Assurance & Trust
          </div>
          <h1 className="mt-1 font-serif text-3xl font-semibold sm:text-4xl">
            Verification Command Centre
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">
            Unified audit queue to verify community contributions, oral folklore recordings,
            heritage records, and media before they become verified Virasat archive content.
          </p>
        </div>

        <button
          onClick={loadQueues}
          disabled={loading}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-medium text-white/80 transition hover:bg-white/10"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh Queues
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.05] p-5">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-xs uppercase tracking-wider font-semibold">Total Pending</span>
            <Clock3 size={18} />
          </div>
          <div className="mt-3 text-3xl font-semibold text-amber-300">
            {counts.total}
          </div>
          <div className="mt-1 text-xs text-amber-200/50">Across all platform modules</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center justify-between text-white/40">
            <span className="text-xs uppercase tracking-wider">Contributions</span>
            <ClipboardCheck size={18} />
          </div>
          <div className="mt-3 text-3xl font-semibold">{counts.contributions}</div>
          <div className="mt-1 text-xs text-white/40">Community texts</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center justify-between text-white/40">
            <span className="text-xs uppercase tracking-wider">Oral Histories</span>
            <Mic2 size={18} />
          </div>
          <div className="mt-3 text-3xl font-semibold">{counts.oralHistories}</div>
          <div className="mt-1 text-xs text-white/40">Voices & songs</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center justify-between text-white/40">
            <span className="text-xs uppercase tracking-wider">Heritage Items</span>
            <Landmark size={18} />
          </div>
          <div className="mt-3 text-3xl font-semibold">{counts.heritage}</div>
          <div className="mt-1 text-xs text-white/40">Unverified records</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center justify-between text-white/40">
            <span className="text-xs uppercase tracking-wider">Media & Video</span>
            <Video size={18} />
          </div>
          <div className="mt-3 text-3xl font-semibold">{counts.videos}</div>
          <div className="mt-1 text-xs text-white/40">Awaiting approval</div>
        </div>
      </div>

      {/* Queue Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
        {queueTabs.map((tab) => {
          const active = activeQueue === tab.key;
          let count = 0;
          if (tab.key === "ALL") count = counts.total;
          if (tab.key === "CONTRIBUTION") count = counts.contributions;
          if (tab.key === "ORAL_HISTORY") count = counts.oralHistories;
          if (tab.key === "HERITAGE") count = counts.heritage;
          if (tab.key === "VIDEO") count = counts.videos;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveQueue(tab.key)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-medium transition ${
                active
                  ? "bg-white text-black"
                  : "border border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/[0.08] hover:text-white"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  active ? "bg-black/15 text-black" : "bg-white/10 text-white/70"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Queues Content */}
      {loading ? (
        <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3 text-white/50">
            <Loader2 size={20} className="animate-spin" />
            <span>Scanning verification queues...</span>
          </div>
        </div>
      ) : !hasItems ? (
        <div className="flex min-h-[280px] flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/[0.02] p-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
            <ShieldCheck size={28} />
          </div>
          <h3 className="mt-4 text-base font-medium text-white">All Clear! No Pending Items</h3>
          <p className="mt-1 max-w-sm text-xs text-white/40">
            Every submission in this queue has been verified, reviewed, and published.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 1. Community Contributions Queue */}
          {data?.items.contributions && data.items.contributions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-amber-300">
                  <ClipboardCheck size={16} />
                  Pending Community Contributions ({data.items.contributions.length})
                </div>
                <Link
                  href="/admin/contributions"
                  className="text-xs text-white/40 hover:text-white"
                >
                  View all in Contributions →
                </Link>
              </div>

              <div className="space-y-3">
                {data.items.contributions.map((c) => {
                  const busy = actionLoadingId === `CONTRIBUTION-${c.id}`;
                  return (
                    <div
                      key={c.id}
                      className="flex flex-col justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:flex-row md:items-center"
                    >
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="rounded-full bg-amber-400/10 px-2.5 py-0.5 text-[10px] font-semibold text-amber-300">
                            Community Contribution
                          </span>
                          <span className="text-white/40">
                            By {c.user?.name || c.user?.email || "Community User"}
                          </span>
                          {c.heritage && (
                            <span className="text-sky-300">
                              · Linked to: {c.heritage.name}
                            </span>
                          )}
                        </div>
                        <h4 className="font-serif text-lg font-medium text-white">
                          {c.title}
                        </h4>
                        <p className="line-clamp-2 max-w-3xl text-xs leading-relaxed text-white/60">
                          {c.content}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            handleVerification("CONTRIBUTION", c.id, "APPROVE")
                          }
                          className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3.5 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/30"
                        >
                          <CheckCircle2 size={13} />
                          Verify & Approve
                        </button>

                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            handleVerification("CONTRIBUTION", c.id, "REJECT")
                          }
                          className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20"
                        >
                          <XCircle size={13} />
                          Reject
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Oral Histories Queue */}
          {data?.items.oralHistories && data.items.oralHistories.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-purple-300">
                  <Mic2 size={16} />
                  Pending Oral Histories & Songs ({data.items.oralHistories.length})
                </div>
                <Link
                  href="/admin/oral-history"
                  className="text-xs text-white/40 hover:text-white"
                >
                  Manage in Oral History →
                </Link>
              </div>

              <div className="space-y-3">
                {data.items.oralHistories.map((oh) => {
                  const busy = actionLoadingId === `ORAL_HISTORY-${oh.id}`;
                  const isSong = (oh.type || "").toUpperCase() === "SONG";

                  return (
                    <div
                      key={oh.id}
                      className="flex flex-col justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:flex-row md:items-center"
                    >
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                              isSong
                                ? "bg-purple-500/20 text-purple-300"
                                : "bg-sky-500/20 text-sky-300"
                            }`}
                          >
                            {isSong ? "🎵 Folk Song" : "📖 Oral Story"}
                          </span>
                          {oh.category?.name && (
                            <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[10px] text-white/60">
                              {oh.category.name}
                            </span>
                          )}
                          <span className="text-white/40">
                            Language: {oh.originalLanguage}
                          </span>
                          {oh.state?.name && (
                            <span className="text-white/40">· {oh.state.name}</span>
                          )}
                        </div>

                        <h4 className="font-serif text-lg font-medium text-white">
                          {oh.title}
                        </h4>

                        {oh.speakerName && (
                          <p className="text-xs text-white/50">
                            Speaker: {oh.speakerName}
                          </p>
                        )}
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            handleVerification("ORAL_HISTORY", oh.id, "APPROVE")
                          }
                          className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3.5 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/30"
                        >
                          <CheckCircle2 size={13} />
                          Verify & Publish
                        </button>

                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            handleVerification("ORAL_HISTORY", oh.id, "REJECT")
                          }
                          className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20"
                        >
                          <XCircle size={13} />
                          Reject
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Heritage Records Queue */}
          {data?.items.heritage && data.items.heritage.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-sky-300">
                  <Landmark size={16} />
                  Unverified Heritage Entries ({data.items.heritage.length})
                </div>
                <Link
                  href="/admin/heritage"
                  className="text-xs text-white/40 hover:text-white"
                >
                  Manage in Heritage CMS →
                </Link>
              </div>

              <div className="space-y-3">
                {data.items.heritage.map((h) => {
                  const busy = actionLoadingId === `HERITAGE-${h.id}`;
                  return (
                    <div
                      key={h.id}
                      className="flex flex-col justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:flex-row md:items-center"
                    >
                      <div className="flex items-start gap-4">
                        {h.media?.[0]?.url && (
                          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white/5">
                            <img
                              src={h.media[0].url}
                              alt={h.name}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            {h.category?.name && (
                              <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[10px] text-white/60">
                                {h.category.name}
                              </span>
                            )}
                            <span className="text-white/40">
                              {h.state?.name} {h.district?.name && `· ${h.district.name}`}
                            </span>
                          </div>

                          <h4 className="font-serif text-lg font-medium text-white">
                            {h.name}
                          </h4>

                          {h.shortDescription && (
                            <p className="line-clamp-1 text-xs text-white/50">
                              {h.shortDescription}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <Link
                          href={`/heritage/${h.slug}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/70 hover:bg-white/10 hover:text-white"
                        >
                          Preview
                          <ExternalLink size={11} />
                        </Link>

                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            handleVerification("HERITAGE", h.id, "VERIFY")
                          }
                          className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3.5 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/30"
                        >
                          <ShieldCheck size={13} />
                          Mark Verified
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. Homepage Videos Queue */}
          {data?.items.videos && data.items.videos.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-rose-300">
                  <Video size={16} />
                  Pending Homepage Videos ({data.items.videos.length})
                </div>
                <Link
                  href="/admin/media/videos"
                  className="text-xs text-white/40 hover:text-white"
                >
                  Manage in Videos →
                </Link>
              </div>

              <div className="space-y-3">
                {data.items.videos.map((v) => {
                  const busy = actionLoadingId === `VIDEO-${v.id}`;
                  return (
                    <div
                      key={v.id}
                      className="flex flex-col justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:flex-row md:items-center"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-rose-300">
                            Video Submission
                          </span>
                        </div>
                        <h4 className="font-serif text-lg font-medium text-white">
                          {v.title}
                        </h4>
                        {v.description && (
                          <p className="line-clamp-1 text-xs text-white/50">
                            {v.description}
                          </p>
                        )}
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            handleVerification("VIDEO", v.id, "APPROVE")
                          }
                          className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3.5 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/30"
                        >
                          <CheckCircle2 size={13} />
                          Approve & Publish
                        </button>

                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            handleVerification("VIDEO", v.id, "REJECT")
                          }
                          className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20"
                        >
                          <XCircle size={13} />
                          Reject
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
