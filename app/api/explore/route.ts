import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.trim() || "";
    const state = searchParams.get("state") || "";
    const district = searchParams.get("district") || "";
    const category = searchParams.get("category") || "";
    const preservation = searchParams.get("preservation") || "";
    const sort = searchParams.get("sort") || "newest";

    const heritage = await prisma.heritage.findMany({
      where: {
        AND: [
          search
            ? {
                OR: [
                  {
                    name: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                  {
                    shortDescription: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                  {
                    description: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                ],
              }
            : {},

          state
            ? {
                state: {
                  slug: state,
                },
              }
            : {},

          district
            ? {
                district: {
                  slug: district,
                },
              }
            : {},

          category
            ? {
                category: {
                  slug: category,
                },
              }
            : {},

          preservation
            ? {
                preservationStatus: preservation as
                  | "STABLE"
                  | "VULNERABLE"
                  | "ENDANGERED"
                  | "CRITICAL",
              }
            : {},
        ],
      },

      orderBy:
        sort === "name"
          ? {
              name: "asc",
            }
          : {
              createdAt: "desc",
            },

      include: {
        state: true,
        district: true,
        category: true,
        media: {
          take: 1,
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    return NextResponse.json(heritage);
  } catch (error) {
    console.error("Explore API error:", error);

    return NextResponse.json(
      {
        error: "Failed to load heritage records.",
      },
      {
        status: 500,
      }
    );
  }
}
