import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

const contributionSchema = z.object({
  title: z.string().trim().min(3).max(200),
  content: z.string().trim().min(10).max(10000),
  heritageId: z.string().nullable().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be signed in to contribute." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const result = contributionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error:
            "Please provide a valid title and contribution of at least 10 characters.",
        },
        { status: 400 }
      );
    }

    if (result.data.heritageId) {
      const heritage = await prisma.heritage.findUnique({
        where: {
          id: result.data.heritageId,
        },
        select: {
          id: true,
        },
      });

      if (!heritage) {
        return NextResponse.json(
          { error: "The selected heritage record does not exist." },
          { status: 400 }
        );
      }
    }

    const contribution = await prisma.contribution.create({
      data: {
        title: result.data.title,
        content: result.data.content,
        heritageId: result.data.heritageId || null,
        userId: session.user.id,
        status: "PENDING",
      },
    });

    return NextResponse.json(
      {
        message: "Contribution submitted successfully.",
        contribution: {
          id: contribution.id,
          title: contribution.title,
          status: contribution.status,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Contribution error:", error);

    return NextResponse.json(
      { error: "Unable to submit contribution." },
      { status: 500 }
    );
  }
}