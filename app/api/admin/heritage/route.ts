import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

const heritageSchema = z.object({
  name: z.string().trim().min(2).max(200),
  slug: z.string().trim().min(2).max(200),
  shortDescription: z.string().trim().max(500).optional().or(z.literal("")),
  description: z.string().trim().optional().or(z.literal("")),
  origin: z.string().trim().optional().or(z.literal("")),
  history: z.string().trim().optional().or(z.literal("")),
  significance: z.string().trim().optional().or(z.literal("")),
  story: z.string().trim().optional().or(z.literal("")),
  language: z.string().trim().optional().or(z.literal("")),
  regions: z.string().trim().optional().or(z.literal("")),
  practitioners: z.string().trim().optional().or(z.literal("")),
  festivals: z.string().trim().optional().or(z.literal("")),
  timeline: z.string().trim().optional().or(z.literal("")),
  preservationStatus: z.enum([
    "STABLE",
    "VULNERABLE",
    "ENDANGERED",
    "CRITICAL",
  ]).default("STABLE"),
  stateId: z.string().optional().or(z.literal("")),
  districtId: z.string().optional().or(z.literal("")),
  categoryId: z.string().optional().or(z.literal("")),
  verified: z.boolean().default(false),
});

async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return null;
  }

  return session;
}

export async function GET() {
  try {
    const session = await requireAdmin();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const heritage = await prisma.heritage.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
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
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            media: true,
            contributions: true,
          },
        },
      },
    });

    return NextResponse.json(heritage);
  } catch (error) {
    console.error("Admin heritage GET error:", error);

    return NextResponse.json(
      { error: "Failed to load heritage records." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdmin();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const result = heritageSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Invalid heritage data.",
          details: result.error.flatten(),
        },
        { status: 400 }
      );
    }

    const data = result.data;

    if (data.stateId) {
      const state = await prisma.state.findUnique({
        where: { id: data.stateId },
      });

      if (!state) {
        return NextResponse.json(
          { error: "Selected state does not exist." },
          { status: 400 }
        );
      }
    }

    if (data.districtId) {
      const district = await prisma.district.findUnique({
        where: { id: data.districtId },
      });

      if (!district) {
        return NextResponse.json(
          { error: "Selected district does not exist." },
          { status: 400 }
        );
      }

      if (data.stateId && district.stateId !== data.stateId) {
        return NextResponse.json(
          { error: "District does not belong to selected state." },
          { status: 400 }
        );
      }
    }

    if (data.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: data.categoryId },
      });

      if (!category) {
        return NextResponse.json(
          { error: "Selected category does not exist." },
          { status: 400 }
        );
      }
    }

    const heritage = await prisma.heritage.create({
      data: {
        name: data.name,
        slug: data.slug,
        shortDescription: data.shortDescription || null,
        description: data.description || null,
        origin: data.origin || null,
        history: data.history || null,
        significance: data.significance || null,
        story: data.story || null,
        language: data.language || null,
        regions: data.regions || null,
        practitioners: data.practitioners || null,
        festivals: data.festivals || null,
        timeline: data.timeline || null,
        preservationStatus: data.preservationStatus,
        stateId: data.stateId || null,
        districtId: data.districtId || null,
        categoryId: data.categoryId || null,
        verified: data.verified,
      },
    });

    return NextResponse.json(heritage, { status: 201 });
  } catch (error: any) {
    console.error("Admin heritage POST error:", error);

    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "A heritage record with this slug already exists." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create heritage record." },
      { status: 500 }
    );
  }
}
