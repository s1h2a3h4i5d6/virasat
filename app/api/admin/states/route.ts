import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

const stateSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2000).optional().nullable(),
  imageUrl: z.string().trim().max(1000).optional().nullable(),
});

async function checkAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return null;
  }

  return session;
}

export async function GET() {
  try {
    const session = await checkAdmin();

    if (!session) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const states = await prisma.state.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            districts: true,
            heritage: true,
          },
        },
      },
    });

    return NextResponse.json(states);
  } catch (error) {
    console.error("Admin states GET error:", error);
    return NextResponse.json(
      { error: "Unable to load states." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await checkAdmin();

    if (!session) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const result = stateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Please provide a valid state name and slug." },
        { status: 400 }
      );
    }

    const state = await prisma.state.create({
      data: {
        name: result.data.name,
        slug: result.data.slug.toLowerCase(),
        description: result.data.description || null,
        imageUrl: result.data.imageUrl || null,
      },
    });

    return NextResponse.json(state, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "A state with this slug already exists." },
        { status: 409 }
      );
    }

    console.error("Admin states POST error:", error);

    return NextResponse.json(
      { error: "Unable to create state." },
      { status: 500 }
    );
  }
}
