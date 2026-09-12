import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

export const runtime = "nodejs";

const allowedTypes: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "audio/mpeg": ".mp3",
  "audio/wav": ".wav",
  "audio/ogg": ".ogg",
  "application/pdf": ".pdf",
};

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No file was provided." },
        { status: 400 }
      );
    }

    const extension = allowedTypes[file.type];

    if (!extension) {
      return NextResponse.json(
        {
          error:
            "Unsupported file type. Allowed: JPG, PNG, WEBP, GIF, MP4, WEBM, MP3, WAV, OGG and PDF.",
        },
        { status: 400 }
      );
    }

    const maxSize = 50 * 1024 * 1024;

    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error:
            "File is too large. Maximum size is 50 MB.",
        },
        { status: 400 }
      );
    }

    const uploadDirectory = path.join(
      process.cwd(),
      "public",
      "uploads",
      "media"
    );

    await mkdir(uploadDirectory, {
      recursive: true,
    });

    const filename =
      crypto.randomUUID() + extension;

    const filePath = path.join(
      uploadDirectory,
      filename
    );

    const bytes = await file.arrayBuffer();

    await writeFile(
      filePath,
      Buffer.from(bytes)
    );

    const url =
      `/uploads/media/${filename}`;

    return NextResponse.json(
      {
        message:
          "File uploaded successfully.",
        url,
        filename,
        type: file.type,
        size: file.size,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Media upload error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to upload file. Check the server console.",
      },
      { status: 500 }
    );
  }
}
