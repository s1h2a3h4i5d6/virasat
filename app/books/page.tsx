import Link from "next/link";
import { BookOpen } from "lucide-react";
import { prisma } from "@/lib/prisma";

export default async function BooksPage() {
  const books = await prisma.book.findMany({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      title: true,
      slug: true,
      coverUrl: true,
    },
  });

  return (
    <main className="min-h-screen bg-[#faf9f6] text-[#171717]">

      {/* Header */}
      <section className="bg-[#151515] text-white">
        <div className="mx-auto max-w-7xl px-6 py-14 md:px-10 md:py-16">

          <div className="mb-7 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
              <BookOpen size={19} />
            </div>

            <div>
              <p className="text-lg font-semibold tracking-wide">
                Virasat
              </p>
              <p className="text-xs text-white/50">
                Digital Heritage Library
              </p>
            </div>
          </div>

          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
            Digital Heritage Library
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-6 text-white/60 md:text-base">
            Explore India’s history, traditions, architecture and living
            heritage through immersive digital books.
          </p>

        </div>
      </section>


      {/* Books */}
      <section className="mx-auto max-w-7xl px-6 py-14 md:px-10 md:py-16">

        {books.length === 0 ? (
          <div className="rounded-2xl border border-black/10 bg-white p-10 text-center">
            <BookOpen className="mx-auto mb-4" size={32} />
            <h2 className="text-lg font-semibold">
              No books available yet
            </h2>
            <p className="mt-2 text-sm text-black/50">
              Heritage books added by the administrator will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">

            {books.map((book) => (
              <Link
                key={book.id}
                href={`/books/${book.slug}/read`}
                className="group block"
              >

                {/* Square Cover */}
                <div className="relative aspect-square overflow-hidden rounded-2xl bg-[#e9e7e1] shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg">

                  {book.coverUrl ? (
                    <img
                      src={book.coverUrl}
                      alt={book.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <BookOpen
                        size={38}
                        strokeWidth={1.4}
                        className="text-black/30"
                      />
                    </div>
                  )}

                </div>

                {/* Title */}
                <h2 className="mt-3 line-clamp-2 text-center text-sm font-medium leading-5">
                  {book.title}
                </h2>

              </Link>
            ))}

          </div>
        )}

      </section>


      {/* Small Closing Text */}
      <section className="mx-auto max-w-2xl px-6 pb-14 pt-0 text-center">

        <div className="mx-auto mb-4 flex items-center justify-center gap-3">
          <span className="h-px w-8 bg-black/15" />

          <span className="text-sm font-medium text-[#a87542]">
            Virasat
          </span>

          <span className="h-px w-8 bg-black/15" />
        </div>

        <h2 className="text-base font-semibold">
          Built for immersive reading
        </h2>

        <p className="mx-auto mt-1 max-w-lg text-xs leading-5 text-black/45">
          Preserve heritage knowledge in a structured digital library
          that can be explored from anywhere.
        </p>

      </section>

    </main>
  );
}
