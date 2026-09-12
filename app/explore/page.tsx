"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  MapPin,
  Filter,
  Heart,
  Footprints,
  ArrowUpRight,
  X,
  Sparkles,
  Loader2,
  Music,
  BookOpen,
  Mic2,
  Languages,
} from "lucide-react";

type District = {
  id: string;
  name: string;
  slug: string;
};

type State = {
  id: string;
  name: string;
  slug: string;
  districts: District[];
};

type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
};

type OralHistoryItem = {
  id: string;
  title: string;
  speakerName?: string | null;
  originalLanguage: string;
  transcript?: string | null;
  translation?: string | null;
  audioUrl?: string | null;
  coverImageUrl?: string | null;
  description?: string | null;
  type?: string;
  state?: {
    name: string;
    slug: string;
  } | null;
  district?: {
    name: string;
    slug: string;
  } | null;
  category?: {
    id: string;
    name: string;
    slug: string;
    imageUrl?: string | null;
  } | null;
};

type Heritage = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  preservationStatus: string;
  state: {
    name: string;
    slug: string;
  } | null;
  district: {
    name: string;
    slug: string;
  } | null;
  category: {
    name: string;
    slug: string;
    imageUrl?: string | null;
  } | null;
  media: {
    url: string;
    type: string;
  }[];
};

const categoryDescriptions: Record<string, string> = {
  architecture:
    "Historic hill forts, royal palaces, sacred temples, stepwells and distinctive regional structures that embody India's ancient engineering, defensive mastery and architectural heritage.",
  "folk-dance":
    "Living dance traditions passed down across generations, capturing vibrant regional rhythms, seasonal festivals, devotional expressions and social folklore.",
  "folk-music":
    "Narrative performance songs, ballads, devotional compositions and regional melodies that celebrate historical figures, lore and cultural memory.",
  festivals:
    "Living cultural celebrations, community rituals, and seasonal festivals that bring generations together across India's diverse regions.",
  handicrafts:
    "Indigenous artisan crafts, handloom weaves, pottery, metalwork and craft techniques refined over centuries by regional master artisans.",
  food:
    "Culinary traditions, indigenous ingredients, seasonal preparations and culinary heritage preserved through family and community traditions.",
  languages:
    "Linguistic heritage, regional dialects, ancient scripts, poetry and oral narratives celebrating India's rich linguistic legacy.",
  "indigenous-knowledge":
    "Traditional ecological knowledge, herbal medicine, agricultural systems and sustainable customs passed through oral lineages.",
  "martial-arts":
    "Ancient martial combat disciplines, traditional weapon arts, and physical training systems cultivated across Indian regions.",
  rituals:
    "Sacred rites, ceremonial practices and community customs rooted in ancient spiritual lore and seasonal cycles.",
  "traditional-clothing":
    "Distinctive regional textiles, costumes, drapes and artisanal handlooms reflecting regional geography and cultural identity.",
  "traditional-games":
    "Historical games, indigenous sports and leisure play that fostered community camaraderie and strategy across generations.",
  "traditional-instruments":
    "Handcrafted regional instruments made from wood, skin, bamboo and clay, producing the authentic sounds of India's musical heritage.",
  "traditional-occupations":
    "Heritage trades, artisanal guilds and traditional occupations that formed the economic and cultural foundation of Indian towns and villages.",
  "tribal-traditions":
    "Rich customs, spiritual lore, sacred art and communal traditions preserved by indigenous and tribal communities.",
  "folk-tales":
    "Oral stories, legends, heroic narratives and moral allegories handed down through storytelling traditions over centuries.",
};

function ExploreContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category") || "";

  const [heritage, setHeritage] = useState<Heritage[]>([]);
  const [oralHistories, setOralHistories] = useState<OralHistoryItem[]>([]);
  const [viewTab, setViewTab] = useState<"ALL" | "HERITAGE" | "STORY" | "SONG">("ALL");

  const [states, setStates] = useState<State[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [state, setState] = useState(searchParams.get("state") || "");
  const [district, setDistrict] = useState(searchParams.get("district") || "");
  const [category, setCategory] = useState(categoryParam);
  const [preservation, setPreservation] = useState(
    searchParams.get("preservation") || ""
  );
  const [sort, setSort] = useState("newest");

  const [loading, setLoading] = useState(true);
  const [filtersLoading, setFiltersLoading] = useState(true);

  const stories = useMemo(
    () =>
      oralHistories.filter(
        (item) => (item.type || "STORY").toUpperCase() === "STORY"
      ),
    [oralHistories]
  );

  const songs = useMemo(
    () =>
      oralHistories.filter(
        (item) => (item.type || "STORY").toUpperCase() === "SONG"
      ),
    [oralHistories]
  );

  // Sync category state when URL searchParams change
  useEffect(() => {
    const urlCategory = searchParams.get("category");
    if (urlCategory !== null && urlCategory !== category) {
      setCategory(urlCategory);
    }
  }, [searchParams]);

  // Load states and categories once
  useEffect(() => {
    async function loadFilters() {
      setFiltersLoading(true);

      try {
        const [mapResponse, categoryResponse] = await Promise.all([
          fetch("/api/map"),
          fetch("/api/categories"),
        ]);

        if (!mapResponse.ok) {
          throw new Error("Failed to load states");
        }

        if (!categoryResponse.ok) {
          throw new Error("Failed to load categories");
        }

        const mapData = await mapResponse.json();
        const categoryData = await categoryResponse.json();

        const stateList: State[] = Array.isArray(mapData)
          ? mapData
          : mapData.states || [];

        const categoryList: Category[] = Array.isArray(categoryData)
          ? categoryData
          : categoryData.value || [];

        setStates(stateList);
        setCategories(categoryList);
      } catch (error) {
        console.error("Filter loading error:", error);
      } finally {
        setFiltersLoading(false);
      }
    }

    loadFilters();
  }, []);

  // Update districts whenever state changes
  useEffect(() => {
    if (!state) {
      setDistricts([]);
      return;
    }

    const selectedState = states.find((item) => item.slug === state);
    setDistricts(selectedState?.districts || []);
  }, [state, states]);

  // Load heritage and oral history records
  useEffect(() => {
    async function loadHeritage() {
      setLoading(true);

      const params = new URLSearchParams();

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (state) {
        params.set("state", state);
      }

      if (district) {
        params.set("district", district);
      }

      if (category) {
        params.set("category", category);
      }

      if (preservation) {
        params.set("preservation", preservation);
      }

      params.set("sort", sort);

      try {
        const oralParams = new URLSearchParams();
        if (search.trim()) oralParams.set("search", search.trim());
        if (state) oralParams.set("stateId", state);
        if (category) oralParams.set("category", category);

        const [response, oralResponse] = await Promise.all([
          fetch(`/api/explore?${params.toString()}`),
          fetch(`/api/oral-history?${oralParams.toString()}`),
        ]);

        if (!response.ok) {
          throw new Error("Failed to load heritage");
        }

        const data = await response.json();
        setHeritage(Array.isArray(data) ? data : []);

        if (oralResponse.ok) {
          const oralData = await oralResponse.json();
          setOralHistories(Array.isArray(oralData) ? oralData : []);
        } else {
          setOralHistories([]);
        }
      } catch (error) {
        console.error("Heritage loading error:", error);
        setHeritage([]);
        setOralHistories([]);
      } finally {
        setLoading(false);
      }
    }

    loadHeritage();
  }, [search, state, district, category, preservation, sort]);

  function clearFilters() {
    setSearch("");
    setState("");
    setDistrict("");
    setCategory("");
    setPreservation("");
    setSort("newest");
    setViewTab("ALL");
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", "/explore");
    }
  }

  function handleCategoryChange(newCategory: string) {
    setCategory(newCategory);
    setViewTab("ALL");
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (newCategory) {
        url.searchParams.set("category", newCategory);
      } else {
        url.searchParams.delete("category");
      }
      window.history.replaceState(null, "", url.pathname + url.search);
    }
  }

  // Active category object
  const activeCategory = useMemo(() => {
    if (!category) return null;
    const found = categories.find(
      (c) => c.slug.toLowerCase() === category.toLowerCase()
    );
    if (found) return found;

    const nameFromSlug = category
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    return {
      id: category,
      name: nameFromSlug,
      slug: category,
      description: categoryDescriptions[category.toLowerCase()] || null,
      imageUrl: null,
    };
  }, [category, categories]);

  return (
    <main className="min-h-screen bg-[#0b0b0b] px-6 py-16 text-white md:px-10">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-10">
          <p className="mb-3 text-xs uppercase tracking-[0.4em] text-white/35">
            Explore India
          </p>

          <h1 className="font-serif text-4xl font-semibold md:text-6xl">
            Discover living heritage
          </h1>

          <p className="mt-5 max-w-2xl text-sm leading-7 text-white/45 md:text-base">
            Search, explore and learn about the traditions, places, stories and
            cultural expressions preserved through Virasat.
          </p>
        </div>

        {/* Selected Category Information Banner */}
        {activeCategory && (
          <div className="mb-10 overflow-hidden rounded-3xl border border-white/15 bg-white/[0.04] shadow-2xl backdrop-blur-md">
            <div className="flex flex-col md:flex-row">
              {activeCategory.imageUrl && (
                <div className="relative h-56 md:h-auto md:w-80 shrink-0 overflow-hidden bg-white/5">
                  <img
                    src={activeCategory.imageUrl}
                    alt={activeCategory.name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent md:hidden" />
                </div>
              )}

              <div className="flex flex-1 flex-col justify-between p-6 md:p-8">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-3.5 py-1 text-xs font-medium text-amber-300">
                      <Sparkles size={12} />
                      Cultural Category
                    </span>

                    <button
                      onClick={() => handleCategoryChange("")}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60 transition hover:bg-white/10 hover:text-white"
                    >
                      <span>Show all categories</span>
                      <X size={13} />
                    </button>
                  </div>

                  <h2 className="mt-3 font-serif text-3xl font-semibold text-white md:text-4xl">
                    {activeCategory.name}
                  </h2>

                  <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/65 md:text-base">
                    {activeCategory.description ||
                      categoryDescriptions[activeCategory.slug] ||
                      `Explore the traditions, stories, places and cultural heritage preserved under ${activeCategory.name}.`}
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-4 text-xs text-white/40">
                  <span>
                    {loading
                      ? "Loading records..."
                      : `Showing ${heritage.length} heritage ${
                          heritage.length === 1 ? "record" : "records"
                        }${
                          oralHistories.length > 0
                            ? ` · ${stories.length} oral ${
                                stories.length === 1 ? "story" : "stories"
                              } · ${songs.length} ${
                                songs.length === 1 ? "song" : "songs"
                              }`
                            : ""
                        } in ${activeCategory.name}`}
                  </span>

                  <span className="text-white/30">
                    Category: /{activeCategory.slug}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-10 rounded-3xl border border-white/10 bg-white/[0.035] p-5">
          {/* Search */}
          <div className="relative">
            <Search
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
            />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search heritage, traditions, stories..."
              className="w-full rounded-2xl border border-white/10 bg-black/30 py-4 pl-12 pr-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/25"
            />
          </div>

          {/* Dropdown filters */}
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {/* State */}
            <select
              value={state}
              onChange={(event) => {
                setState(event.target.value);
                setDistrict("");
              }}
              disabled={filtersLoading}
              className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none disabled:opacity-50"
            >
              <option value="">
                {filtersLoading ? "Loading States..." : "All States"}
              </option>

              {states.map((item) => (
                <option key={item.id} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </select>

            {/* District */}
            <select
              value={district}
              onChange={(event) => setDistrict(event.target.value)}
              disabled={!state || filtersLoading}
              className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none disabled:opacity-40"
            >
              <option value="">All Districts</option>

              {districts.map((item) => (
                <option key={item.id} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </select>

            {/* Category */}
            <select
              value={category}
              onChange={(event) => handleCategoryChange(event.target.value)}
              disabled={filtersLoading}
              className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none disabled:opacity-50"
            >
              <option value="">
                {filtersLoading ? "Loading Categories..." : "All Categories"}
              </option>

              {categories.map((item) => (
                <option key={item.id} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </select>

            {/* Preservation */}
            <select
              value={preservation}
              onChange={(event) => setPreservation(event.target.value)}
              className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none"
            >
              <option value="">Preservation Status</option>
              <option value="STABLE">Stable</option>
              <option value="VULNERABLE">Vulnerable</option>
              <option value="ENDANGERED">Endangered</option>
              <option value="CRITICAL">Critical</option>
            </select>

            {/* Sort */}
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none"
            >
              <option value="newest">Sort: Newest</option>
              <option value="name">Sort: Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* View Tabs */}
        <div className="mb-8 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setViewTab("ALL")}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
              viewTab === "ALL"
                ? "bg-white text-black shadow-sm"
                : "border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
            }`}
          >
            All Archive Content ({heritage.length + oralHistories.length})
          </button>

          <button
            onClick={() => setViewTab("HERITAGE")}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
              viewTab === "HERITAGE"
                ? "bg-white text-black shadow-sm"
                : "border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
            }`}
          >
            🏛️ Heritage Places ({heritage.length})
          </button>

          <button
            onClick={() => setViewTab("STORY")}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition ${
              viewTab === "STORY"
                ? "bg-blue-600 text-white shadow-sm"
                : "border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
            }`}
          >
            <BookOpen size={13} />
            <span>Oral Stories ({stories.length})</span>
          </button>

          <button
            onClick={() => setViewTab("SONG")}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition ${
              viewTab === "SONG"
                ? "bg-purple-600 text-white shadow-sm"
                : "border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Music size={13} />
            <span>Songs & Melodies ({songs.length})</span>
          </button>
        </div>

        {/* Results count */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-white/40">
            <Filter size={16} />

            {loading
              ? "Searching..."
              : viewTab === "HERITAGE"
                ? `${heritage.length} heritage ${
                    heritage.length === 1 ? "record" : "records"
                  }${activeCategory ? ` in ${activeCategory.name}` : ""}`
                : viewTab === "STORY"
                  ? `${stories.length} oral ${
                      stories.length === 1 ? "story" : "stories"
                    }${activeCategory ? ` in ${activeCategory.name}` : ""}`
                  : viewTab === "SONG"
                    ? `${songs.length} ${
                        songs.length === 1 ? "song" : "songs"
                      }${activeCategory ? ` in ${activeCategory.name}` : ""}`
                    : `${heritage.length + oralHistories.length} total ${
                        heritage.length + oralHistories.length === 1
                          ? "item"
                          : "items"
                      }${activeCategory ? ` in ${activeCategory.name}` : ""}`}
          </div>

          {activeCategory && (
            <button
              onClick={() => handleCategoryChange("")}
              className="text-xs text-white/50 hover:text-white underline"
            >
              Clear category filter
            </button>
          )}
        </div>

        {/* Loading */}
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="h-64 animate-pulse rounded-3xl border border-white/10 bg-white/[0.035]"
              />
            ))}
          </div>
        ) : (viewTab === "HERITAGE" && heritage.length === 0) ||
          (viewTab === "STORY" && stories.length === 0) ||
          (viewTab === "SONG" && songs.length === 0) ||
          (viewTab === "ALL" &&
            heritage.length === 0 &&
            oralHistories.length === 0) ? (
          /* Empty */
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-16 text-center">
            <MapPin size={32} className="mx-auto mb-5 text-white/25" />

            <h2 className="font-serif text-2xl">
              No{" "}
              {viewTab === "STORY"
                ? "oral stories"
                : viewTab === "SONG"
                  ? "living songs"
                  : "records"}{" "}
              found
              {activeCategory ? ` in ${activeCategory.name}` : ""}
            </h2>

            <p className="mt-3 text-sm text-white/40">
              {activeCategory
                ? `No ${
                    viewTab === "STORY"
                      ? "stories"
                      : viewTab === "SONG"
                        ? "songs"
                        : "items"
                  } have been uploaded for this category yet.`
                : "Try changing your search or filters."}
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="mt-6 rounded-xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-white/90"
            >
              Reset filters
            </button>
          </div>
        ) : (
          /* Results */
          <div className="space-y-14">
            {/* Heritage Section */}
            {(viewTab === "ALL" || viewTab === "HERITAGE") &&
              heritage.length > 0 && (
                <section>
                  {viewTab === "ALL" && oralHistories.length > 0 && (
                    <div className="mb-6 flex items-center gap-3">
                      <span className="h-2 w-2 rounded-full bg-amber-400" />
                      <h2 className="font-serif text-2xl font-semibold text-white">
                        Heritage Places & Traditions ({heritage.length})
                      </h2>
                    </div>
                  )}

                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {heritage.map((item) => {
                      const thumbnail =
                        item.media?.[0]?.url || item.category?.imageUrl;

                      return (
                        <Link
                          key={item.id}
                          href={`/heritage/${item.slug}`}
                          className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.07]"
                        >
                          <div className="relative h-52 overflow-hidden bg-white/5">
                            {thumbnail ? (
                              <img
                                src={thumbnail}
                                alt={item.name}
                                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center">
                                <MapPin
                                  size={36}
                                  className="text-white/15"
                                />
                              </div>
                            )}

                            <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/60 px-3 py-1 text-xs text-white/70 backdrop-blur">
                              {item.category?.name || "Heritage"}
                            </div>

                            <div className="absolute right-4 top-4 flex gap-2">
                              <span className="rounded-full border border-white/10 bg-black/60 p-2 backdrop-blur">
                                <Heart
                                  size={15}
                                  className="text-white/60"
                                />
                              </span>

                              <span className="rounded-full border border-white/10 bg-black/60 p-2 backdrop-blur">
                                <Footprints
                                  size={15}
                                  className="text-white/60"
                                />
                              </span>
                            </div>
                          </div>

                          <div className="p-6">
                            <div className="mb-3 flex items-center justify-between">
                              <span className="text-xs uppercase tracking-[0.15em] text-white/30">
                                {item.preservationStatus}
                              </span>

                              <ArrowUpRight
                                size={18}
                                className="text-white/25 transition group-hover:text-white"
                              />
                            </div>

                            <h2 className="font-serif text-2xl group-hover:text-amber-200 transition">
                              {item.name}
                            </h2>

                            <p className="mt-3 line-clamp-2 text-sm leading-6 text-white/40">
                              {item.shortDescription ||
                                "Explore the cultural story and significance of this heritage."}
                            </p>

                            <div className="mt-5 text-xs text-white/30">
                              {item.state?.name || "India"}
                              {item.district?.name &&
                                ` · ${item.district.name}`}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              )}

            {/* Oral Stories Section */}
            {(viewTab === "ALL" || viewTab === "STORY") &&
              stories.length > 0 && (
                <section>
                  {viewTab === "ALL" && (
                    <div className="mb-6 flex items-center gap-3">
                      <span className="h-2 w-2 rounded-full bg-blue-400" />
                      <h2 className="font-serif text-2xl font-semibold text-white">
                        Oral Stories ({stories.length})
                      </h2>
                    </div>
                  )}

                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {stories.map((item) => {
                      const thumbnail =
                        item.coverImageUrl || item.category?.imageUrl;

                      return (
                        <article
                          key={item.id}
                          className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.07]"
                        >
                          <div>
                            <div className="relative h-52 overflow-hidden bg-white/5 flex items-center justify-center">
                              {thumbnail ? (
                                <img
                                  src={thumbnail}
                                  alt={item.title}
                                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                  onError={(e) => {
                                    e.currentTarget.style.display =
                                      "none";
                                  }}
                                />
                              ) : (
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-white/50">
                                  <BookOpen size={30} />
                                </div>
                              )}

                              <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-blue-400/30 bg-blue-900/80 px-3 py-1 text-xs font-semibold text-blue-200 backdrop-blur">
                                <BookOpen size={12} />
                                Oral Story
                              </div>

                              {item.category && (
                                <div className="absolute right-4 top-4 rounded-full border border-white/10 bg-black/60 px-3 py-1 text-xs text-white/75 backdrop-blur">
                                  {item.category.name}
                                </div>
                              )}
                            </div>

                            <div className="p-6">
                              <div className="mb-3 flex items-center justify-between text-xs text-white/40">
                                <span className="inline-flex items-center gap-1">
                                  <Languages size={13} />
                                  {item.originalLanguage}
                                </span>

                                {item.speakerName && (
                                  <span className="truncate max-w-[150px]">
                                    Voice: {item.speakerName}
                                  </span>
                                )}
                              </div>

                              <h3 className="font-serif text-2xl font-semibold text-white group-hover:text-amber-200 transition">
                                {item.title}
                              </h3>

                              {item.description && (
                                <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/45">
                                  {item.description}
                                </p>
                              )}

                              {item.transcript && (
                                <details className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-white/60">
                                  <summary className="cursor-pointer font-medium text-white/80 hover:text-white">
                                    Read transcript
                                  </summary>
                                  <p className="mt-2 max-h-36 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                                    {item.transcript}
                                  </p>
                                </details>
                              )}

                              {item.audioUrl && (
                                <div className="mt-4 border-t border-white/10 pt-4">
                                  <p className="mb-2 text-[11px] uppercase tracking-wider text-white/35">
                                    Listen to recording
                                  </p>
                                  <audio
                                    controls
                                    className="w-full h-8"
                                    src={item.audioUrl}
                                  />
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="border-t border-white/5 p-6 pt-4 text-xs text-white/30 flex items-center justify-between">
                            <span>
                              {[item.district?.name, item.state?.name]
                                .filter(Boolean)
                                .join(", ") || "India"}
                            </span>

                            <Link
                              href="/oral-history"
                              className="inline-flex items-center gap-1 text-white/40 transition hover:text-white"
                            >
                              <span>Voices Archive</span>
                              <ArrowUpRight size={13} />
                            </Link>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              )}

            {/* Living Songs Section */}
            {(viewTab === "ALL" || viewTab === "SONG") &&
              songs.length > 0 && (
                <section>
                  {viewTab === "ALL" && (
                    <div className="mb-6 flex items-center gap-3">
                      <span className="h-2 w-2 rounded-full bg-purple-400" />
                      <h2 className="font-serif text-2xl font-semibold text-white">
                        Songs & Melodies ({songs.length})
                      </h2>
                    </div>
                  )}

                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {songs.map((item) => {
                      const thumbnail =
                        item.coverImageUrl || item.category?.imageUrl;

                      return (
                        <article
                          key={item.id}
                          className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.07]"
                        >
                          <div>
                            <div className="relative h-52 overflow-hidden bg-white/5 flex items-center justify-center">
                              {thumbnail ? (
                                <img
                                  src={thumbnail}
                                  alt={item.title}
                                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                  onError={(e) => {
                                    e.currentTarget.style.display =
                                      "none";
                                  }}
                                />
                              ) : (
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-white/50">
                                  <Music size={30} />
                                </div>
                              )}

                              <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-purple-400/30 bg-purple-900/80 px-3 py-1 text-xs font-semibold text-purple-200 backdrop-blur">
                                <Music size={12} />
                                Living Song
                              </div>

                              {item.category && (
                                <div className="absolute right-4 top-4 rounded-full border border-white/10 bg-black/60 px-3 py-1 text-xs text-white/75 backdrop-blur">
                                  {item.category.name}
                                </div>
                              )}
                            </div>

                            <div className="p-6">
                              <div className="mb-3 flex items-center justify-between text-xs text-white/40">
                                <span className="inline-flex items-center gap-1">
                                  <Languages size={13} />
                                  {item.originalLanguage}
                                </span>

                                {item.speakerName && (
                                  <span className="truncate max-w-[150px]">
                                    Singer / Voice: {item.speakerName}
                                  </span>
                                )}
                              </div>

                              <h3 className="font-serif text-2xl font-semibold text-white group-hover:text-amber-200 transition">
                                {item.title}
                              </h3>

                              {item.description && (
                                <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/45">
                                  {item.description}
                                </p>
                              )}

                              {item.transcript && (
                                <details className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-white/60">
                                  <summary className="cursor-pointer font-medium text-white/80 hover:text-white">
                                    Read lyrics / text
                                  </summary>
                                  <p className="mt-2 max-h-36 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                                    {item.transcript}
                                  </p>
                                </details>
                              )}

                              {item.audioUrl && (
                                <div className="mt-4 border-t border-white/10 pt-4">
                                  <p className="mb-2 text-[11px] uppercase tracking-wider text-white/35">
                                    Listen to melody
                                  </p>
                                  <audio
                                    controls
                                    className="w-full h-8"
                                    src={item.audioUrl}
                                  />
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="border-t border-white/5 p-6 pt-4 text-xs text-white/30 flex items-center justify-between">
                            <span>
                              {[item.district?.name, item.state?.name]
                                .filter(Boolean)
                                .join(", ") || "India"}
                            </span>

                            <Link
                              href="/oral-history"
                              className="inline-flex items-center gap-1 text-white/40 transition hover:text-white"
                            >
                              <span>Voices Archive</span>
                              <ArrowUpRight size={13} />
                            </Link>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              )}
          </div>
        )}
      </div>
    </main>
  );
}

export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#0b0b0b] px-6 py-16 text-white md:px-10 flex items-center justify-center">
          <Loader2 className="animate-spin text-white/40" size={32} />
        </main>
      }
    >
      <ExploreContent />
    </Suspense>
  );
}
