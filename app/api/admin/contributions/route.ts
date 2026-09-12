import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { VerificationStatus } from "@/generated/prisma/client";

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
    const statusParam = searchParams.get("status")?.toUpperCase();
    const search = searchParams.get("search")?.trim().toLowerCase();

    // Fetch metric counts across all statuses
    const [
      totalCount,
      pendingCount,
      approvedCount,
      needsChangesCount,
      rejectedCount,
    ] = await Promise.all([
      prisma.contribution.count(),
      prisma.contribution.count({ where: { status: "PENDING" } }),
      prisma.contribution.count({ where: { status: "APPROVED" } }),
      prisma.contribution.count({ where: { status: "NEEDS_CHANGES" } }),
      prisma.contribution.count({ where: { status: "REJECTED" } }),
    ]);

    const where: any = {};

    if (
      statusParam &&
      statusParam !== "ALL" &&
      ["PENDING", "APPROVED", "NEEDS_CHANGES", "REJECTED"].includes(statusParam)
    ) {
      where.status = statusParam as VerificationStatus;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { heritage: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const contributions = await prisma.contribution.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        heritage: {
          select: {
            id: true,
            name: true,
            slug: true,
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      contributions,
      counts: {
        ALL: totalCount,
        PENDING: pendingCount,
        APPROVED: approvedCount,
        NEEDS_CHANGES: needsChangesCount,
        REJECTED: rejectedCount,
      },
    });
  } catch (error) {
    console.error("Admin contributions GET error:", error);
    return NextResponse.json(
      { error: "Failed to load contributions." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAdmin();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, status, reviewNote } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Valid contribution ID is required." },
        { status: 400 }
      );
    }

    const validStatuses: VerificationStatus[] = [
      "PENDING",
      "APPROVED",
      "NEEDS_CHANGES",
      "REJECTED",
    ];

    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid verification status." },
        { status: 400 }
      );
    }

    const updated = await prisma.contribution.update({
      where: { id },
      data: {
        status,
        reviewNote: typeof reviewNote === "string" ? reviewNote.trim() : reviewNote,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        heritage: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Contribution status updated successfully.",
      contribution: updated,
    });
  } catch (error) {
    console.error("Admin contributions PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update contribution status." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAdmin();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    let id = searchParams.get("id");

    if (!id) {
      try {
        const body = await request.json();
        id = body.id;
      } catch {
        // query param used
      }
    }

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Contribution ID is required." },
        { status: 400 }
      );
    }

    await prisma.contribution.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Contribution deleted successfully.",
      id,
    });
  } catch (error) {
    console.error("Admin contributions DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete contribution." },
      { status: 500 }
    );
  }
}
