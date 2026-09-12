import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

const updateCategorySchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(100).optional(),
  slug: z.string().trim().min(2, "Slug must be at least 2 characters.").max(100).optional(),
  description: z.string().trim().max(2000).nullable().optional().or(z.literal("")),
  imageUrl: z.string().trim().nullable().optional().or(z.literal("")),
});

async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return null;
  }

  return session;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            heritage: true,
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error("Admin category GET by id error:", error);

    return NextResponse.json(
      { error: "Failed to load category." },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const result = updateCategorySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Invalid category update data.",
          details: result.error.flatten(),
        },
        { status: 400 }
      );
    }

    const existing = await prisma.category.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Category not found." },
        { status: 404 }
      );
    }

    const data = result.data;
    const updateData: Record<string, any> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.description !== undefined) {
      updateData.description = data.description ? data.description.trim() : null;
    }
    if (data.imageUrl !== undefined) {
      updateData.imageUrl = data.imageUrl ? data.imageUrl.trim() : null;
    }

    const updated = await prisma.category.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Admin category PUT error:", error);

    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "A category with this name or slug already exists." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update category." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const existing = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            heritage: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Category not found." },
        { status: 404 }
      );
    }

    if (existing._count.heritage > 0) {
      return NextResponse.json(
        {
          error:
            "Categories currently used by heritage records cannot be deleted.",
        },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Category deleted successfully.",
    });
  } catch (error) {
    console.error("Admin category DELETE error:", error);

    return NextResponse.json(
      { error: "Failed to delete category." },
      { status: 500 }
    );
  }
}
