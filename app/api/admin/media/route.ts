import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

const mediaSchema = z.object({
  title: z.string().trim().max(200).optional().or(z.literal("")),
  type: z.enum(["PHOTO", "VIDEO", "AUDIO", "DOCUMENT"]),
  url: z
    .string()
    .trim()
    .refine(
      (value) =>
        value.startsWith("/") ||
        /^https?:\/\/.+/i.test(value),
      {
        message: "Enter a valid media URL.",
      }
    ),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  heritageId: z.string().optional().or(z.literal("")),
});

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === "ADMIN";
}

export async function GET() {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const media = await prisma.media.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        heritage: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json(media);
  } catch (error) {
    console.error("Admin media GET error:", error);

    return NextResponse.json(
      { error: "Failed to load media." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const result = mediaSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Invalid media data.",
          details: result.error.flatten(),
        },
        { status: 400 }
      );
    }

    const data = result.data;

    if (data.heritageId) {
      const heritage = await prisma.heritage.findUnique({
        where: {
          id: data.heritageId,
        },
      });

      if (!heritage) {
        return NextResponse.json(
          {
            error:
              "Selected heritage record does not exist.",
          },
          { status: 400 }
        );
      }
    }

    const media = await prisma.media.create({
      data: {
        title: data.title || null,
        type: data.type,
        url: data.url,
        description: data.description || null,
        heritageId: data.heritageId || null,
      },
      include: {
        heritage: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json(media, {
      status: 201,
    });
  } catch (error) {
    console.error("Admin media POST error:", error);

    return NextResponse.json(
      { error: "Failed to create media." },
      { status: 500 }
    );
  }
}
