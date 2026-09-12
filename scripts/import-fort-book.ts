import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";
import { prisma } from "../lib/db/prisma";

function extractSlideText(xml: string): string {
  const matches = [...xml.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)];

  return matches
    .map((m) =>
      m[1]
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
    )
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  console.log("Starting 15-fort book import...");

  const pptPath = path.join(
    process.cwd(),
    "public",
    "books",
    "top-15-forts.pptx"
  );

  if (!fs.existsSync(pptPath)) {
    throw new Error(`PPT not found: ${pptPath}`);
  }

  const zip = new AdmZip(pptPath);

  const slideEntries = zip
    .getEntries()
    .filter((entry) =>
      /^ppt\/slides\/slide\d+\.xml$/.test(entry.entryName)
    )
    .sort((a, b) => {
      const aNo = Number(a.entryName.match(/slide(\d+)/)?.[1] ?? 0);
      const bNo = Number(b.entryName.match(/slide(\d+)/)?.[1] ?? 0);
      return aNo - bNo;
    });

  console.log(`Found ${slideEntries.length} slides.`);

  const pages = slideEntries
    .map((entry, index) => {
      const xml = entry.getData().toString("utf8");
      const content = extractSlideText(xml);

      return {
        pageNo: index + 1,
        title:
          content
            .split("  ")
            .map((x) => x.trim())
            .find((x) => x.length > 0) ||
          `Page ${index + 1}`,
        content,
      };
    })
    .filter((page) => page.content.length > 0);

  console.log(`Extracted ${pages.length} content pages.`);

  const book = await prisma.book.upsert({
    where: {
      slug: "top-15-historic-forts-shivaji-maharaj",
    },
    update: {
      title:
        "Top 15 Historic Forts of Chhatrapati Shivaji Maharaj",
      description:
        "Fort Architecture, History & the Role of Swarajya. A digital heritage book based on the Virasat fort presentation.",
      coverUrl: "/books/top-15-forts-pages/page-01.png",
    },
    create: {
      title:
        "Top 15 Historic Forts of Chhatrapati Shivaji Maharaj",
      slug: "top-15-historic-forts-shivaji-maharaj",
      description:
        "Fort Architecture, History & the Role of Swarajya. A digital heritage book based on the Virasat fort presentation.",
      coverUrl: "/books/top-15-forts-pages/page-01.png",
    },
  });

  await prisma.bookPage.deleteMany({
    where: {
      bookId: book.id,
    },
  });

  for (const page of pages) {
    await prisma.bookPage.create({
      data: {
        bookId: book.id,
        pageNo: page.pageNo,
        title: page.title.substring(0, 250),
        content: page.content,
      },
    });
  }

  console.log("");
  console.log("======================================");
  console.log("15-FORT BOOK IMPORT COMPLETED");
  console.log("======================================");
  console.log(`Book: ${book.title}`);
  console.log(`Pages imported: ${pages.length}`);
  console.log("URL:");
  console.log(
    "http://localhost:3000/books/top-15-historic-forts-shivaji-maharaj"
  );
  console.log("======================================");
}

main()
  .catch((error) => {
    console.error("BOOK IMPORT ERROR:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
