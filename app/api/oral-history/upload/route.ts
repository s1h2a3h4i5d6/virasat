import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to upload audio." },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No audio file was provided." },
        { status: 400 }
      );
    }

    const maxSize = 15 * 1024 * 1024;

    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Audio file must be 15 MB or smaller." },
        { status: 400 }
      );
    }

    const originalName = file.name.toLowerCase();

    const allowedExtensions = [
      ".mp3",
      ".mpeg",
      ".mpga",
      ".wav",
      ".wave",
      ".m4a",
      ".ogg",
      ".oga",
      ".webm",
      ".aac",
    ];

    const extension = allowedExtensions.find((ext) =>
      originalName.endsWith(ext)
    );

    if (!extension) {
      return NextResponse.json(
        {
          error:
            "Unsupported audio format. Please upload MP3, MPEG, WAV, M4A, OGG, AAC, or WEBM.",
        },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDirectory = path.join(
      process.cwd(),
      "public",
      "uploads",
      "oral-history"
    );

    await fs.mkdir(uploadDirectory, { recursive: true });

    const fileName = `${randomUUID()}${extension}`;
    const filePath = path.join(uploadDirectory, fileName);

    await fs.writeFile(filePath, buffer);

    const url = `/uploads/oral-history/${fileName}`;

    return NextResponse.json({
      success: true,
      url,
      fileName,
      originalName: file.name,
      size: file.size,
      type: file.type || "audio/mpeg",
    });
  } catch (error) {
    console.error("Oral history audio upload error:", error);

    return NextResponse.json(
      { error: "Audio upload failed. Please try again." },
      { status: 500 }
    );
  }
}
