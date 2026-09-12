"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

type HeritageItem = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  state?: { name: string } | null;
  district?: { name: string } | null;
  category?: { name: string; imageUrl?: string | null } | null;
  media?: { url: string; type?: string | null }[];
};

export default function FeaturedArchive({
  heritage,
}: {
  heritage: HeritageItem[];
}) {
  const { t } = useLanguage();

  return (
    <section className="bg-[#0b0b0b] px-6 pb-24 text-white md:px-10">
      <div className="mx-auto max-w-7xl border-t border-white/10 pt-16">
        <div className="mb-10">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.4em] text-white/35">
            {t("Featured Archive")}
          </p>

          <h2 className="font-serif text-3xl font-semibold md:text-5xl">
            {t("Stories worth discovering")}
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {heritage.map((item) => {
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
                <div className="relative h-48 w-full overflow-hidden bg-white/5">
                  {thumbnail ? (
                    <img
                      src={thumbnail}
                      alt={item.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-white/[0.02]">
                      <span className="text-xs uppercase tracking-wider text-white/30">
                        {t(item.category?.name) || t("Virasat Heritage")}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                  <div className="absolute left-4 top-4">
                    <span className="rounded-full border border-white/15 bg-black/60 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-md">
                      {t(item.category?.name) || t("Heritage")}
                    </span>
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
                    {item.shortDescription ||
                      t("Explore the history, significance and cultural story of this heritage.")}
                  </p>

                  <div className="mt-6 flex items-center gap-2 text-xs text-white/40">
                    <span>{t(item.state?.name)}</span>
                    {item.district?.name && <span>· {t(item.district.name)}</span>}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
