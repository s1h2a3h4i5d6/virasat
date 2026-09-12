import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        imageUrl: true,
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Categories API error:", error);

    return NextResponse.json(
      {
        error: "Failed to load categories.",
      },
      {
        status: 500,
      }
    );
  }
}
