import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

const CHUNK_SIZE = 900;
const CHUNK_OVERLAP = 150;

function cleanText(value: string | null | undefined) {
  return (value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildHeritageContent(record: any) {
  const sections = [
    `Name: ${cleanText(record.name)}`,

    record.shortDescription
      ? `Short Description: ${cleanText(record.shortDescription)}`
      : "",

    record.description
      ? `Description: ${cleanText(record.description)}`
      : "",

    record.origin
      ? `Origin: ${cleanText(record.origin)}`
      : "",

    record.history
      ? `History: ${cleanText(record.history)}`
      : "",

    record.significance
      ? `Cultural Significance: ${cleanText(record.significance)}`
      : "",

    record.story
      ? `Story: ${cleanText(record.story)}`
      : "",

    record.language
      ? `Language: ${cleanText(record.language)}`
      : "",

    record.regions
      ? `Regions: ${cleanText(record.regions)}`
      : "",

    record.practitioners
      ? `Practitioners: ${cleanText(record.practitioners)}`
      : "",

    record.festivals
      ? `Festivals: ${cleanText(record.festivals)}`
      : "",

    record.timeline
      ? `Timeline: ${cleanText(record.timeline)}`
      : "",

    record.category?.name
      ? `Category: ${cleanText(record.category.name)}`
      : "",

    record.state?.name
      ? `State: ${cleanText(record.state.name)}`
      : "",

    record.district?.name
      ? `District: ${cleanText(record.district.name)}`
      : "",

    `Preservation Status: ${record.preservationStatus}`,

    `Verified: ${record.verified ? "Yes" : "No"}`,
  ];

  return sections.filter(Boolean).join("\n\n");
}

function createChunks(text: string) {
  const normalized = text.replace(/\s+/g, " ").trim();

  if (!normalized) {
    return [];
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < normalized.length) {
    let end = Math.min(start + CHUNK_SIZE, normalized.length);

    if (end < normalized.length) {
      const lastSpace = normalized.lastIndexOf(" ", end);

      if (lastSpace > start + 400) {
        end = lastSpace;
      }
    }

    const chunk = normalized.slice(start, end).trim();

    if (chunk) {
      chunks.push(chunk);
    }

    if (end >= normalized.length) {
      break;
    }

    start = Math.max(end - CHUNK_OVERLAP, start + 1);
  }

  return chunks;
}

async function main() {
  console.log("");
  console.log("==========================================");
  console.log(" VIRASAT AI KNOWLEDGE BASE INGESTION");
  console.log("==========================================");
  console.log("");

  const heritageRecords = await prisma.heritage.findMany({
    where: {
      verified: true,
    },
    include: {
      state: true,
      district: true,
      category: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  console.log(`Verified heritage records found: ${heritageRecords.length}`);
  console.log("");

  let documentsCreated = 0;
  let chunksCreated = 0;

  for (const record of heritageRecords) {
    const title = `Heritage: ${record.name}`;

    const content = buildHeritageContent(record);

    const chunks = createChunks(content);

    if (chunks.length === 0) {
      console.log(`Skipping empty record: ${record.name}`);
      continue;
    }

    let document = await prisma.aIKnowledgeDocument.findFirst({
      where: {
        title,
      },
    });

    if (!document) {
      document = await prisma.aIKnowledgeDocument.create({
        data: {
          title,
          type: "HERITAGE",
          sourceUrl: `/heritage/${record.slug}`,
          description:
            `Verified Virasat heritage knowledge for ${record.name}.`,
          verified: true,
        },
      });

      documentsCreated++;
    } else {
      await prisma.aIKnowledgeDocument.update({
        where: {
          id: document.id,
        },
        data: {
          type: "HERITAGE",
          sourceUrl: `/heritage/${record.slug}`,
          description:
            `Verified Virasat heritage knowledge for ${record.name}.`,
          verified: true,
        },
      });

      await prisma.aIKnowledgeChunk.deleteMany({
        where: {
          documentId: document.id,
        },
      });
    }

    for (let index = 0; index < chunks.length; index++) {
      await prisma.aIKnowledgeChunk.create({
        data: {
          documentId: document.id,
          chunkIndex: index,
          content: chunks[index],
          tokenCount: Math.ceil(chunks[index].length / 4),
        },
      });

      chunksCreated++;
    }

    console.log(
      `✓ ${record.name} → ${chunks.length} chunk(s)`
    );
  }

  console.log("");
  console.log("==========================================");
  console.log(" INGESTION COMPLETE");
  console.log("==========================================");
  console.log(`Documents created: ${documentsCreated}`);
  console.log(`Chunks created: ${chunksCreated}`);
  console.log("");

  await prisma.$disconnect();
  await pool.end();
}

main().catch(async (error) => {
  console.error("");
  console.error("Knowledge base ingestion failed:");
  console.error(error);

  await prisma.$disconnect();
  await pool.end();

  process.exit(1);
});