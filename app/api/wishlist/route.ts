import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const wishlist = await prisma.favorite.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      heritage: {
        include: {
          state: true,
          district: true,
          category: true,
          media: {
            take: 1,
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json(wishlist);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const heritageId = body?.heritageId;

  if (!heritageId || typeof heritageId !== "string") {
    return NextResponse.json(
      { error: "heritageId is required" },
      { status: 400 }
    );
  }

  const heritage = await prisma.heritage.findUnique({
    where: { id: heritageId },
  });

  if (!heritage) {
    return NextResponse.json(
      { error: "Heritage not found" },
      { status: 404 }
    );
  }

  const existing = await prisma.favorite.findUnique({
    where: {
      userId_heritageId: {
        userId: session.user.id,
        heritageId,
      },
    },
  });

  if (existing) {
    await prisma.favorite.delete({
      where: {
        id: existing.id,
      },
    });

    return NextResponse.json({
      wishlisted: false,
      message: "Removed from wishlist",
    });
  }

  await prisma.favorite.create({
    data: {
      userId: session.user.id,
      heritageId,
    },
  });

  return NextResponse.json({
    wishlisted: true,
    message: "Added to wishlist",
  });
}
