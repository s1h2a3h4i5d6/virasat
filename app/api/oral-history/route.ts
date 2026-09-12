import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.trim() || "";
    const stateId = searchParams.get("stateId") || "";
    const districtId = searchParams.get("districtId") || "";
    const language = searchParams.get("language")?.trim() || "";
    const category = searchParams.get("category")?.trim() || "";
    const type = searchParams.get("type")?.trim().toUpperCase() || "";

    const records = await prisma.oralHistory.findMany({
      where: {
        status: "APPROVED",
        verified: true,
        ...(search
          ? {
              OR: [
                {
                  title: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  speakerName: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  transcript: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              ],
            }
          : {}),
        ...(stateId ? { stateId } : {}),
        ...(districtId ? { districtId } : {}),
        ...(language
          ? {
              originalLanguage: {
                contains: language,
                mode: "insensitive",
              },
            }
          : {}),
        ...(category
          ? {
              category: {
                OR: [
                  { slug: category },
                  { id: category },
                ],
              },
            }
          : {}),
        ...(type && (type === "STORY" || type === "SONG")
          ? {
              type,
            }
          : {}),
      },
      include: {
        state: true,
        district: true,
        heritage: true,
        category: true,
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error("GET oral history error:", error);

    return NextResponse.json(
      {
        error: "Failed to load oral histories.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be logged in to submit an oral history." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const {
      title,
      speakerName,
      originalLanguage,
      transcript,
      translation,
      audioUrl,
      coverImageUrl,
      description,
      heritageId,
      stateId,
      districtId,
      categoryId,
      type,
    } = body;

    if (!title?.trim()) {
      return NextResponse.json(
        { error: "Story title is required." },
        { status: 400 }
      );
    }

    if (!originalLanguage?.trim()) {
      return NextResponse.json(
        { error: "Original language is required." },
        { status: 400 }
      );
    }

    const finalStateId = stateId || null;
    const finalDistrictId = finalStateId ? districtId || null : null;
    const finalType = String(type || "").trim().toUpperCase() === "SONG" ? "SONG" : "STORY";

    const record = await prisma.oralHistory.create({
      data: {
        title: title.trim(),
        speakerName: speakerName?.trim() || null,
        originalLanguage: originalLanguage.trim(),
        transcript: transcript?.trim() || null,
        translation: translation?.trim() || null,
        audioUrl: audioUrl || null,
        coverImageUrl: coverImageUrl || null,
        description: description?.trim() || null,
        heritageId: heritageId || null,
        stateId: finalStateId,
        districtId: finalDistrictId,
        categoryId: categoryId || null,
        type: finalType,
        userId: session.user.id,
        status: "PENDING",
        verified: false,
      },
      include: {
        category: true,
        state: true,
        district: true,
        heritage: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        record,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST oral history error:", error);

    return NextResponse.json(
      {
        error: "Failed to submit oral history.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
