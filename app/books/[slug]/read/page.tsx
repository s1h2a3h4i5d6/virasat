import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import BookReader from "@/components/books/BookReader";

export default async function BookReadPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const book = await prisma.book.findUnique({
    where: {
      slug,
    },
    include: {
      pages: {
        orderBy: {
          pageNo: "asc",
        },
        select: {
          id: true,
          pageNo: true,
          title: true,
          content: true,
          imageUrl: true,
        },
      },
    },
  });

  if (!book) {
    notFound();
  }

  return (
    <BookReader
      slug={book.slug}
      title={book.title}
      pages={book.pages}
    />
  );
}
