import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

const homepageVideoSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required.")
    .max(200, "Title cannot exceed 200 characters."),
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
    ),
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
  sortOrder: z.coerce
    .number()
    .int()
    .min(0)
    .nullable()
    .optional()
    .transform((v) => v ?? 0),
  rotation: z
    .union([z.literal(0), z.literal(90), z.literal(180), z.literal(270)])
    .nullable()
    .optional()
    .transform((v) => v ?? 0),
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

    const videos = await prisma.homepageVideo.findMany({
      orderBy: [
        { sortOrder: "asc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json(videos);
  } catch (error) {
    console.error("Admin homepage video GET error:", error);

    return NextResponse.json(
      { error: "Failed to load homepage videos." },
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
    const result = homepageVideoSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Invalid homepage video data.",
          details: result.error.flatten(),
        },
        { status: 400 }
      );
    }

    const data = result.data;
    const status = data.status || "PENDING";
    const published = status === "APPROVED" ? (data.published ?? false) : false;

    const video = await prisma.homepageVideo.create({
      data: {
        title: data.title,
        description: data.description || null,
        url: data.url,
        thumbnail: data.thumbnail || null,
        status,
        published,
        sortOrder: data.sortOrder ?? 0,
        rotation: data.rotation ?? 0,
      },
    });

    return NextResponse.json(video, {
      status: 201,
    });
  } catch (error) {
    console.error("Admin homepage video POST error:", error);

    return NextResponse.json(
      { error: "Failed to create homepage video." },
      { status: 500 }
    );
  }
}
