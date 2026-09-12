import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

const districtSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().min(2).max(120),
  stateId: z.string().min(1),
  imageUrl: z.string().trim().max(1000).optional().nullable(),
});

async function isAdmin() {
  const session = await getServerSession(authOptions);
  return !!session?.user?.id && session.user.role === "ADMIN";
}

export async function GET() {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const districts = await prisma.district.findMany({
      orderBy: [
        { state: { name: "asc" } },
        { name: "asc" },
      ],
      include: {
        state: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            heritage: true,
          },
        },
      },
    });

    return NextResponse.json(districts);
  } catch (error) {
    console.error("Admin districts GET error:", error);
    return NextResponse.json(
      { error: "Unable to load districts." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const result = districtSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Please provide valid district information." },
        { status: 400 }
      );
    }

    const state = await prisma.state.findUnique({
      where: { id: result.data.stateId },
      select: { id: true },
    });

    if (!state) {
      return NextResponse.json(
        { error: "Selected state does not exist." },
        { status: 400 }
      );
    }

    const district = await prisma.district.create({
      data: {
        name: result.data.name,
        slug: result.data.slug.toLowerCase(),
        stateId: result.data.stateId,
        imageUrl: result.data.imageUrl || null,
      },
      include: {
        state: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            heritage: true,
          },
        },
      },
    });

    return NextResponse.json(district, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "This district already exists in the selected state." },
        { status: 409 }
      );
    }

    console.error("Admin districts POST error:", error);

    return NextResponse.json(
      { error: "Unable to create district." },
      { status: 500 }
    );
  }
}
