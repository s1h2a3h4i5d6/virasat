import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return null;
  }

  return session;
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdmin();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const queue = searchParams.get("queue")?.toUpperCase() || "ALL";

    // 1. Fetch live pending verification counts across all platform modules
    const [
      pendingContributionsCount,
      pendingOralHistoriesCount,
      unverifiedHeritageCount,
      pendingVideosCount,
      unverifiedAIDocumentsCount,
    ] = await Promise.all([
      prisma.contribution.count({ where: { status: "PENDING" } }),
      prisma.oralHistory.count({ where: { status: "PENDING" } }),
      prisma.heritage.count({ where: { verified: false } }),
      prisma.homepageVideo.count({ where: { status: "PENDING" } }),
      prisma.aIKnowledgeDocument.count({ where: { verified: false } }),
    ]);

    const counts = {
      contributions: pendingContributionsCount,
      oralHistories: pendingOralHistoriesCount,
      heritage: unverifiedHeritageCount,
      videos: pendingVideosCount,
      aiDocuments: unverifiedAIDocumentsCount,
      total:
        pendingContributionsCount +
        pendingOralHistoriesCount +
        unverifiedHeritageCount +
        pendingVideosCount +
        unverifiedAIDocumentsCount,
    };

    // 2. Fetch queue items based on filter
    const fetchAll = queue === "ALL";

    const [
      contributions,
      oralHistories,
      heritageRecords,
      videos,
      aiDocuments,
    ] = await Promise.all([
      fetchAll || queue === "CONTRIBUTION"
        ? prisma.contribution.findMany({
            where: { status: "PENDING" },
            orderBy: { createdAt: "desc" },
            take: 30,
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
              heritage: {
                select: { id: true, name: true, slug: true },
              },
            },
          })
        : [],
      fetchAll || queue === "ORAL_HISTORY"
        ? prisma.oralHistory.findMany({
            where: { status: "PENDING" },
            orderBy: { createdAt: "desc" },
            take: 30,
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
              category: {
                select: { id: true, name: true, slug: true },
              },
              state: {
                select: { id: true, name: true },
              },
            },
          })
        : [],
      fetchAll || queue === "HERITAGE"
        ? prisma.heritage.findMany({
            where: { verified: false },
            orderBy: { createdAt: "desc" },
            take: 30,
            include: {
              state: {
                select: { id: true, name: true },
              },
              district: {
                select: { id: true, name: true },
              },
              category: {
                select: { id: true, name: true },
              },
              media: {
                take: 1,
                select: { url: true, type: true },
              },
            },
          })
        : [],
      fetchAll || queue === "VIDEO"
        ? prisma.homepageVideo.findMany({
            where: { status: "PENDING" },
            orderBy: { createdAt: "desc" },
            take: 30,
          })
        : [],
      fetchAll || queue === "AI_DOCUMENT"
        ? prisma.aIKnowledgeDocument.findMany({
            where: { verified: false },
            orderBy: { createdAt: "desc" },
            take: 30,
          })
        : [],
    ]);

    return NextResponse.json({
      counts,
      queue,
      items: {
        contributions,
        oralHistories,
        heritage: heritageRecords,
        videos,
        aiDocuments,
      },
    });
  } catch (error) {
    console.error("Admin verification GET error:", error);
    return NextResponse.json(
      { error: "Failed to load verification queues." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { entityType, id, action, note } = body;

    if (!entityType || !id || !action) {
      return NextResponse.json(
        { error: "entityType, id, and action are required." },
        { status: 400 }
      );
    }

    let result: any = null;

    switch (entityType) {
      case "CONTRIBUTION": {
        let status: "APPROVED" | "REJECTED" | "NEEDS_CHANGES" = "APPROVED";
        if (action === "REJECT") status = "REJECTED";
        if (action === "NEEDS_CHANGES") status = "NEEDS_CHANGES";

        result = await prisma.contribution.update({
          where: { id },
          data: {
            status,
            reviewNote: note ? String(note).trim() : undefined,
          },
        });
        break;
      }

      case "ORAL_HISTORY": {
        let status: "APPROVED" | "REJECTED" | "NEEDS_CHANGES" | "PENDING" = "APPROVED";
        let verified = true;

        if (action === "REJECT") {
          status = "REJECTED";
          verified = false;
        } else if (action === "NEEDS_CHANGES") {
          status = "NEEDS_CHANGES";
          verified = false;
        } else if (action === "UNVERIFY") {
          status = "PENDING";
          verified = false;
        }

        result = await prisma.oralHistory.update({
          where: { id },
          data: {
            status,
            verified,
          },
        });
        break;
      }

      case "HERITAGE": {
        const verified = action === "APPROVE" || action === "VERIFY";

        result = await prisma.heritage.update({
          where: { id },
          data: { verified },
        });
        break;
      }

      case "VIDEO": {
        const approved = action === "APPROVE";

        result = await prisma.homepageVideo.update({
          where: { id },
          data: {
            status: approved ? "APPROVED" : "REJECTED",
            published: approved,
          },
        });
        break;
      }

      case "AI_DOCUMENT": {
        const verified = action === "APPROVE" || action === "VERIFY";

        result = await prisma.aIKnowledgeDocument.update({
          where: { id },
          data: { verified },
        });
        break;
      }

      default:
        return NextResponse.json(
          { error: `Unknown entityType: ${entityType}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      message: `${entityType} verification updated successfully.`,
      result,
    });
  } catch (error) {
    console.error("Admin verification POST error:", error);
    return NextResponse.json(
      { error: "Failed to process verification action." },
      { status: 500 }
    );
  }
}
