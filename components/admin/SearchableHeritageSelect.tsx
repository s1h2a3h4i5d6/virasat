"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";

type Heritage = {
  id: string;
  name: string;
};

type Props = {
  heritage: Heritage[];
  value: string;
  onChange: (id: string) => void;
};

export default function SearchableHeritageSelect({
  heritage,
  value,
  onChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);

  const selectedHeritage = heritage.find(
    (item) => item.id === value
  );

  const filteredHeritage = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return heritage.slice(0, 10);
    }

    return heritage
      .filter((item) =>
        item.name.toLowerCase().includes(query)
      )
      .slice(0, 10);
  }, [heritage, search]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target as Node
        )
      ) {
        setOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  function selectHeritage(id: string) {
    onChange(id);
    setSearch("");
    setOpen(false);
  }

  function clearSelection() {
    onChange("");
    setSearch("");
  }

  return (
    <div
      ref={containerRef}
      className="relative"
    >
      <div
        className={`flex min-h-[50px] w-full items-center rounded-xl border bg-[#111] transition ${
          open
            ? "border-white/30"
            : "border-white/10"
        }`}
      >
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex min-w-0 flex-1 items-center justify-between px-4 py-3 text-left"
        >
          <span
            className={
              selectedHeritage
                ? "truncate text-white"
                : "text-white/40"
            }
          >
            {selectedHeritage
              ? selectedHeritage.name
              : "No Heritage Selected"}
          </span>

          <ChevronDown
            size={18}
            className={`ml-3 shrink-0 text-white/40 transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>

        {selectedHeritage && (
          <button
            type="button"
            onClick={clearSelection}
            className="mr-2 rounded-lg p-2 text-white/40 hover:bg-white/10 hover:text-white"
            title="Clear heritage"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[100] overflow-hidden rounded-xl border border-white/10 bg-[#151515] shadow-2xl">

          <div className="border-b border-white/10 p-3">
            <div className="flex items-center rounded-lg border border-white/10 bg-white/[0.04] px-3">
              <Search
                size={17}
                className="shrink-0 text-white/40"
              />

              <input
                autoFocus
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search heritage..."
                className="w-full bg-transparent px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30"
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto p-2">

            <button
              type="button"
              onClick={() => selectHeritage("")}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition ${
                !value
                  ? "bg-white/10 text-white"
                  : "text-white/60 hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              <span>
                No Heritage Selected
              </span>

              {!value && (
                <Check size={16} />
              )}
            </button>

            {filteredHeritage.length > 0 ? (
              filteredHeritage.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() =>
                    selectHeritage(item.id)
                  }
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition ${
                    value === item.id
                      ? "bg-white/10 text-white"
                      : "text-white/60 hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  <span className="truncate pr-4">
                    {item.name}
                  </span>

                  {value === item.id && (
                    <Check
                      size={16}
                      className="shrink-0"
                    />
                  )}
                </button>
              ))
            ) : (
              <div className="px-3 py-6 text-center text-sm text-white/35">
                No heritage found.
              </div>
            )}

          </div>

          <div className="border-t border-white/10 px-3 py-2 text-xs text-white/30">
            {search.trim()
              ? `Showing ${filteredHeritage.length} matching records`
              : `Showing first ${Math.min(
                  10,
                  heritage.length
                )} records`}
          </div>

        </div>
      )}

      {heritage.length === 0 && (
        <p className="mt-2 text-xs text-yellow-400/70">
          No heritage records were loaded.
        </p>
      )}

      {heritage.length > 0 && (
        <p className="mt-2 text-xs text-white/30">
          {heritage.length} heritage records available
        </p>
      )}
    </div>
  );
}
