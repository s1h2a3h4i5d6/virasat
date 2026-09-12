import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be logged in to upload a cover photo." },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No cover image file was provided." },
        { status: 400 }
      );
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Cover image must be 5 MB or smaller." },
        { status: 400 }
      );
    }

    const originalName = file.name || "cover-image";
    const extension = path.extname(originalName).toLowerCase();

    const allowedExtensions = [
      ".jpg",
      ".jpeg",
      ".png",
      ".webp",
    ];

    if (!allowedExtensions.includes(extension)) {
      return NextResponse.json(
        {
          error:
            "Unsupported cover image format. Please upload JPG, JPEG, PNG, or WEBP.",
        },
        { status: 400 }
      );
    }

    const allowedMimeTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (file.type && !allowedMimeTypes.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        {
          error:
            "Invalid image type. Please upload a JPG, JPEG, PNG, or WEBP image.",
        },
        { status: 400 }
      );
    }

    const uploadDirectory = path.join(
      process.cwd(),
      "public",
      "uploads",
      "oral-history"
    );

    await fs.mkdir(uploadDirectory, { recursive: true });

    const fileName = `${crypto.randomUUID()}${extension}`;
    const filePath = path.join(uploadDirectory, fileName);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await fs.writeFile(filePath, buffer);

    const url = `/uploads/oral-history/${fileName}`;

    return NextResponse.json({
      success: true,
      url,
      fileName,
      originalName,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error("Cover upload error:", error);

    return NextResponse.json(
      { error: "Server action failed while uploading the cover image." },
      { status: 500 }
    );
  }
}
