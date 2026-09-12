"use client";

import Link from "next/link";
import { AlertTriangle, ShieldCheck, ShieldAlert, ArrowUpRight } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

type HeritageItem = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  preservationStatus: "STABLE" | "VULNERABLE" | "ENDANGERED" | "CRITICAL";
  state: { name: string } | null;
  district: { name: string } | null;
  category?: { name: string; imageUrl?: string | null } | null;
  media?: { url: string; type?: string | null }[];
};

const statusConfig = {
  STABLE: {
    label: "Stable",
    icon: ShieldCheck,
    description: "Currently stable and actively preserved.",
  },
  VULNERABLE: {
    label: "Vulnerable",
    icon: AlertTriangle,
    description: "Requires continued documentation and protection.",
  },
  ENDANGERED: {
    label: "Endangered",
    icon: ShieldAlert,
    description: "At risk of cultural loss without intervention.",
  },
  CRITICAL: {
    label: "Critical",
    icon: ShieldAlert,
    description: "Urgent preservation and documentation required.",
  },
};

export default function PreservationSection({
  heritage,
}: {
  heritage: HeritageItem[];
}) {
  const { t } = useLanguage();

  const grouped = {
    VULNERABLE: heritage.filter(
      (item) => item.preservationStatus === "VULNERABLE"
    ),
    ENDANGERED: heritage.filter(
      (item) => item.preservationStatus === "ENDANGERED"
    ),
    CRITICAL: heritage.filter(
      (item) => item.preservationStatus === "CRITICAL"
    ),
  };

  const items = [
    ...grouped.CRITICAL,
    ...grouped.ENDANGERED,
    ...grouped.VULNERABLE,
  ].slice(0, 6);

  return (
    <section className="bg-[#0b0b0b] px-6 pb-24 text-white md:px-10">
      <div className="mx-auto max-w-7xl border-t border-white/10 pt-20">
        <div className="mb-12 max-w-3xl">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.4em] text-white/35">
            {t("Preservation Watch")}
          </p>

          <h2 className="font-serif text-3xl font-semibold md:text-5xl">
            {t("Heritage that needs our attention")}
          </h2>

          <p className="mt-5 max-w-2xl text-sm leading-7 text-white/45 md:text-base">
            {t(
              "Virasat helps identify traditions and cultural heritage that may require stronger documentation, awareness and preservation."
            )}
          </p>
        </div>

        {items.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-10 text-center">
            <ShieldCheck className="mx-auto mb-4 text-white/40" size={32} />

            <h3 className="font-serif text-2xl">
              {t("No preservation alerts yet")}
            </h3>

            <p className="mt-2 text-sm text-white/40">
              {t("Preservation records will appear here as heritage data is added.")}
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const config = statusConfig[item.preservationStatus];
              const Icon = config.icon;
              const thumbnail =
                item.media?.find(
                  (m) =>
                    m.type?.toLowerCase() === "photo" ||
                    m.type?.toLowerCase() === "image" ||
                    !m.type
                )?.url ||
                item.media?.[0]?.url ||
                item.category?.imageUrl;

              return (
                <Link
                  key={item.id}
                  href={`/heritage/${item.slug}`}
                  className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.06]"
                >
                  <div className="relative h-44 w-full overflow-hidden bg-white/5">
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
                      <div className="flex h-full items-center justify-center bg-white/[0.02]">
                        <Icon size={32} className="text-white/20" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                    <div className="absolute left-4 top-4">
                      <div className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/60 px-3 py-1 text-xs font-medium uppercase tracking-wider text-white/90 backdrop-blur-md">
                        <Icon size={14} className="text-amber-400" />
                        {t(config.label)}
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-serif text-2xl font-medium text-white transition group-hover:text-amber-200">
                        {item.name}
                      </h3>
                      <ArrowUpRight
                        size={18}
                        className="shrink-0 text-white/30 transition group-hover:translate-x-0.5 group-hover:translate-y--0.5 group-hover:text-white"
                      />
                    </div>

                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-white/50">
                      {item.shortDescription || t(config.description)}
                    </p>

                    <div className="mt-6 text-xs text-white/40">
                      {t(item.state?.name) || t("India")}
                      {item.district?.name && ` · ${t(item.district.name)}`}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
