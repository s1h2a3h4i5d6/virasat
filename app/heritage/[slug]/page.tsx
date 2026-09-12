import HeritageActions from "@/components/heritage/HeritageActions";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileText,
  Headphones,
  Image as ImageIcon,
  MapPin,
  ShieldCheck,
  Sparkles,
  UserRound,
  Video,
} from "lucide-react";

import { prisma } from "@/lib/db/prisma";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function HeritageProfile({ params }: PageProps) {
  const { slug } = await params;

  const heritage = await prisma.heritage.findUnique({
    where: { slug },
    include: {
      state: true,
      district: true,
      category: true,
      media: true,
    },
  });

  if (!heritage) {
    notFound();
  }

  const related = await prisma.heritage.findMany({
    where: {
      id: { not: heritage.id },
      categoryId: heritage.categoryId || undefined,
      stateId: heritage.stateId || undefined,
    },
    orderBy: { name: "asc" },
    take: 4,
    include: {
      state: true,
      district: true,
      category: true,
      media: true,
    },
  });

  const photos = heritage.media.filter((item) => {
    const type = item.type.toLowerCase();
    return type === "image" || type === "photo";
  });

  const videos = heritage.media.filter(
    (item) => item.type.toLowerCase() === "video"
  );

  const audio = heritage.media.filter(
    (item) => item.type.toLowerCase() === "audio"
  );

  const documents = heritage.media.filter((item) => {
    const type = item.type.toLowerCase();
    return type === "document" || type === "pdf";
  });

  const sections = [
    ["overview", "Overview"],
    ["story", "Story"],
    ["history", "History"],
    ["origin", "Origin"],
    ["significance", "Cultural Significance"],
    ["language", "Language & Tradition"],
    ["timeline", "Timeline"],
    ["media", "Media"],
    ["preservation", "Preservation"],
  ];

  return (
    <main className="min-h-screen bg-[#0b0b0b] text-white">

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-950/30 via-black to-black" />

        <div className="relative mx-auto max-w-7xl px-6 pb-16 pt-32 lg:px-8">
          <Link
            href="/explore"
            className="mb-8 inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to Explore
          </Link>

          <div className="grid gap-10 lg:grid-cols-[1fr_360px] lg:items-end">

            <div>
              {heritage.category && (
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-4 py-2 text-sm text-amber-300">
                  <Sparkles size={15} />
                  {heritage.category.name}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                  {heritage.name}
                </h1>

                {heritage.verified && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1.5 text-xs font-medium text-emerald-300">
                    <CheckCircle2 size={14} />
                    Verified
                  </span>
                )}
              </div>

              {heritage.shortDescription && (
                <p className="mt-6 max-w-3xl text-lg leading-8 text-white/65">
                  {heritage.shortDescription}
                </p>
              )}

              <div className="mt-7 flex flex-wrap gap-3">
                {(heritage.state || heritage.district) && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
                    <MapPin size={15} />
                    {[heritage.district?.name, heritage.state?.name]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                )}

                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
                  <ShieldCheck size={15} />
                  {heritage.preservationStatus}
                </span>
              </div>

              <div className="mt-6">
                <HeritageActions heritageId={heritage.id} />
              </div>
            </div>

            <aside className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                Heritage Record
              </p>

              <div className="mt-5 space-y-5">
                <InfoRow
                  title="Category"
                  value={heritage.category?.name || "Not specified"}
                />

                <InfoRow
                  title="State"
                  value={heritage.state?.name || "Not specified"}
                />

                <InfoRow
                  title="District"
                  value={heritage.district?.name || "Not specified"}
                />

                <InfoRow
                  title="Preservation"
                  value={heritage.preservationStatus}
                />
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* SECTION NAVIGATION */}
      <div className="sticky top-0 z-30 border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl gap-5 overflow-x-auto px-6 py-4 lg:px-8">
          {sections.map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              className="whitespace-nowrap text-sm text-white/50 transition hover:text-white"
            >
              {label}
            </a>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid gap-14 lg:grid-cols-[1fr_280px]">

          <div className="min-w-0 space-y-16">

            {/* OVERVIEW */}
            <section id="overview">
              <SectionTitle
                title="Overview"
                icon={<Sparkles size={18} />}
              />

              <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-7">
                <p className="whitespace-pre-line text-base leading-8 text-white/70">
                  {heritage.description ||
                    "Detailed information about this heritage record will be added to the Virasat knowledge base."}
                </p>
              </div>
            </section>

            {/* STORY */}
            {heritage.story && (
              <section id="story">
                <SectionTitle
                  title="Story"
                  icon={<FileText size={18} />}
                />

                <div className="mt-6 rounded-3xl border border-amber-400/10 bg-amber-400/[0.04] p-7">
                  <p className="whitespace-pre-line text-base leading-8 text-white/70">
                    {heritage.story}
                  </p>
                </div>
              </section>
            )}

            {/* HISTORY */}
            {heritage.history && (
              <section id="history">
                <SectionTitle
                  title="History"
                  icon={<Clock3 size={18} />}
                />

                <div className="mt-6">
                  <p className="whitespace-pre-line text-base leading-8 text-white/70">
                    {heritage.history}
                  </p>
                </div>
              </section>
            )}

            {/* ORIGIN */}
            {heritage.origin && (
              <section id="origin">
                <SectionTitle
                  title="Origin"
                  icon={<MapPin size={18} />}
                />

                <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-7">
                  <p className="whitespace-pre-line text-base leading-8 text-white/70">
                    {heritage.origin}
                  </p>
                </div>
              </section>
            )}

            {/* CULTURAL SIGNIFICANCE */}
            {heritage.significance && (
              <section id="significance">
                <SectionTitle
                  title="Cultural Significance"
                  icon={<Sparkles size={18} />}
                />

                <div className="mt-6">
                  <p className="whitespace-pre-line text-base leading-8 text-white/70">
                    {heritage.significance}
                  </p>
                </div>
              </section>
            )}

            {/* LANGUAGE & TRADITION */}
            {(heritage.language ||
              heritage.regions ||
              heritage.practitioners ||
              heritage.festivals) && (
              <section id="language">
                <SectionTitle
                  title="Language & Tradition"
                  icon={<UserRound size={18} />}
                />

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <InfoCard
                    title="Language"
                    value={heritage.language}
                  />

                  <InfoCard
                    title="Regions"
                    value={heritage.regions}
                  />

                  <InfoCard
                    title="Practitioners"
                    value={heritage.practitioners}
                  />

                  <InfoCard
                    title="Festivals & Occasions"
                    value={heritage.festivals}
                  />
                </div>
              </section>
            )}

            {/* TIMELINE */}
            {heritage.timeline && (
              <section id="timeline">
                <SectionTitle
                  title="Timeline"
                  icon={<Clock3 size={18} />}
                />

                <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-7">
                  <p className="whitespace-pre-line text-base leading-8 text-white/70">
                    {heritage.timeline}
                  </p>
                </div>
              </section>
            )}

            {/* MEDIA */}
            <section id="media">
              <SectionTitle
                title="Media"
                icon={<ImageIcon size={18} />}
              />

              {heritage.media.length === 0 ? (
                <div className="mt-6 rounded-3xl border border-dashed border-white/15 bg-white/[0.02] p-10 text-center">
                  <ImageIcon
                    className="mx-auto text-white/30"
                    size={32}
                  />

                  <p className="mt-4 text-sm text-white/40">
                    Media will be added to this heritage record.
                  </p>
                </div>
              ) : (
                <div className="mt-6 space-y-10">

                  {/* PHOTOS */}
                  {photos.length > 0 && (
                    <MediaGroup
                      title="Photos"
                      icon={<ImageIcon size={17} />}
                    >
                      <div className="grid gap-5 sm:grid-cols-2">
                        {photos.map((item) => (
                          <div
                            key={item.id}
                            className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]"
                          >
                            <img
                              src={item.url}
                              alt={item.title || heritage.name}
                              className="aspect-video w-full object-cover"
                            />

                            {item.title && (
                              <div className="p-4 text-sm text-white/60">
                                {item.title}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </MediaGroup>
                  )}

                  {/* VIDEOS */}
                  {videos.length > 0 && (
                    <MediaGroup
                      title="Videos"
                      icon={<Video size={17} />}
                    >
                      <div className="grid gap-5">
                        {videos.map((item) => (
                          <div
                            key={item.id}
                            className="overflow-hidden rounded-3xl border border-white/10 bg-black"
                          >
                            <video
                              controls
                              className="aspect-video w-full"
                              src={item.url}
                            />

                            {item.title && (
                              <div className="p-4 text-sm text-white/60">
                                {item.title}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </MediaGroup>
                  )}

                  {/* AUDIO */}
                  {audio.length > 0 && (
                    <MediaGroup
                      title="Audio"
                      icon={<Headphones size={17} />}
                    >
                      <div className="space-y-4">
                        {audio.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                          >
                            {item.title && (
                              <p className="mb-3 text-sm text-white/70">
                                {item.title}
                              </p>
                            )}

                            <audio
                              controls
                              className="w-full"
                              src={item.url}
                            />
                          </div>
                        ))}
                      </div>
                    </MediaGroup>
                  )}

                  {/* DOCUMENTS */}
                  {documents.length > 0 && (
                    <MediaGroup
                      title="Documents"
                      icon={<FileText size={17} />}
                    >
                      <div className="grid gap-3">
                        {documents.map((item) => (
                          <a
                            key={item.id}
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:bg-white/[0.06]"
                          >
                            <div className="flex items-center gap-3">
                              <FileText
                                size={18}
                                className="text-white/50"
                              />

                              <span className="text-sm text-white/70">
                                {item.title || "Heritage document"}
                              </span>
                            </div>

                            <ArrowRight
                              size={17}
                              className="text-white/40"
                            />
                          </a>
                        ))}
                      </div>
                    </MediaGroup>
                  )}
                </div>
              )}
            </section>

            {/* PRESERVATION */}
            <section id="preservation">
              <SectionTitle
                title="Preservation"
                icon={<ShieldCheck size={18} />}
              />

              <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-7">

                <div className="flex flex-wrap items-center justify-between gap-5">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-white/35">
                      Current status
                    </p>

                    <p className="mt-2 text-2xl font-medium">
                      {heritage.preservationStatus}
                    </p>
                  </div>

                  {heritage.verified && (
                    <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
                      <CheckCircle2 size={16} />
                      Verified record
                    </div>
                  )}
                </div>

                <p className="mt-6 text-sm leading-7 text-white/50">
                  Virasat records preservation status so communities,
                  researchers and visitors can better understand the
                  current condition and continuity of India&apos;s
                  living heritage.
                </p>
              </div>
            </section>

            {/* RELATED HERITAGE */}
            {related.length > 0 && (
              <section>
                <SectionTitle
                  title="Related Heritage"
                  icon={<ArrowRight size={18} />}
                />

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  {related.map((item) => {
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
                        className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] transition hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.06]"
                      >
                        <div className="relative h-44 w-full overflow-hidden bg-white/5">
                          {thumbnail ? (
                            <img
                              src={thumbnail}
                              alt={item.name}
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center bg-white/[0.02]">
                              <span className="text-xs uppercase tracking-wider text-white/30">
                                {item.category?.name || "Virasat Heritage"}
                              </span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                          <div className="absolute left-4 top-4">
                            <span className="rounded-full border border-white/15 bg-black/60 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-md">
                              {item.category?.name || "Heritage"}
                            </span>
                          </div>
                        </div>

                        <div className="p-6">
                          <h3 className="text-xl font-medium text-white transition group-hover:text-amber-200">
                            {item.name}
                          </h3>

                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/45">
                            {item.shortDescription ||
                              "Explore this heritage record on Virasat."}
                          </p>

                          <div className="mt-5 flex items-center gap-2 text-sm text-white/50 transition group-hover:text-white">
                            Explore
                            <ArrowRight size={15} />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

          </div>

          {/* DESKTOP PAGE NAVIGATION */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-white/35">
                On this page
              </p>

              <nav className="mt-5 space-y-1">
                {sections.map(([id, label]) => (
                  <a
                    key={id}
                    href={`#${id}`}
                    className="block rounded-xl px-3 py-2.5 text-sm text-white/50 transition hover:bg-white/5 hover:text-white"
                  >
                    {label}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

        </div>
      </div>
    </main>
  );
}

function SectionTitle({
  title,
  icon,
}: {
  title: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-400/15 bg-amber-400/10 text-amber-300">
        {icon}
      </div>

      <h2 className="text-2xl font-medium tracking-tight">
        {title}
      </h2>
    </div>
  );
}

function InfoRow({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs text-white/40">{title}</p>
      <p className="mt-1 text-sm text-white/80">{value}</p>
    </div>
  );
}

function InfoCard({
  title,
  value,
}: {
  title: string;
  value: string | null | undefined;
}) {
  if (!value) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <p className="text-xs uppercase tracking-[0.15em] text-white/35">
        {title}
      </p>

      <p className="mt-3 whitespace-pre-line text-sm leading-6 text-white/65">
        {value}
      </p>
    </div>
  );
}

function MediaGroup({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 text-sm font-medium text-white/70">
        {icon}
        {title}
      </div>

      <div className="mt-4">{children}</div>
    </div>
  );
}

