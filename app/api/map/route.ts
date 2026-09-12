import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const states = await prisma.state.findMany({
      orderBy: {
        name: "asc",
      },
      include: {
        districts: {
          orderBy: {
            name: "asc",
          },
          include: {
            heritage: {
              orderBy: {
                name: "asc",
              },
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(states);
  } catch (error) {
    console.error("Map API error:", error);

    return NextResponse.json(
      { error: "Failed to load map data" },
      { status: 500 }
    );
  }
}
