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
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const records = await prisma.oralHistory.findMany({
      where: status
        ? { status: status as any }
        : undefined,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        state: {
          select: {
            id: true,
            name: true,
          },
        },
        district: {
          select: {
            id: true,
            name: true,
          },
        },
        heritage: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error("ADMIN ORAL HISTORY GET ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to load oral history records.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAdmin();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const id = body?.id;
    const status = body?.status;
    const categoryId = body?.categoryId;
    const type = body?.type;

    if (!id) {
      return NextResponse.json(
        { error: "Oral history ID is required." },
        { status: 400 }
      );
    }

    const existing = await prisma.oralHistory.findUnique({
      where: {
        id: String(id),
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Oral history record not found." },
        { status: 404 }
      );
    }

    const updateData: any = {};

    if (status !== undefined) {
      const allowedStatuses = [
        "PENDING",
        "APPROVED",
        "REJECTED",
        "NEEDS_CHANGES",
      ];

      if (!allowedStatuses.includes(status)) {
        return NextResponse.json(
          { error: "Invalid verification status." },
          { status: 400 }
        );
      }

      updateData.status = status;
      updateData.verified = status === "APPROVED";
    }

    if (type !== undefined) {
      const upperType = String(type).trim().toUpperCase();
      if (upperType !== "STORY" && upperType !== "SONG") {
        return NextResponse.json(
          { error: "Invalid type. Must be STORY or SONG." },
          { status: 400 }
        );
      }
      updateData.type = upperType;
    }

    if (categoryId !== undefined) {
      updateData.categoryId = categoryId ? String(categoryId) : null;
    }

    const updated = await prisma.oralHistory.update({
      where: {
        id: String(id),
      },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        state: {
          select: {
            id: true,
            name: true,
          },
        },
        district: {
          select: {
            id: true,
            name: true,
          },
        },
        heritage: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Oral history record updated successfully.",
      record: updated,
    });
  } catch (error) {
    console.error("ADMIN ORAL HISTORY PUT ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to update oral history record.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAdmin();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    let id = searchParams.get("id");

    if (!id) {
      try {
        const body = await request.json();
        id = body?.id;
      } catch {
        // body not present
      }
    }

    if (!id) {
      return NextResponse.json(
        { error: "Oral history ID is required for deletion." },
        { status: 400 }
      );
    }

    const existing = await prisma.oralHistory.findUnique({
      where: {
        id: String(id),
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Oral history record not found." },
        { status: 404 }
      );
    }

    await prisma.oralHistory.delete({
      where: {
        id: String(id),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Oral history deleted successfully.",
    });
  } catch (error) {
    console.error("ADMIN ORAL HISTORY DELETE ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to delete oral history record.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
