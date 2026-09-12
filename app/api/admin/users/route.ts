import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@/generated/prisma/client";

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
    const roleParam = searchParams.get("role")?.toUpperCase();
    const search = searchParams.get("search")?.trim().toLowerCase();

    // 1. Fetch user role metric counts
    const [totalUsers, adminCount, userCount, visitorCount, activeContributors] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { role: "ADMIN" } }),
        prisma.user.count({ where: { role: "USER" } }),
        prisma.user.count({ where: { role: "VISITOR" } }),
        prisma.user.count({
          where: {
            OR: [
              { contributions: { some: {} } },
              { oralHistories: { some: {} } },
            ],
          },
        }),
      ]);

    const where: any = {};

    if (
      roleParam &&
      roleParam !== "ALL" &&
      ["ADMIN", "USER", "VISITOR"].includes(roleParam)
    ) {
      where.role = roleParam as Role;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            contributions: true,
            oralHistories: true,
            favorites: true,
            quizResults: true,
            heritageVisits: true,
          },
        },
      },
    });

    return NextResponse.json({
      users,
      counts: {
        total: totalUsers,
        admin: adminCount,
        user: userCount,
        visitor: visitorCount,
        activeContributors,
      },
      currentUserId: session.user.id,
    });
  } catch (error) {
    console.error("Admin users GET error:", error);
    return NextResponse.json(
      { error: "Failed to load users." },
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
    const { id, role } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Valid user ID is required." },
        { status: 400 }
      );
    }

    const validRoles: Role[] = ["ADMIN", "USER", "VISITOR"];

    if (!role || !validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Invalid user role. Allowed: ADMIN, USER, VISITOR." },
        { status: 400 }
      );
    }

    // Protection: don't demote yourself if you are the sole admin
    if (session.user.id === id && role !== "ADMIN") {
      const totalAdmins = await prisma.user.count({
        where: { role: "ADMIN" },
      });

      if (totalAdmins <= 1) {
        return NextResponse.json(
          {
            error:
              "Cannot demote the only administrator account on the system.",
          },
          { status: 400 }
        );
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      message: `User role updated to ${role} successfully.`,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Admin users PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update user role." },
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
        { error: "User ID is required." },
        { status: 400 }
      );
    }

    // Self-deletion protection
    if (session.user.id === id) {
      return NextResponse.json(
        {
          error:
            "You cannot delete your own admin account while signed in.",
        },
        { status: 400 }
      );
    }

    // Check if targeting the only admin
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { role: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    if (targetUser.role === "ADMIN") {
      const adminCount = await prisma.user.count({
        where: { role: "ADMIN" },
      });

      if (adminCount <= 1) {
        return NextResponse.json(
          {
            error:
              "Cannot delete the only administrator account on the system.",
          },
          { status: 400 }
        );
      }
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "User deleted successfully.",
      id,
    });
  } catch (error) {
    console.error("Admin users DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete user." },
      { status: 500 }
    );
  }
}
