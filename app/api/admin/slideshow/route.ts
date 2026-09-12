import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth/auth";

async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return false;
  }

  return true;
}

export async function GET() {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const slides = await prisma.slideshow.findMany({
      orderBy: {
        sortOrder: "asc",
      },
    });

    return NextResponse.json(slides);
  } catch (error) {
    console.error("GET slideshow error:", error);

    return NextResponse.json(
      { error: "Failed to load slideshow records" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const {
      title,
      subtitle,
      imageUrl,
      buttonText,
      buttonUrl,
      active,
      sortOrder,
    } = body;

    if (!title || !imageUrl) {
      return NextResponse.json(
        { error: "Title and image URL are required" },
        { status: 400 }
      );
    }

    const slide = await prisma.slideshow.create({
      data: {
        title: String(title).trim(),
        subtitle: subtitle ? String(subtitle).trim() : null,
        imageUrl: String(imageUrl).trim(),
        buttonText: buttonText ? String(buttonText).trim() : null,
        buttonUrl: buttonUrl ? String(buttonUrl).trim() : null,
        active: Boolean(active),
        sortOrder: Number(sortOrder) || 0,
      },
    });

    return NextResponse.json(slide, { status: 201 });
  } catch (error) {
    console.error("POST slideshow error:", error);

    return NextResponse.json(
      { error: "Failed to create slideshow record" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const {
      id,
      title,
      subtitle,
      imageUrl,
      buttonText,
      buttonUrl,
      active,
      sortOrder,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Slide ID is required" },
        { status: 400 }
      );
    }

    if (!title || !imageUrl) {
      return NextResponse.json(
        { error: "Title and image URL are required" },
        { status: 400 }
      );
    }

    const slide = await prisma.slideshow.update({
      where: {
        id: String(id),
      },
      data: {
        title: String(title).trim(),
        subtitle: subtitle ? String(subtitle).trim() : null,
        imageUrl: String(imageUrl).trim(),
        buttonText: buttonText ? String(buttonText).trim() : null,
        buttonUrl: buttonUrl ? String(buttonUrl).trim() : null,
        active: Boolean(active),
        sortOrder: Number(sortOrder) || 0,
      },
    });

    return NextResponse.json(slide);
  } catch (error) {
    console.error("PUT slideshow error:", error);

    return NextResponse.json(
      { error: "Failed to update slideshow record" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { error: "Slide ID is required" },
        { status: 400 }
      );
    }

    await prisma.slideshow.delete({
      where: {
        id: String(body.id),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Slide deleted successfully",
    });
  } catch (error) {
    console.error("DELETE slideshow error:", error);

    return NextResponse.json(
      { error: "Failed to delete slideshow record" },
      { status: 500 }
    );
  }
}
