import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getKeywords(question: string) {
  const stopWords = new Set([
    "the",
    "and",
    "for",
    "with",
    "about",
    "what",
    "which",
    "where",
    "when",
    "how",
    "why",
    "who",
    "tell",
    "give",
    "from",
    "this",
    "that",
    "are",
    "was",
    "were",
    "has",
    "have",
    "does",
    "its",
    "their",
    "into",
    "can",
    "you",
    "me",
    "india",
    "please",
    "explain",
  ]);

  return normalize(question)
    .split(" ")
    .filter(
      (word) =>
        word.length >= 3 &&
        !stopWords.has(word)
    )
    .slice(0, 20);
}

function scoreChunk(content: string, keywords: string[]) {
  const text = normalize(content);
  let score = 0;

  for (const keyword of keywords) {
    if (text.includes(keyword)) {
      score += 3;

      const occurrences =
        text.split(keyword).length - 1;

      score += Math.min(
        Math.max(occurrences - 1, 0),
        3
      );
    }
  }

  return score;
}

type KnowledgeRow = {
  id: string;
  chunkIndex: number;
  content: string;
  documentId: string;
  documentTitle: string;
  documentType: string;
  sourceUrl: string | null;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const question = String(
      body?.question || ""
    ).trim();

    if (!question) {
      return NextResponse.json(
        {
          error: "Question is required.",
        },
        { status: 400 }
      );
    }

    if (question.length > 1000) {
      return NextResponse.json(
        {
          error:
            "Question must be 1000 characters or less.",
        },
        { status: 400 }
      );
    }

    const keywords = getKeywords(question);

    if (keywords.length === 0) {
      return NextResponse.json({
        answer:
          "I couldn't find verified information about this in the Virasat knowledge base.",
        sources: [],
        fallback: true,
      });
    }

    /*
      Use a raw SQL query here instead of prisma.aIKnowledgeChunk.findMany().

      This avoids the runtime delegate issue while still retrieving
      only verified Virasat knowledge-base chunks.
    */
    const rows =
      await prisma.$queryRaw<KnowledgeRow[]>(
        Prisma.sql`
          SELECT
            c."id" AS "id",
            c."chunkIndex" AS "chunkIndex",
            c."content" AS "content",
            c."documentId" AS "documentId",
            d."title" AS "documentTitle",
            d."type" AS "documentType",
            d."sourceUrl" AS "sourceUrl"
          FROM "AIKnowledgeChunk" c
          INNER JOIN "AIKnowledgeDocument" d
            ON c."documentId" = d."id"
          WHERE d."verified" = true
          ORDER BY c."createdAt" ASC
        `
      );

    if (!rows.length) {
      return NextResponse.json({
        answer:
          "I couldn't find verified information about this in the Virasat knowledge base.",
        sources: [],
        fallback: true,
      });
    }

    const normalizedQuestion =
      normalize(question);

    const ranked = rows
      .map((chunk) => {
        const normalizedContent =
          normalize(chunk.content);

        const normalizedTitle =
          normalize(chunk.documentTitle);

        let score = scoreChunk(
          chunk.content,
          keywords
        );

        // Strong boost for exact document-title matches.
        if (
          normalizedQuestion.includes(
            normalizedTitle
          ) ||
          normalizedTitle.includes(
            normalizedQuestion
          )
        ) {
          score += 20;
        }

        // Boost keywords appearing in the document title.
        for (const keyword of keywords) {
          if (
            normalizedTitle.includes(keyword)
          ) {
            score += 8;
          }
        }

        // Boost direct question/content matches.
        if (
          normalizedQuestion.length >= 8 &&
          normalizedContent.includes(
            normalizedQuestion
          )
        ) {
          score += 15;
        }

        return {
          chunk,
          score,
        };
      })
      .filter(
        (item) => item.score > 0
      )
      .sort(
        (a, b) => b.score - a.score
      )
      .slice(0, 5);

    if (!ranked.length) {
      return NextResponse.json({
        answer:
          "I couldn't find verified information about this in the Virasat knowledge base.",
        sources: [],
        fallback: true,
      });
    }

    const answer = ranked
      .map((item) =>
        item.chunk.content.trim()
      )
      .filter(Boolean)
      .join("\n\n");

    const sources = Array.from(
      new Map(
        ranked.map((item) => [
          item.chunk.documentId,
          {
            title:
              item.chunk.documentTitle,
            type:
              item.chunk.documentType,
            url:
              item.chunk.sourceUrl,
          },
        ])
      ).values()
    );

    return NextResponse.json({
      answer,
      sources,
      fallback: false,
    });
  } catch (error) {
    console.error(
      "AI CHAT ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "AI retrieval failed.",
        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}
