import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

const bookSchema = z.object({
  title: z.string().trim().min(2).max(200),
  slug: z.string().trim().min(2).max(200),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  coverUrl: z.string().trim().max(1000).optional().or(z.literal("")),
});

async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== "ADMIN") {
    return null;
  }

  return session;
}

export async function GET() {
  const session = await requireAdmin();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const books = await prisma.book.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        _count: {
          select: {
            pages: true,
          },
        },
      },
    });

    return NextResponse.json(books);
  } catch (error) {
    console.error("Books GET error:", error);

    return NextResponse.json(
      { error: "Unable to load books." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await requireAdmin();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = bookSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Please provide a valid title and slug." },
        { status: 400 }
      );
    }

    const existingBook = await prisma.book.findFirst({
      where: {
        OR: [
          { title: result.data.title },
          { slug: result.data.slug },
        ],
      },
    });

    if (existingBook) {
      return NextResponse.json(
        { error: "A book with this title or slug already exists." },
        { status: 409 }
      );
    }

    const book = await prisma.book.create({
      data: {
        title: result.data.title,
        slug: result.data.slug,
        description: result.data.description || null,
        coverUrl: result.data.coverUrl || null,
      },
    });

    return NextResponse.json(book, { status: 201 });
  } catch (error) {
    console.error("Books POST error:", error);

    return NextResponse.json(
      { error: "Unable to create book." },
      { status: 500 }
    );
  }
}
