"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps";
import { geoCentroid } from "d3-geo";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronRight,
  MapPin,
  Search,
  Sparkles,
} from "lucide-react";

type Heritage = {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string | null;
  preservationStatus?: string | null;
  verified?: boolean;
  category?: {
    name: string;
  } | null;
};

type District = {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
  heritage: Heritage[];
};

type State = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  districts: District[];
};

const INDIA_MAP = "/maps/india.geojson";

const STATE_MAPS: Record<string, string> = {
  "andhra-pradesh": "/maps/states/andhra-pradesh.geojson",
  "arunachal-pradesh": "/maps/states/arunachal-pradesh.geojson",
  assam: "/maps/states/assam.geojson",
  bihar: "/maps/states/bihar.geojson",
  chhattisgarh: "/maps/states/chhattisgarh.geojson",
  goa: "/maps/states/goa.geojson",
  gujarat: "/maps/states/gujarat.geojson",
  haryana: "/maps/states/haryana.geojson",
  "himachal-pradesh": "/maps/states/himachal-pradesh.geojson",
  jharkhand: "/maps/states/jharkhand.geojson",
  karnataka: "/maps/states/karnataka.geojson",
  kerala: "/maps/states/kerala.geojson",
  "madhya-pradesh": "/maps/states/madhya-pradesh.geojson",
  maharashtra: "/maps/states/maharashtra.geojson",
  manipur: "/maps/states/manipur.geojson",
  meghalaya: "/maps/states/meghalaya.geojson",
  mizoram: "/maps/states/mizoram.geojson",
  nagaland: "/maps/states/nagaland.geojson",
  odisha: "/maps/states/odisha.geojson",
  punjab: "/maps/states/punjab.geojson",
  rajasthan: "/maps/states/rajasthan.geojson",
  sikkim: "/maps/states/sikkim.geojson",
  "tamil-nadu": "/maps/states/tamil-nadu.geojson",
  telangana: "/maps/states/telangana.geojson",
  tripura: "/maps/states/tripura.geojson",
  uttarakhand: "/maps/states/uttarakhand.geojson",
  "uttar-pradesh": "/maps/states/uttar-pradesh.geojson",
  "west-bengal": "/maps/states/west-bengal.geojson",
  "andaman-and-nicobar-islands":
    "/maps/states/andaman-and-nicobar-islands.geojson",
  chandigarh: "/maps/states/chandigarh.geojson",
  "dadra-and-nagar-haveli-and-daman-and-diu":
    "/maps/states/dadra-and-nagar-haveli-and-daman-and-diu.geojson",
  delhi: "/maps/states/delhi.geojson",
  "jammu-and-kashmir": "/maps/states/jammu-and-kashmir.geojson",
  ladakh: "/maps/states/ladakh.geojson",
  lakshadweep: "/maps/states/lakshadweep.geojson",
  puducherry: "/maps/states/puducherry.geojson",
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function getGeoName(
  properties: Record<string, any>,
  india: boolean
) {
  if (india) {
    return String(
      properties.st_nm ??
        properties.ST_NM ??
        properties.name ??
        properties.NAME_1 ??
        properties.NAME ??
        ""
    ).trim();
  }

  return String(
    properties.district ??
      properties.DISTRICT ??
      properties.name ??
      properties.NAME_2 ??
      properties.NAME ??
      ""
  ).trim();
}

function getCenter(
  geoData: any,
  fallback: [number, number]
): [number, number] {
  try {
    const center = geoCentroid(geoData);

    if (
      Array.isArray(center) &&
      Number.isFinite(center[0]) &&
      Number.isFinite(center[1])
    ) {
      return [center[0], center[1]];
    }
  } catch {}

  return fallback;
}

function getScale(
  geoData: any,
  india: boolean
) {
  if (india) return 1050;

  try {
    const features = geoData?.features ?? [];

    if (!features.length) return 3000;

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    features.forEach((feature: any) => {
      try {
        const center = geoCentroid(feature);

        minX = Math.min(minX, center[0]);
        maxX = Math.max(maxX, center[0]);
        minY = Math.min(minY, center[1]);
        maxY = Math.max(maxY, center[1]);
      } catch {}
    });

    const size = Math.max(
      maxX - minX,
      maxY - minY
    );

    if (size > 10) return 1800;
    if (size > 7) return 2200;
    if (size > 4) return 3000;
    if (size > 2) return 4200;

    return 5500;
  } catch {
    return 3000;
  }
}

export default function HeritageMap() {
  const [states, setStates] = useState<State[]>([]);
  const [loading, setLoading] = useState(true);

  const [level, setLevel] =
    useState<"india" | "state">("india");

  const [selectedState, setSelectedState] =
    useState<State | null>(null);

  const [selectedDistrict, setSelectedDistrict] =
    useState<District | null>(null);

  const [geoData, setGeoData] = useState<any>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  const [hoveredName, setHoveredName] =
    useState<string | null>(null);

  const [hoveredCoordinates, setHoveredCoordinates] =
    useState<[number, number] | null>(null);

  const [searchQuery, setSearchQuery] =
    useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch("/api/map");

        if (!response.ok) {
          throw new Error("Failed to load map API");
        }

        const data = await response.json();
        setStates(data);
      } catch (error) {
        console.error("Map API error:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  useEffect(() => {
    async function loadIndia() {
      setGeoLoading(true);

      try {
        const response = await fetch(INDIA_MAP);

        if (!response.ok) {
          throw new Error("Failed to load India map");
        }

        const data = await response.json();
        setGeoData(data);
      } catch (error) {
        console.error("India map error:", error);
      } finally {
        setGeoLoading(false);
      }
    }

    loadIndia();
  }, []);

  async function openState(state: State) {
    setSearchQuery("");
    setSelectedState(state);
    setSelectedDistrict(null);
    setLevel("state");

    setHoveredName(null);
    setHoveredCoordinates(null);

    setGeoLoading(true);

    try {
      const mapUrl = STATE_MAPS[state.slug];

      if (!mapUrl) {
        throw new Error(
          `No GeoJSON available for ${state.slug}`
        );
      }

      const response = await fetch(mapUrl);

      if (!response.ok) {
        throw new Error(
          `Failed to load ${state.name} map`
        );
      }

      const data = await response.json();
      setGeoData(data);
    } catch (error) {
      console.error("State map error:", error);
      setGeoData(null);
    } finally {
      setGeoLoading(false);
    }
  }

  async function goIndia() {
    setSearchQuery("");
    setLevel("india");
    setSelectedState(null);
    setSelectedDistrict(null);

    setHoveredName(null);
    setHoveredCoordinates(null);

    setGeoLoading(true);

    try {
      const response = await fetch(INDIA_MAP);

      if (!response.ok) {
        throw new Error("Failed to load India map");
      }

      const data = await response.json();
      setGeoData(data);
    } catch (error) {
      console.error("India map error:", error);
    } finally {
      setGeoLoading(false);
    }
  }

  function handleHover(geography: any) {
    const name = getGeoName(
      geography.properties ?? {},
      level === "india"
    );

    if (!name) return;

    setHoveredName(name);

    try {
      const center = geoCentroid(geography);

      if (
        Array.isArray(center) &&
        Number.isFinite(center[0]) &&
        Number.isFinite(center[1])
      ) {
        setHoveredCoordinates([
          center[0],
          center[1],
        ]);
      }
    } catch {
      setHoveredCoordinates(null);
    }
  }

  function handleLeave() {
    setHoveredName(null);
    setHoveredCoordinates(null);
  }

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return [];

    if (level === "india") {
      return states
        .filter((state) =>
          state.name.toLowerCase().includes(query)
        )
        .slice(0, 8)
        .map((state) => ({
          type: "state" as const,
          state,
        }));
    }

    if (!selectedState) return [];

    return selectedState.districts
      .filter((district) =>
        district.name
          .toLowerCase()
          .includes(query)
      )
      .slice(0, 8)
      .map((district) => ({
        type: "district" as const,
        district,
      }));
  }, [
    searchQuery,
    level,
    states,
    selectedState,
  ]);

  const center = useMemo<[number, number]>(() => {
    if (!geoData) {
      return [78.9629, 22.5937];
    }

    return getCenter(
      geoData,
      [78.9629, 22.5937]
    );
  }, [geoData]);

  const scale = useMemo(() => {
    if (!geoData) return 1050;

    return getScale(
      geoData,
      level === "india"
    );
  }, [geoData, level]);

  const totalDistricts = states.reduce(
    (sum, state) =>
      sum + state.districts.length,
    0
  );

  const totalHeritage = states.reduce(
    (sum, state) =>
      sum +
      state.districts.reduce(
        (districtSum, district) =>
          districtSum +
          district.heritage.length,
        0
      ),
    0
  );

  if (loading) {
    return (
      <section className="min-h-[700px] bg-[#071014] px-6 py-24 text-white">
        <div className="mx-auto max-w-7xl animate-pulse">
          <div className="mb-6 h-8 w-72 rounded bg-white/10" />
          <div className="h-[560px] rounded-3xl bg-white/5" />
        </div>
      </section>
    );
  }

  return (
    <section
      id="heritage-map"
      className="relative overflow-hidden bg-[#071014] px-4 py-20 text-white sm:px-6 lg:px-8"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.04),transparent_30%)]" />

      <div className="relative mx-auto max-w-7xl">
        {/* HEADER */}

        <div className="mb-8">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium uppercase tracking-[0.25em] text-emerald-400">
            <Sparkles className="h-4 w-4" />
            Living Heritage Atlas
          </div>

          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            Explore India&apos;s Heritage
          </h2>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/60 sm:text-base">
            Explore India state by state and discover
            the cultural traditions, stories and heritage
            preserved across its districts.
          </p>
        </div>

        {/* BREADCRUMB */}

        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-white/60">
          <button
            onClick={goIndia}
            className={
              level === "india"
                ? "text-white"
                : "hover:text-white"
            }
          >
            India
          </button>

          {selectedState && (
            <>
              <ChevronRight className="h-4 w-4" />

              <button
                onClick={() =>
                  openState(selectedState)
                }
                className={
                  !selectedDistrict
                    ? "text-white"
                    : "hover:text-white"
                }
              >
                {selectedState.name}
              </button>
            </>
          )}

          {selectedDistrict && (
            <>
              <ChevronRight className="h-4 w-4" />

              <span className="text-white">
                {selectedDistrict.name}
              </span>
            </>
          )}
        </div>

        {/* =====================================================
            INDIA VIEW
        ===================================================== */}

        {level === "india" && (
          <div className="grid overflow-hidden rounded-3xl border border-white/10 bg-[#0b151a] shadow-2xl lg:grid-cols-[1fr_350px]">

            {/* INDIA MAP */}

            <div className="relative min-h-[650px] border-b border-white/10 lg:border-b-0 lg:border-r">

              {/* SEARCH */}

              <div className="absolute right-5 top-5 z-40 w-[280px] sm:w-[350px]">
                <div className="flex items-center rounded-2xl border border-black/20 bg-white px-4 py-3 shadow-2xl">
                  <Search className="mr-3 h-5 w-5 shrink-0 text-black/50" />

                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) =>
                      setSearchQuery(
                        event.target.value
                      )
                    }
                    placeholder="Search a state..."
                    className="w-full bg-transparent text-sm text-black outline-none placeholder:text-black/40"
                  />
                </div>

                {searchQuery.trim() &&
                  searchResults.length > 0 && (
                    <div className="mt-2 overflow-hidden rounded-2xl border border-white/10 bg-[#10191d]/95 p-2 shadow-2xl backdrop-blur-xl">
                      {searchResults.map(
                        (result: any) => (
                          <button
                            key={result.state.id}
                            onClick={() => {
                              openState(
                                result.state
                              );
                            }}
                            className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition hover:bg-white/10"
                          >
                            <div>
                              <div className="text-sm font-medium text-white">
                                {result.state.name}
                              </div>

                              <div className="mt-1 text-xs text-white/40">
                                {
                                  result.state
                                    .districts
                                    .length
                                }{" "}
                                districts
                              </div>
                            </div>

                            <ChevronRight className="h-4 w-4 text-white/30" />
                          </button>
                        )
                      )}
                    </div>
                  )}

                {searchQuery.trim() &&
                  searchResults.length === 0 && (
                    <div className="mt-2 rounded-2xl border border-white/10 bg-[#10191d]/95 px-4 py-4 text-sm text-white/50 shadow-2xl backdrop-blur-xl">
                      No state found
                    </div>
                  )}
              </div>

              {/* MAP LABEL */}

              <div className="absolute left-5 top-5 z-20 rounded-full border border-white/10 bg-black/70 px-4 py-2 text-xs text-white/70 backdrop-blur-md">
                India · States & Union Territories
              </div>

              {geoLoading && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#071014]/80 backdrop-blur-sm">
                  <div className="rounded-2xl border border-white/10 bg-black/70 px-6 py-4 text-sm text-white/70">
                    Loading map...
                  </div>
                </div>
              )}

              {geoData && !geoLoading && (
                <ComposableMap
                  projection="geoMercator"
                  projectionConfig={{
                    center,
                    scale,
                  }}
                  width={1000}
                  height={700}
                  className="virasat-map h-full min-h-[650px] w-full"
                >
                  <ZoomableGroup
                    center={center}
                    zoom={1}
                    minZoom={0.8}
                    maxZoom={4}
                  >
                    <Geographies geography={geoData}>
                      {({ geographies }) =>
                        geographies.map(
                          (geography: any) => {
                            const name =
                              getGeoName(
                                geography.properties ??
                                  {},
                                true
                              );

                            const stateMatch =
                              states.find(
                                (state) =>
                                  slugify(
                                    state.name
                                  ) ===
                                  slugify(name)
                              );

                            return (
                              <g
                                key={
                                  geography.rsmKey
                                }
                              >
                                <Geography
                                  geography={
                                    geography
                                  }
                                  onMouseEnter={() =>
                                    handleHover(
                                      geography
                                    )
                                  }
                                  onMouseLeave={
                                    handleLeave
                                  }
                                  onClick={() => {
                                    if (
                                      stateMatch
                                    ) {
                                      openState(
                                        stateMatch
                                      );
                                    }
                                  }}
                                  style={{
                                    fill:
                                      selectedState?.name === geography.properties.st_nm
                                        ? "#111111"
                                        : "#FFFFFF",
                                    stroke: "#000000",
                                    strokeWidth: 0.8,
                                  }}
                                  />
                                {hoveredName ===
                                  name &&
                                  hoveredCoordinates && (
                                    <Marker
                                      coordinates={
                                        hoveredCoordinates
                                      }
                                    >
                                      <g pointerEvents="none">
                                        <rect
                                          x={-Math.max(
                                            38,
                                            name.length *
                                              4
                                          )}
                                          y={-25}
                                          width={Math.max(
                                            76,
                                            name.length *
                                              8
                                          )}
                                          height={34}
                                          rx={8}
                                          fill="#000000"
                                          stroke="#FFFFFF"
                                          strokeWidth={1}
                                        />

                                        <text
                                          textAnchor="middle"
                                          y={-3}
                                          style={{
                                            fontFamily:
                                              "system-ui, sans-serif",
                                            fontSize: 11,
                                            fontWeight: 700,
                                            fill: "#FFFFFF",
                                          }}
                                        >
                                          {name}
                                        </text>
                                      </g>
                                    </Marker>
                                  )}
                              </g>
                            );
                          }
                        )
                      }
                    </Geographies>
                  </ZoomableGroup>
                </ComposableMap>
              )}

              <div className="absolute bottom-5 left-5 rounded-xl border border-white/10 bg-black/60 px-4 py-3 text-xs text-white/60 backdrop-blur-md">
                Hover to identify · Click to explore
              </div>
            </div>

            {/* INDIA SIDEBAR */}

            <aside className="bg-[#0a1317] p-6">
              <div className="mb-7">
                <div className="mb-2 text-xs uppercase tracking-[0.2em] text-emerald-400">
                  Explore
                </div>

                <h3 className="text-2xl font-semibold">
                  India&apos;s Cultural Landscape
                </h3>

                <p className="mt-3 text-sm leading-6 text-white/50">
                  Select a state on the map or use
                  search to open its district map.
                </p>
              </div>

              <div className="mb-7 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-2xl font-semibold">
                    {states.length}
                  </div>

                  <div className="mt-1 text-xs text-white/40">
                    States / UTs
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-2xl font-semibold">
                    {totalDistricts}
                  </div>

                  <div className="mt-1 text-xs text-white/40">
                    Districts
                  </div>
                </div>

                <div className="col-span-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-2xl font-semibold">
                    {totalHeritage}
                  </div>

                  <div className="mt-1 text-xs text-white/40">
                    Heritage records
                  </div>
                </div>
              </div>

              <h4 className="mb-3 text-sm font-semibold">
                States & Territories
              </h4>

              <div className="max-h-[380px] space-y-2 overflow-y-auto pr-1">
                {states.map((state) => (
                  <button
                    key={state.id}
                    onClick={() =>
                      openState(state)
                    }
                    className="group flex w-full items-center justify-between rounded-xl border border-white/5 bg-white/[0.025] px-4 py-3 text-left transition hover:border-white/20 hover:bg-white/[0.06]"
                  >
                    <div>
                      <div className="text-sm font-medium text-white/85 group-hover:text-white">
                        {state.name}
                      </div>

                      <div className="mt-1 text-xs text-white/35">
                        {state.districts.length}{" "}
                        districts
                      </div>
                    </div>

                    <ChevronRight className="h-4 w-4 text-white/20 transition group-hover:translate-x-1 group-hover:text-white" />
                  </button>
                ))}
              </div>
            </aside>
          </div>
        )}

        {/* =====================================================
            STATE VIEW
        ===================================================== */}

        {level === "state" && (
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#0b151a] shadow-2xl">

            <div className="relative min-h-[760px] w-full">

              {/* BACK + STATE INFORMATION */}

              <div className="absolute left-6 top-6 z-30">
                <button
                  onClick={goIndia}
                  className="mb-4 flex items-center gap-2 rounded-xl border border-white/10 bg-black/75 px-4 py-2 text-sm text-white/70 backdrop-blur-md transition hover:border-white/30 hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to India
                </button>

                <div className="rounded-2xl border border-white/10 bg-black/75 px-5 py-4 backdrop-blur-xl">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-emerald-400">
                    <MapPin className="h-3.5 w-3.5" />
                    State Map
                  </div>

                  <h3 className="mt-1 text-2xl font-semibold">
                    {selectedState?.name}
                  </h3>

                  <p className="mt-1 text-xs text-white/45">
                    {selectedState?.districts.length ??
                      0}{" "}
                    districts
                  </p>
                </div>
              </div>

              {/* DISTRICT SEARCH */}

              <div className="absolute right-6 top-6 z-40 w-[280px] sm:w-[350px]">
                <div className="flex items-center rounded-2xl border border-black/20 bg-white px-4 py-3 shadow-2xl">
                  <Search className="mr-3 h-5 w-5 shrink-0 text-black/50" />

                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) =>
                      setSearchQuery(
                        event.target.value
                      )
                    }
                    placeholder="Search a district..."
                    className="w-full bg-transparent text-sm text-black outline-none placeholder:text-black/40"
                  />
                </div>

                {searchQuery.trim() &&
                  searchResults.length > 0 && (
                    <div className="mt-2 overflow-hidden rounded-2xl border border-white/10 bg-[#10191d]/95 p-2 shadow-2xl backdrop-blur-xl">
                      {searchResults.map(
                        (result: any) => (
                          <button
                            key={
                              result.district.id
                            }
                            onClick={() => {
                              setSelectedDistrict(
                                result.district
                              );
                              setSearchQuery("");
                            }}
                            className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition hover:bg-white/10"
                          >
                            <div>
                              <div className="text-sm font-medium text-white">
                                {
                                  result
                                    .district
                                    .name
                                }
                              </div>

                              <div className="mt-1 text-xs text-white/40">
                                {
                                  result
                                    .district
                                    .heritage
                                    .length
                                }{" "}
                                heritage records
                              </div>
                            </div>

                            <ChevronRight className="h-4 w-4 text-white/30" />
                          </button>
                        )
                      )}
                    </div>
                  )}

                {searchQuery.trim() &&
                  searchResults.length === 0 && (
                    <div className="mt-2 rounded-2xl border border-white/10 bg-[#10191d]/95 px-4 py-4 text-sm text-white/50 shadow-2xl backdrop-blur-xl">
                      No district found
                    </div>
                  )}
              </div>

              {/* STATE MAP */}

              {geoLoading && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#071014]/80 backdrop-blur-sm">
                  <div className="rounded-2xl border border-white/10 bg-black/70 px-6 py-4 text-sm text-white/70">
                    Loading{" "}
                    {selectedState?.name} map...
                  </div>
                </div>
              )}

              {geoData && !geoLoading && (
                <ComposableMap
                  projection="geoMercator"
                  projectionConfig={{
                    center,
                    scale,
                  }}
                  width={1400}
                  height={800}
                  className="virasat-map h-[760px] w-full"
                >
                  <ZoomableGroup
                    center={center}
                    zoom={1}
                    minZoom={0.8}
                    maxZoom={5}
                  >
                    <Geographies geography={geoData}>
                      {({ geographies }) =>
                        geographies.map(
                          (geography: any) => {
                            const name =
                              getGeoName(
                                geography.properties ??
                                  {},
                                false
                              );

                            const districtMatch =
                              selectedState?.districts.find(
                                (district) =>
                                  slugify(
                                    district.name
                                  ) ===
                                  slugify(name)
                              );

                            const isSelected =
                              selectedDistrict?.id ===
                              districtMatch?.id;

                            return (
                              <g
                                key={
                                  geography.rsmKey
                                }
                              >
                                <Geography
                                  geography={
                                    geography
                                  }
                                  onMouseEnter={() =>
                                    handleHover(
                                      geography
                                    )
                                  }
                                  onMouseLeave={
                                    handleLeave
                                  }
                                  onClick={() => {
                                    if (
                                      districtMatch
                                    ) {
                                      setSelectedDistrict(
                                        districtMatch
                                      );
                                    }
                                  }}
                                  style={{
                                    fill:
                                      selectedState?.name === geography.properties.st_nm
                                        ? "#111111"
                                        : "#FFFFFF",
                                    stroke: "#000000",
                                    strokeWidth: 0.8,
                                  }}
                                  />

                                {hoveredName ===
                                  name &&
                                  hoveredCoordinates && (
                                    <Marker
                                      coordinates={
                                        hoveredCoordinates
                                      }
                                    >
                                      <g pointerEvents="none">
                                        <rect
                                          x={-Math.max(
                                            38,
                                            name.length *
                                              4
                                          )}
                                          y={-25}
                                          width={Math.max(
                                            76,
                                            name.length *
                                              8
                                          )}
                                          height={34}
                                          rx={8}
                                          fill="#000000"
                                          stroke="#FFFFFF"
                                          strokeWidth={1}
                                        />

                                        <text
                                          textAnchor="middle"
                                          y={-3}
                                          style={{
                                            fontFamily:
                                              "system-ui, sans-serif",
                                            fontSize: 10,
                                            fontWeight: 700,
                                            fill: "#FFFFFF",
                                          }}
                                        >
                                          {name}
                                        </text>
                                      </g>
                                    </Marker>
                                  )}
                              </g>
                            );
                          }
                        )
                      }
                    </Geographies>
                  </ZoomableGroup>
                </ComposableMap>
              )}

              {/* SELECTED DISTRICT */}

              {selectedDistrict && (
                <div className="absolute bottom-6 right-6 z-30 w-[310px] rounded-2xl border border-white/10 bg-black/85 p-5 backdrop-blur-xl">
                  <div className="mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-emerald-400" />

                    <span className="text-sm font-semibold">
                      {selectedDistrict.name}
                    </span>
                  </div>

                  <div className="mb-4 text-xs text-white/40">
                    {
                      selectedDistrict.heritage
                        .length
                    }{" "}
                    heritage records
                  </div>

                  {selectedDistrict.heritage
                    .length > 0 && (
                    <div className="space-y-2">
                      {selectedDistrict.heritage
                        .slice(0, 4)
                        .map((item) => (
                          <Link
                            key={item.id}
                            href={`/heritage/${item.slug}`}
                            className="block rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 transition hover:border-white/30 hover:bg-white/[0.08]"
                          >
                            <div className="text-sm text-white/85">
                              {item.name}
                            </div>

                            {item.category?.name && (
                              <div className="mt-1 text-xs text-white/35">
                                {
                                  item.category
                                    .name
                                }
                              </div>
                            )}
                          </Link>
                        ))}
                    </div>
                  )}
                </div>
              )}

              <div className="absolute bottom-6 left-6 z-20 rounded-xl border border-white/10 bg-black/60 px-4 py-3 text-xs text-white/60 backdrop-blur-md">
                Hover to identify · Click to select
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}


