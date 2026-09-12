import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

export const runtime = "nodejs";

const allowedMimeTypes: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No image file was provided." },
        { status: 400 }
      );
    }

    const extension = allowedMimeTypes[file.type.toLowerCase()];

    if (!extension) {
      return NextResponse.json(
        {
          error:
            "Unsupported image format. Please upload JPG, PNG, WEBP, or GIF.",
        },
        { status: 400 }
      );
    }

    const maxSize = 10 * 1024 * 1024; // 10 MB

    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Image file is too large. Maximum size is 10 MB." },
        { status: 400 }
      );
    }

    const uploadDirectory = path.join(
      process.cwd(),
      "public",
      "uploads",
      "categories"
    );

    await fs.mkdir(uploadDirectory, {
      recursive: true,
    });

    const filename = `${crypto.randomUUID()}${extension}`;
    const filePath = path.join(uploadDirectory, filename);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await fs.writeFile(filePath, buffer);

    const url = `/uploads/categories/${filename}`;

    return NextResponse.json(
      {
        message: "Category image uploaded successfully.",
        url,
        filename,
        size: file.size,
        type: file.type,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Admin category upload error:", error);

    return NextResponse.json(
      { error: "Failed to upload image. Please try again." },
      { status: 500 }
    );
  }
}
