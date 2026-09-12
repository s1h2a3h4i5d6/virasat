import Hero from "@/components/Hero";
import DiscoverHeritage from "@/components/heritage/DiscoverHeritage";
import HomepageVideoShowcase from "@/components/home/HomepageVideoShowcase";
import PreservationSection from "@/components/heritage/PreservationSection";
import FeaturedArchive from "@/components/heritage/FeaturedArchive";
import LanguageFloatingPill from "@/components/home/LanguageFloatingPill";
import { prisma } from "@/lib/db/prisma";

export default async function Home() {
  const [slides, categories, heritage, preservationHeritage, homepageVideos] =
    await Promise.all([
      prisma.slideshow.findMany({
        where: {
          active: true,
        },
        orderBy: {
          sortOrder: "asc",
        },
      }),

      prisma.category.findMany({
        orderBy: {
          name: "asc",
        },
      }),

      prisma.heritage.findMany({
        orderBy: {
          createdAt: "desc",
        },
        take: 6,
        include: {
          state: true,
          district: true,
          category: true,
          media: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      }),

      prisma.heritage.findMany({
        where: {
          preservationStatus: {
            in: ["VULNERABLE", "ENDANGERED", "CRITICAL"],
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: 6,
        include: {
          state: true,
          district: true,
          category: true,
          media: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      }),

      prisma.homepageVideo.findMany({
        where: {
          status: "APPROVED",
          published: true,
        },
        orderBy: [
          {
            sortOrder: "asc",
          },
          {
            createdAt: "desc",
          },
        ],
      }),
    ]);

  return (
    <main>
      <Hero slides={slides} />
      <DiscoverHeritage categories={categories} />
      <HomepageVideoShowcase videos={homepageVideos} />
      <FeaturedArchive heritage={heritage} />
      <PreservationSection heritage={preservationHeritage} />
      <LanguageFloatingPill />
    </main>
  );
}
