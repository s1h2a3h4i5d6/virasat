import { prisma } from "@/lib/db/prisma";
import MediaArchiveView, {
  UnifiedMediaItem,
} from "@/components/media/MediaArchiveView";

export default async function MediaArchivePage() {
  const [photosMedia, homepageVideos, oralHistories, books, aiDocs] =
    await Promise.all([
      // 1. Photos and uploaded media records
      prisma.media.findMany({
        orderBy: {
          createdAt: "desc",
        },
        include: {
          heritage: {
            select: {
              name: true,
              slug: true,
              state: {
                select: {
                  name: true,
                },
              },
              district: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),

      // 2. Uploaded Videos (from admin video management)
      prisma.homepageVideo.findMany({
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      }),

      // 3. Uploaded Audio Stories & Songs (from admin oral folklore management)
      prisma.oralHistory.findMany({
        where: {
          audioUrl: { not: null },
        },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          heritage: {
            select: {
              name: true,
              slug: true,
              state: { select: { name: true } },
              district: { select: { name: true } },
            },
          },
          category: {
            select: {
              name: true,
              slug: true,
            },
          },
          state: {
            select: {
              name: true,
            },
          },
          district: {
            select: {
              name: true,
            },
          },
        },
      }),

      // 4. Uploaded Digital Books / Documents (from admin digital library)
      prisma.book.findMany({
        orderBy: {
          createdAt: "desc",
        },
        include: {
          _count: {
            select: { pages: true },
          },
        },
      }),

      // 5. Verified AI Knowledge Base Documents
      prisma.aIKnowledgeDocument.findMany({
        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);

  // Photographs
  const photoItems: UnifiedMediaItem[] = photosMedia
    .filter(
      (item) =>
        !item.type.toUpperCase().includes("VIDEO") &&
        !item.type.toUpperCase().includes("AUDIO") &&
        !item.type.toUpperCase().includes("DOCUMENT") &&
        !item.type.toUpperCase().includes("PDF")
    )
    .map((item) => ({
      id: item.id,
      title: item.title || "Untitled Heritage Media",
      type: "PHOTO",
      url: item.url,
      description: item.description,
      linkHref: item.heritage ? `/heritage/${item.heritage.slug}` : null,
      linkLabel: item.heritage?.name,
      location: item.heritage
        ? `${item.heritage.state?.name || ""}${
            item.heritage.district?.name
              ? ` · ${item.heritage.district.name}`
              : ""
          }`
        : null,
    }));

  // Videos
  const videoItems: UnifiedMediaItem[] = [
    ...homepageVideos.map((v) => ({
      id: v.id,
      title: v.title,
      type: "VIDEO" as const,
      url: v.url,
      description: v.description,
      thumbnail: v.thumbnail,
      metaBadge: "Living Tradition Video",
    })),
    ...photosMedia
      .filter((m) => m.type.toUpperCase().includes("VIDEO"))
      .map((item) => ({
        id: item.id,
        title: item.title || "Heritage Video",
        type: "VIDEO" as const,
        url: item.url,
        description: item.description,
        linkHref: item.heritage ? `/heritage/${item.heritage.slug}` : null,
        linkLabel: item.heritage?.name,
        location: item.heritage?.state?.name || null,
      })),
  ];

  // Audio Stories & Songs
  const audioItems: UnifiedMediaItem[] = [
    ...oralHistories.map((oh) => {
      const isSong = (oh.type || "").toUpperCase() === "SONG";
      return {
        id: oh.id,
        title: oh.title,
        type: "AUDIO" as const,
        url: oh.audioUrl!,
        audioUrl: oh.audioUrl,
        description:
          oh.description ||
          (oh.transcript
            ? oh.transcript.slice(0, 160) + "..."
            : isSong
            ? "Recorded cultural folk song & living melody"
            : "Recorded community oral tradition & folklore story"),
        linkHref: oh.heritage
          ? `/heritage/${oh.heritage.slug}`
          : `/oral-history`,
        linkLabel:
          oh.heritage?.name ||
          (isSong ? "Living Folk Song" : "Oral Tradition"),
        location: oh.state
          ? `${oh.state.name}${oh.district ? ` · ${oh.district.name}` : ""}`
          : null,
        categoryName: oh.category?.name || null,
        metaBadge: oh.originalLanguage
          ? `${oh.originalLanguage} · ${isSong ? "Song" : "Story"}`
          : isSong
          ? "Folk Song"
          : "Oral Story",
      };
    }),
    ...photosMedia
      .filter((m) => m.type.toUpperCase().includes("AUDIO"))
      .map((item) => ({
        id: item.id,
        title: item.title || "Heritage Audio",
        type: "AUDIO" as const,
        url: item.url,
        audioUrl: item.url,
        description: item.description,
        linkHref: item.heritage ? `/heritage/${item.heritage.slug}` : null,
        linkLabel: item.heritage?.name,
        location: item.heritage?.state?.name || null,
      })),
  ];

  // Documents
  const documentItems: UnifiedMediaItem[] = [
    ...books.map((b) => ({
      id: b.id,
      title: b.title,
      type: "DOCUMENT" as const,
      url: b.coverUrl || "/books/default.jpg",
      thumbnail: b.coverUrl,
      description:
        b.description ||
        `Digital heritage publication documented in ${b._count.pages} pages.`,
      linkHref: `/books/${b.slug}`,
      linkLabel: `Read Book (${b._count.pages} pages)`,
      metaBadge: `${b._count.pages} Pages`,
    })),
    ...aiDocs
      .filter((doc) => doc.sourceUrl)
      .map((doc) => ({
        id: doc.id,
        title: doc.title,
        type: "DOCUMENT" as const,
        url: doc.sourceUrl!,
        description: doc.description,
        linkHref: doc.sourceUrl,
        linkLabel: "Knowledge Document",
        metaBadge: doc.type,
      })),
    ...photosMedia
      .filter(
        (m) =>
          m.type.toUpperCase().includes("DOCUMENT") ||
          m.type.toUpperCase().includes("PDF")
      )
      .map((item) => ({
        id: item.id,
        title: item.title || "Heritage Document",
        type: "DOCUMENT" as const,
        url: item.url,
        description: item.description,
        linkHref: item.heritage ? `/heritage/${item.heritage.slug}` : null,
        linkLabel: item.heritage?.name,
        location: item.heritage?.state?.name || null,
      })),
  ];

  const allItems: UnifiedMediaItem[] = [
    ...photoItems,
    ...videoItems,
    ...audioItems,
    ...documentItems,
  ];

  return (
    <main className="min-h-screen bg-[#0b0b0b] px-6 py-16 text-white md:px-10">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-14">
          <p className="mb-3 text-xs uppercase tracking-[0.4em] text-white/35">
            Virasat Archive
          </p>

          <h1 className="font-serif text-4xl font-semibold md:text-6xl">
            Media Archive
          </h1>

          <p className="mt-5 max-w-2xl text-sm leading-7 text-white/45 md:text-base">
            Explore photographs, videos, audio recordings and documents
            connected with India's living heritage.
          </p>
        </div>

        {/* Media Archive Grid & Connected Stats */}
        <MediaArchiveView items={allItems} />

        {/* Oral heritage teaser */}
        <section className="mt-24 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.035] p-8 md:p-12">
          <div className="max-w-3xl">
            <p className="mb-3 text-xs uppercase tracking-[0.35em] text-white/30">
              Coming into the archive
            </p>

            <h2 className="font-serif text-3xl md:text-4xl">
              Voices of living heritage
            </h2>

            <p className="mt-5 text-sm leading-7 text-white/45 md:text-base">
              Preserve the voices behind India's traditions through
              recorded stories, original languages, transcripts and
              translations. Every voice becomes part of the cultural
              memory of Virasat.
            </p>

            <div className="mt-7 flex flex-wrap gap-3 text-xs text-white/45">
              <span className="rounded-full border border-white/10 px-4 py-2">
                Original Language
              </span>

              <span className="rounded-full border border-white/10 px-4 py-2">
                Audio Recording
              </span>

              <span className="rounded-full border border-white/10 px-4 py-2">
                Transcript
              </span>

              <span className="rounded-full border border-white/10 px-4 py-2">
                Translation
              </span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
