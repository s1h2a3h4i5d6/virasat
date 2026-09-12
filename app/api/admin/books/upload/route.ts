import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { execFile } from "child_process";
import { promisify } from "util";

export const runtime = "nodejs";

const execFileAsync = promisify(execFile);

const metadataSchema = z.object({
  title: z.string().trim().min(2).max(200),
  slug: z.string().trim().min(2).max(200),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
});

async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== "ADMIN") {
    return false;
  }

  return true;
}

export async function POST(request: Request) {
  const isAdmin = await requireAdmin();

  if (!isAdmin) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  let tempPdfPath: string | null = null;

  try {
    const formData = await request.formData();

    const file = formData.get("file");
    const title = String(formData.get("title") || "");
    const slug = String(formData.get("slug") || "");
    const description = String(formData.get("description") || "");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Please upload a PDF file." },
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are allowed." },
        { status: 400 }
      );
    }

    const maxSize = 100 * 1024 * 1024;

    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "PDF size must be 100 MB or less." },
        { status: 400 }
      );
    }

    const metadata = metadataSchema.safeParse({
      title,
      slug,
      description,
    });

    if (!metadata.success) {
      return NextResponse.json(
        { error: "Please provide a valid book title and slug." },
        { status: 400 }
      );
    }

    const existingBook = await prisma.book.findFirst({
      where: {
        OR: [
          { title: metadata.data.title },
          { slug: metadata.data.slug },
        ],
      },
    });

    if (existingBook) {
      return NextResponse.json(
        { error: "A book with this title or slug already exists." },
        { status: 409 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const uploadId = crypto.randomUUID();

    const tempDirectory = path.join(
      process.cwd(),
      "public",
      "uploads",
      "book-pdfs",
      "temp"
    );

    const bookDirectory = path.join(
      process.cwd(),
      "public",
      "books",
      metadata.data.slug
    );

    await fs.mkdir(tempDirectory, { recursive: true });
    await fs.mkdir(bookDirectory, { recursive: true });

    tempPdfPath = path.join(
      tempDirectory,
      `${uploadId}.pdf`
    );

    await fs.writeFile(tempPdfPath, buffer);

    const outputPrefix = path.join(
      bookDirectory,
      "page"
    );

    await execFileAsync(
      "pdftoppm",
      [
        "-png",
        "-r",
        "130",
        tempPdfPath,
        outputPrefix,
      ],
      {
        windowsHide: true,
        maxBuffer: 1024 * 1024 * 20,
      }
    );

    const generatedFiles = (
      await fs.readdir(bookDirectory)
    )
      .filter(
        (name) =>
          name.startsWith("page-") &&
          name.toLowerCase().endsWith(".png")
      )
      .sort((a, b) => {
        const aNumber =
          Number(a.match(/page-(\d+)/)?.[1] || 0);

        const bNumber =
          Number(b.match(/page-(\d+)/)?.[1] || 0);

        return aNumber - bNumber;
      });

    if (generatedFiles.length === 0) {
      throw new Error(
        "PDF conversion completed but no pages were generated."
      );
    }

    const book = await prisma.$transaction(async (tx) => {
      const createdBook = await tx.book.create({
        data: {
          title: metadata.data.title,
          slug: metadata.data.slug,
          description:
            metadata.data.description || null,
          coverUrl: `/books/${metadata.data.slug}/${generatedFiles[0]}`,
        },
      });

      await tx.bookPage.createMany({
        data: generatedFiles.map((fileName, index) => ({
          bookId: createdBook.id,
          pageNo: index + 1,
          title: `Page ${index + 1}`,
          content: "",
          imageUrl: `/books/${metadata.data.slug}/${fileName}`,
        })),
      });

      return createdBook;
    });

    if (tempPdfPath) {
      await fs.unlink(tempPdfPath).catch(() => {});
      tempPdfPath = null;
    }

    return NextResponse.json(
      {
        message: "PDF uploaded and converted successfully.",
        book: {
          ...book,
          pageCount: generatedFiles.length,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("PDF book upload error:", error);

    if (tempPdfPath) {
      await fs.unlink(tempPdfPath).catch(() => {});
    }

    return NextResponse.json(
      {
        error:
          "Unable to process the PDF. Make sure the PDF is valid and try again.",
      },
      { status: 500 }
    );
  }
}
