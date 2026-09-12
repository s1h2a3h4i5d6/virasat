import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

const updateVideoSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required.")
    .max(200, "Title cannot exceed 200 characters.")
    .optional(),
  description: z
    .string()
    .trim()
    .max(1000, "Description cannot exceed 1000 characters.")
    .nullable()
    .optional()
    .or(z.literal("")),
  url: z
    .string()
    .trim()
    .transform((val) => {
      if (/^www\./i.test(val)) {
        return `https://${val}`;
      }
      return val;
    })
    .refine(
      (value) =>
        value.startsWith("/") ||
        /^https?:\/\/.+/i.test(value),
      {
        message: "Enter a valid video URL.",
      }
    )
    .optional(),
  thumbnail: z
    .string()
    .trim()
    .nullable()
    .optional()
    .or(z.literal("")),
  status: z
    .enum(["PENDING", "APPROVED", "REJECTED", "NEEDS_CHANGES"])
    .optional(),
  published: z.boolean().optional(),
  sortOrder: z.coerce.number().int().min(0).nullable().optional(),
  rotation: z
    .union([z.literal(0), z.literal(90), z.literal(180), z.literal(270)])
    .nullable()
    .optional(),
});

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === "ADMIN";
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const result = updateVideoSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Invalid update data.",
          details: result.error.flatten(),
        },
        { status: 400 }
      );
    }

    const existing = await prisma.homepageVideo.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Homepage video not found." },
        { status: 404 }
      );
    }

    const data = result.data;
    const nextStatus = data.status ?? existing.status;
    let nextPublished =
      data.published !== undefined ? data.published : existing.published;

    // Strict rule: When a video is not APPROVED: published must not remain true.
    if (nextStatus !== "APPROVED") {
      nextPublished = false;
    }

    const updateData: Record<string, any> = {
      status: nextStatus,
      published: nextPublished,
    };

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) {
      updateData.description = data.description ? data.description.trim() : null;
    }
    if (data.url !== undefined) updateData.url = data.url;
    if (data.thumbnail !== undefined) {
      updateData.thumbnail = data.thumbnail ? data.thumbnail.trim() : null;
    }
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;
    if (data.rotation !== undefined) updateData.rotation = data.rotation;

    const updated = await prisma.homepageVideo.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Admin homepage video PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update homepage video." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.homepageVideo.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Homepage video not found." },
        { status: 404 }
      );
    }

    await prisma.homepageVideo.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Homepage video deleted successfully.",
    });
  } catch (error) {
    console.error("Admin homepage video DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete homepage video." },
      { status: 500 }
    );
  }
}
