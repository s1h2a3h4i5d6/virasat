"use client";

import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  Landmark,
  PartyPopper,
  Music,
  Compass,
  Utensils,
  Hammer,
  TreePine,
  Languages,
  Swords,
  Flame,
  Shirt,
  Gamepad2,
  Drum,
  Briefcase,
  Users,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

type CategoryItem = {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
};

const iconMap: Record<string, any> = {
  architecture: Landmark,
  festivals: PartyPopper,
  "folk-dance": Sparkles,
  "folk-music": Music,
  "folk-tales": Compass,
  food: Utensils,
  handicrafts: Hammer,
  "indigenous-knowledge": TreePine,
  languages: Languages,
  "martial-arts": Swords,
  rituals: Flame,
  "traditional-clothing": Shirt,
  "traditional-games": Gamepad2,
  "traditional-instruments": Drum,
  "traditional-occupations": Briefcase,
  "tribal-traditions": Users,
};

export default function DiscoverHeritage({
  categories,
}: {
  categories: CategoryItem[];
}) {
  const { t } = useLanguage();

  return (
    <section className="bg-[#0b0b0b] px-6 py-20 text-white md:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.4em] text-white/40">
              {t("Discover India")}
            </p>

            <h2 className="font-serif text-4xl font-semibold tracking-tight md:text-6xl">
              {t("A country.")}
              <br />
              {t("Countless traditions.")}
            </h2>

            <p className="mt-5 max-w-2xl text-base leading-7 text-white/50 md:text-lg">
              {t(
                "Explore India's living heritage through its music, dance, festivals, crafts, stories, architecture and indigenous knowledge."
              )}
            </p>
          </div>

          <Link
            href="/explore"
            className="group inline-flex w-fit items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-sm text-white/70 transition hover:bg-white hover:text-black"
          >
            {t("Explore all")}
            <ArrowUpRight
              size={16}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </div>

        {categories.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-12 text-center">
            <p className="text-white/50">
              {t("Cultural categories are being prepared for the archive.")}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category, index) => {
              const Icon = iconMap[category.slug] || Sparkles;

              return (
                <Link
                  key={category.id}
                  href={`/explore?category=${encodeURIComponent(category.slug)}`}
                  className="group relative min-h-[230px] overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] p-6 transition duration-500 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.07]"
                >
                  {category.imageUrl && (
                    <div
                      className="absolute inset-0 bg-cover bg-center opacity-70 transition duration-700 group-hover:scale-105 group-hover:opacity-85"
                      style={{
                        backgroundImage: `url("${category.imageUrl}")`,
                      }}
                    />
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/15" />

                  <div className="relative z-10 flex h-full flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-black/40 backdrop-blur-md">
                        <Icon
                          size={21}
                          strokeWidth={1.5}
                          className="text-white/90 drop-shadow-sm"
                        />
                      </div>

                      <span className="text-xs font-mono font-medium text-white/60 drop-shadow-sm">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>

                    <div className="mt-8">
                      <h3 className="font-serif text-2xl font-medium tracking-tight text-white drop-shadow-md">
                        {t(category.name)}
                      </h3>

                      <div className="mt-4 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.15em] text-white/70 transition group-hover:text-white drop-shadow">
                        {t("Explore collection")}
                        <ArrowRight
                          size={14}
                          className="transition-transform group-hover:translate-x-1"
                        />
                      </div>
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
