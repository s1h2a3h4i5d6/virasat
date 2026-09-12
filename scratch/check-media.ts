import { prisma } from "../lib/db/prisma";

async function main() {
  const mediaTypes = await prisma.media.groupBy({
    by: ["type"],
    _count: true,
  });
  console.log("Media types in prisma.media:", JSON.stringify(mediaTypes));

  const videos = await prisma.homepageVideo.findMany({
    select: { id: true, title: true, url: true, thumbnail: true, status: true, published: true },
  });
  console.log("HomepageVideos count:", videos.length, JSON.stringify(videos));

  const oralHistories = await prisma.oralHistory.findMany({
    select: { id: true, title: true, audioUrl: true, status: true, verified: true, type: true },
  });
  console.log("OralHistories count:", oralHistories.length, JSON.stringify(oralHistories));

  const books = await prisma.book.findMany({
    select: { id: true, title: true, slug: true, coverUrl: true, _count: { select: { pages: true } } },
  });
  console.log("Books count:", books.length, JSON.stringify(books));

  const aiDocs = await prisma.aIKnowledgeDocument.findMany({
    select: { id: true, title: true, type: true, sourceUrl: true, verified: true },
  });
  console.log("AIDocs count:", aiDocs.length, JSON.stringify(aiDocs));
}

main().finally(() => process.exit(0));
