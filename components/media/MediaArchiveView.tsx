"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Image as ImageIcon,
  Video,
  FileText,
  Headphones,
  ArrowUpRight,
  MapPin,
  BookOpen,
  Sparkles,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export type UnifiedMediaItem = {
  id: string;
  title: string;
  type: "PHOTO" | "VIDEO" | "AUDIO" | "DOCUMENT";
  url: string;
  description: string | null;
  thumbnail?: string | null;
  audioUrl?: string | null;
  linkHref?: string | null;
  linkLabel?: string | null;
  location?: string | null;
  metaBadge?: string | null;
  categoryName?: string | null;
};

export default function MediaArchiveView({
  items,
}: {
  items: UnifiedMediaItem[];
}) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<
    "ALL" | "PHOTO" | "VIDEO" | "AUDIO" | "DOCUMENT"
  >("ALL");

  const counts = useMemo(() => {
    return {
      all: items.length,
      photos: items.filter((i) => i.type === "PHOTO").length,
      videos: items.filter((i) => i.type === "VIDEO").length,
      audio: items.filter((i) => i.type === "AUDIO").length,
      documents: items.filter((i) => i.type === "DOCUMENT").length,
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    if (activeTab === "ALL") return items;
    return items.filter((i) => i.type === activeTab);
  }, [items, activeTab]);

  return (
    <div>
      {/* Archive Stats Cards (Clickable Filter Buttons) */}
      <div className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Photographs */}
        <button
          type="button"
          onClick={() => setActiveTab(activeTab === "PHOTO" ? "ALL" : "PHOTO")}
          className={`rounded-2xl border p-6 text-left transition ${
            activeTab === "PHOTO"
              ? "border-white/40 bg-white/10 ring-1 ring-white/20"
              : "border-white/10 bg-white/[0.035] hover:bg-white/[0.06]"
          }`}
        >
          <ImageIcon size={20} className="mb-4 text-white/50" />
          <p className="text-3xl font-semibold">{counts.photos}</p>
          <p className="mt-1 text-sm text-white/35">{t("Photographs")}</p>
        </button>

        {/* Videos */}
        <button
          type="button"
          onClick={() => setActiveTab(activeTab === "VIDEO" ? "ALL" : "VIDEO")}
          className={`rounded-2xl border p-6 text-left transition ${
            activeTab === "VIDEO"
              ? "border-white/40 bg-white/10 ring-1 ring-white/20"
              : "border-white/10 bg-white/[0.035] hover:bg-white/[0.06]"
          }`}
        >
          <Video size={20} className="mb-4 text-white/50" />
          <p className="text-3xl font-semibold">{counts.videos}</p>
          <p className="mt-1 text-sm text-white/35">{t("Videos")}</p>
        </button>

        {/* Audio Stories */}
        <button
          type="button"
          onClick={() => setActiveTab(activeTab === "AUDIO" ? "ALL" : "AUDIO")}
          className={`rounded-2xl border p-6 text-left transition ${
            activeTab === "AUDIO"
              ? "border-white/40 bg-white/10 ring-1 ring-white/20"
              : "border-white/10 bg-white/[0.035] hover:bg-white/[0.06]"
          }`}
        >
          <Headphones size={20} className="mb-4 text-white/50" />
          <p className="text-3xl font-semibold">{counts.audio}</p>
          <p className="mt-1 text-sm text-white/35">{t("Audio Stories")}</p>
        </button>

        {/* Documents */}
        <button
          type="button"
          onClick={() =>
            setActiveTab(activeTab === "DOCUMENT" ? "ALL" : "DOCUMENT")
          }
          className={`rounded-2xl border p-6 text-left transition ${
            activeTab === "DOCUMENT"
              ? "border-white/40 bg-white/10 ring-1 ring-white/20"
              : "border-white/10 bg-white/[0.035] hover:bg-white/[0.06]"
          }`}
        >
          <FileText size={20} className="mb-4 text-white/50" />
          <p className="text-3xl font-semibold">{counts.documents}</p>
          <p className="mt-1 text-sm text-white/35">{t("Documents")}</p>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="mb-8 flex flex-wrap items-center gap-2">
        {(
          [
            { key: "ALL", label: t("All Media"), count: counts.all },
            { key: "PHOTO", label: t("Photographs"), count: counts.photos },
            { key: "VIDEO", label: t("Videos"), count: counts.videos },
            { key: "AUDIO", label: t("Audio Stories"), count: counts.audio },
            { key: "DOCUMENT", label: t("Documents"), count: counts.documents },
          ] as const
        ).map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-medium transition ${
                active
                  ? "bg-white text-black font-semibold"
                  : "border border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/[0.08] hover:text-white"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                  active
                    ? "bg-black/15 text-black font-bold"
                    : "bg-white/10 text-white/60"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Media Grid */}
      {filteredItems.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-16 text-center">
          <ImageIcon size={36} className="mx-auto mb-5 text-white/20" />
          <h2 className="font-serif text-2xl">{t("The archive is growing")}</h2>
          <p className="mt-3 text-sm text-white/40">
            {t("Heritage media will appear here as it is added and verified.")}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredItems.map((item) => {
            return (
              <article
                key={`${item.type}-${item.id}`}
                className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.06]"
              >
                <div>
                  {/* Visual Container */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-black">
                    {/* PHOTO */}
                    {item.type === "PHOTO" && (
                      <img
                        src={item.url}
                        alt={item.title || "Virasat heritage photograph"}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    )}

                    {/* VIDEO */}
                    {item.type === "VIDEO" && (
                      <video
                        src={item.url}
                        poster={item.thumbnail || undefined}
                        controls
                        preload="metadata"
                        className="h-full w-full object-cover"
                      />
                    )}

                    {/* AUDIO */}
                    {item.type === "AUDIO" && (
                      <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-purple-950/40 via-neutral-900 to-black p-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-purple-400/30 bg-purple-500/20 text-purple-300">
                          <Headphones size={28} />
                        </div>
                        <div className="mt-3 w-full">
                          <audio
                            src={item.url}
                            controls
                            className="h-8 w-full"
                            preload="metadata"
                          />
                        </div>
                      </div>
                    )}

                    {/* DOCUMENT / BOOK */}
                    {item.type === "DOCUMENT" && (
                      <div className="flex h-full items-center justify-center overflow-hidden bg-gradient-to-br from-amber-950/30 via-neutral-900 to-black">
                        {item.thumbnail ? (
                          <img
                            src={item.thumbnail}
                            alt={item.title}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-amber-300/70">
                            <BookOpen size={36} />
                            <span className="text-[11px] uppercase tracking-wider text-white/50">
                              {t("Digital Book")}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Type Badge */}
                    <div className="absolute left-4 top-4 rounded-full border border-white/15 bg-black/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/90 backdrop-blur-md">
                      {item.type === "PHOTO" && "PHOTO"}
                      {item.type === "VIDEO" && "VIDEO"}
                      {item.type === "AUDIO" && "AUDIO"}
                      {item.type === "DOCUMENT" && "DOCUMENT"}
                    </div>

                    {/* Category or Meta Badge */}
                    {item.categoryName && (
                      <div className="absolute right-4 top-4 rounded-full border border-white/10 bg-black/60 px-2.5 py-0.5 text-[10px] text-white/70 backdrop-blur-md">
                        {t(item.categoryName)}
                      </div>
                    )}
                  </div>

                  {/* Text Content */}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-serif text-xl font-medium text-white transition group-hover:text-amber-200">
                          {item.title}
                        </h2>

                        {item.metaBadge && (
                          <p className="mt-1 text-xs font-medium text-amber-300/80">
                            {t(item.metaBadge)}
                          </p>
                        )}

                        {item.description && (
                          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-white/50">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Link / Location */}
                <div className="border-t border-white/10 p-5 pt-4">
                  {item.linkHref ? (
                    <Link
                      href={item.linkHref}
                      className="flex items-center justify-between text-xs text-white/50 transition hover:text-white"
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        {item.location ? (
                          <>
                            <MapPin size={12} className="shrink-0 text-white/35" />
                            <span className="truncate">{t(item.location)}</span>
                          </>
                        ) : (
                          <span className="truncate">{item.linkLabel || t("Explore collection")}</span>
                        )}
                      </span>
                      <ArrowUpRight size={13} className="shrink-0 text-white/40" />
                    </Link>
                  ) : item.location ? (
                    <div className="flex items-center gap-1.5 text-xs text-white/40">
                      <MapPin size={12} className="shrink-0 text-white/35" />
                      <span className="truncate">{t(item.location)}</span>
                    </div>
                  ) : (
                    <div className="text-xs text-white/30">Virasat Archive</div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
