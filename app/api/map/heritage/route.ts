import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  try {
    const districtId =
      request.nextUrl.searchParams.get(
        "districtId"
      );

    if (!districtId) {
      return NextResponse.json(
        { error: "districtId is required" },
        { status: 400 }
      );
    }

    const heritage =
      await prisma.heritage.findMany({
        where: {
          districtId,
          verified: true,
        },
        orderBy: {
          name: "asc",
        },
        include: {
          category: true,
        },
      });

    return NextResponse.json(heritage);
  } catch (error) {
    console.error(
      "District heritage API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to load district heritage",
      },
      { status: 500 }
    );
  }
}