import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const videos = await prisma.homepageVideo.findMany({
      where: {
        status: "APPROVED",
        published: true,
      },
      orderBy: [
        { sortOrder: "asc" },
        { createdAt: "desc" },
      ],
      select: {
        id: true,
        title: true,
        description: true,
        url: true,
        thumbnail: true,
        sortOrder: true,
        rotation: true,
      },
    });

    return NextResponse.json(videos);
  } catch (error) {
    console.error("Public homepage video GET error:", error);
    return NextResponse.json(
      { error: "Failed to load videos." },
      { status: 500 }
    );
  }
}
