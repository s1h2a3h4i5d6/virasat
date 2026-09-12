"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  Mic2,
  MapPin,
  Languages,
  Play,
  ArrowUpRight,
  Music,
  BookOpen,
  Tag,
} from "lucide-react";

type OralHistory = {
  id: string;
  title: string;
  speakerName: string | null;
  originalLanguage: string;
  transcript: string | null;
  translation: string | null;
  audioUrl: string | null;
  coverImageUrl?: string | null;
  description: string | null;
  type?: string;
  state: {
    name: string;
    slug: string;
  } | null;
  district: {
    name: string;
    slug: string;
  } | null;
  heritage: {
    name: string;
    slug: string;
  } | null;
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  user: {
    name: string | null;
  } | null;
};

export default function OralHistoryPage() {
  const [histories, setHistories] = useState<OralHistory[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "STORY" | "SONG">("ALL");
  const [loading, setLoading] = useState(true);

  async function loadHistories() {
    setLoading(true);

    try {
      const params = new URLSearchParams();

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (typeFilter !== "ALL") {
        params.set("type", typeFilter);
      }

      const response = await fetch(
        `/api/oral-history?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error("Failed to load oral histories.");
      }

      const data = await response.json();

      setHistories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setHistories([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadHistories();
    }, 250);

    return () => clearTimeout(timer);
  }, [search, typeFilter]);

  return (
    <main className="min-h-screen bg-[#0b0b0b] px-6 py-16 text-white md:px-10">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <section className="mb-12">
          <p className="mb-3 text-xs uppercase tracking-[0.4em] text-white/30">
            Living Memory
          </p>

          <h1 className="font-serif text-4xl font-semibold md:text-6xl">
            Voices of India
          </h1>

          <p className="mt-5 max-w-3xl text-sm leading-7 text-white/45 md:text-base">
            Listen to stories, memories and traditions preserved through
            the voices of people who carry India's living heritage.
          </p>
        </section>

        {/* Search & Type Filters */}
        <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full max-w-xl">
            <Search
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25"
            />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search stories, speakers or transcripts..."
              className="w-full rounded-2xl border border-white/10 bg-white/[0.035] py-4 pl-12 pr-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/25"
            />
          </div>

          <div className="flex items-center gap-1 rounded-full bg-white/5 p-1 border border-white/10">
            <button
              onClick={() => setTypeFilter("ALL")}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                typeFilter === "ALL"
                  ? "bg-white text-black"
                  : "text-white/60 hover:text-white"
              }`}
            >
              All Voices
            </button>
            <button
              onClick={() => setTypeFilter("STORY")}
              className={`inline-flex items-center gap-1 rounded-full px-4 py-2 text-xs font-semibold transition ${
                typeFilter === "STORY"
                  ? "bg-blue-600 text-white"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <BookOpen size={12} />
              Stories
            </button>
            <button
              onClick={() => setTypeFilter("SONG")}
              className={`inline-flex items-center gap-1 rounded-full px-4 py-2 text-xs font-semibold transition ${
                typeFilter === "SONG"
                  ? "bg-purple-600 text-white"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <Music size={12} />
              Songs
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-80 animate-pulse rounded-3xl border border-white/10 bg-white/[0.035]"
              />
            ))}
          </div>
        ) : histories.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-16 text-center">
            <Mic2
              size={40}
              className="mx-auto mb-5 text-white/15"
            />

            <h2 className="font-serif text-2xl">
              No verified oral histories yet
            </h2>

            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-white/40">
              The archive will grow as communities contribute their
              stories, memories and traditional knowledge.
            </p>

            <Link
              href="/oral-history/submit"
              className="mt-7 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-medium text-black"
            >
              Preserve a Story
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {histories.map((item) => {
              const isSong = (item.type || "STORY").toUpperCase() === "SONG";

              return (
                <article
                  key={item.id}
                  className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] transition duration-300 hover:-translate-y-1 hover:bg-white/[0.06]"
                >
                  {/* Audio area */}
                  <div className="relative flex aspect-[16/9] items-center justify-center bg-gradient-to-br from-white/[0.08] to-black overflow-hidden">
                    {item.coverImageUrl ? (
                      <img
                        src={item.coverImageUrl}
                        alt={item.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/[0.06]">
                        {isSong ? (
                          <Music size={32} className="text-white/50" />
                        ) : (
                          <Mic2 size={32} className="text-white/50" />
                        )}
                      </div>
                    )}

                    <div
                      className={`absolute left-5 top-5 rounded-full border px-3 py-1.5 text-[10px] uppercase tracking-[0.15em] backdrop-blur font-semibold ${
                        isSong
                          ? "border-purple-400/40 bg-purple-900/70 text-purple-200"
                          : "border-blue-400/40 bg-blue-900/70 text-blue-200"
                      }`}
                    >
                      {isSong ? "Living Song" : "Oral Story"}
                    </div>

                    {item.category && (
                      <div className="absolute right-5 top-5 rounded-full border border-white/10 bg-black/60 px-3 py-1.5 text-[10px] text-white/75 backdrop-blur">
                        {item.category.name}
                      </div>
                    )}
                  </div>

                <div className="p-6">
                  <div className="mb-4 flex items-center gap-2 text-xs text-white/35">
                    <Languages size={14} />

                    {item.originalLanguage}
                  </div>

                  <h2 className="font-serif text-2xl">
                    {item.title}
                  </h2>

                  {item.speakerName && (
                    <p className="mt-2 text-sm text-white/45">
                      Told by {item.speakerName}
                    </p>
                  )}

                  {item.description && (
                    <p className="mt-4 line-clamp-3 text-sm leading-6 text-white/40">
                      {item.description}
                    </p>
                  )}

                  <div className="mt-5 flex flex-wrap gap-2 text-xs text-white/35">
                    {item.state && (
                      <span className="flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5">
                        <MapPin size={12} />
                        {item.state.name}
                      </span>
                    )}

                    {item.district && (
                      <span className="rounded-full border border-white/10 px-3 py-1.5">
                        {item.district.name}
                      </span>
                    )}
                  </div>

                  {item.audioUrl && (
                    <div className="mt-6 border-t border-white/10 pt-5">
                      <audio
                        controls
                        src={item.audioUrl}
                        className="w-full"
                      />
                    </div>
                  )}

                  {item.translation && (
                    <details className="mt-5 border-t border-white/10 pt-4">
                      <summary className="cursor-pointer text-sm text-white/50 hover:text-white">
                        View translation
                      </summary>

                      <p className="mt-3 text-sm leading-6 text-white/40">
                        {item.translation}
                      </p>
                    </details>
                  )}

                  {item.heritage && (
                    <Link
                      href={`/heritage/${item.heritage.slug}`}
                      className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-white/40 hover:text-white"
                    >
                      <span>
                        Related: {item.heritage.name}
                      </span>

                      <ArrowUpRight size={14} />
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
          </div>
        )}

        {/* Contribution CTA */}
        <section className="mt-24 rounded-[2rem] border border-white/10 bg-white/[0.035] p-8 md:p-12">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.35em] text-white/30">
              Preserve a voice
            </p>

            <h2 className="mt-4 font-serif text-3xl md:text-4xl">
              Your community has a story worth remembering.
            </h2>

            <p className="mt-5 text-sm leading-7 text-white/45">
              Submit an oral history in its original language. Add a
              transcript and translation so future generations can
              experience the story, not just read about it.
            </p>

            <Link
              href="/oral-history/submit"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-white/90"
            >
              Preserve a Story
              <Play size={15} />
            </Link>
          </div>
        </section>

      </div>
    </main>
  );
}
