import Link from "next/link";
import { getServerSession } from "next-auth";
import {
  Heart,
  MapPin,
  ArrowRight,
  Bookmark,
  User,
} from "lucide-react";

import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import WishlistActions from "@/components/profile/WishlistActions";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return (
      <main className="min-h-screen bg-[#0b0b0b] px-6 pt-32 text-white">
        <div className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center">
          <User className="mx-auto text-white/40" size={40} />
          <h1 className="mt-5 text-3xl font-semibold">Login Required</h1>
          <p className="mt-3 text-white/50">
            Please login to view your profile, wishlist and visited heritage.
          </p>
          <Link
            href="/login"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-medium text-black"
          >
            Login
            <ArrowRight size={16} />
          </Link>
        </div>
      </main>
    );
  }

  const user = await prisma.user.findUnique({
    where: {
      email: session.user.email,
    },
    include: {
      contributions: {
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      },
      favorites: {
        orderBy: {
          createdAt: "desc",
        },
        include: {
          heritage: {
            include: {
              state: true,
              district: true,
              category: true,
              media: true,
            },
          },
        },
      },
      heritageVisits: {
        orderBy: {
          visitedAt: "desc",
        },
        include: {
          heritage: {
            include: {
              state: true,
              district: true,
              category: true,
              media: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#0b0b0b] px-6 pb-20 pt-32 text-white">
      <div className="mx-auto max-w-7xl">

        <section className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-amber-950/30 via-white/[0.03] to-transparent p-8 sm:p-10">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-center">

            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-400/10">
                  <User className="text-amber-300" size={25} />
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                    My Profile
                  </p>

                  <h1 className="mt-1 text-3xl font-semibold sm:text-4xl">
                    {user.name || "Heritage Explorer"}
                  </h1>
                </div>
              </div>

              <p className="mt-5 text-sm text-white/45">
                {user.email}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <StatCard label="Wishlist" value={user.favorites.length} />
              <StatCard label="Visited" value={user.heritageVisits.length} />
              <StatCard label="Contributions" value={user.contributions.length} />
            </div>

          </div>
        </section>

        <section className="mt-14">

          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <Heart className="text-rose-300" size={20} />
                <h2 className="text-2xl font-medium">My Wishlist</h2>
              </div>

              <p className="mt-2 text-sm text-white/40">
                Heritage you want to explore later.
              </p>
            </div>

            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/50">
              {user.favorites.length} saved
            </span>
          </div>

          {user.favorites.length === 0 ? (
            <EmptyState
              icon={<Heart size={30} />}
              title="Your wishlist is empty"
              description="Explore Virasat and save heritage that you want to discover later."
              href="/explore"
              button="Explore Heritage"
            />
          ) : (
            <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

              {user.favorites.map((favorite) => (
                <div
                  key={favorite.id}
                  className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]"
                >

                  <HeritageCard
                    heritage={favorite.heritage}
                    label="Wishlist"
                  />

                  <div className="border-t border-white/10 p-4">
                    <WishlistActions
                      heritageId={favorite.heritage.id}
                    />
                  </div>

                </div>
              ))}

            </div>
          )}

        </section>

        <section className="mt-16">

          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <MapPin className="text-emerald-300" size={20} />
                <h2 className="text-2xl font-medium">
                  Visited Heritage
                </h2>
              </div>

              <p className="mt-2 text-sm text-white/40">
                Places and traditions you have marked as visited.
              </p>
            </div>

            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/50">
              {user.heritageVisits.length} visited
            </span>
          </div>

          {user.heritageVisits.length === 0 ? (
            <EmptyState
              icon={<MapPin size={30} />}
              title="Nothing marked as visited yet"
              description="When you explore a heritage record, mark it as visited and it will appear here."
              href="/explore"
              button="Start Exploring"
            />
          ) : (
            <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

              {user.heritageVisits.map((visit) => (
                <HeritageCard
                  key={visit.id}
                  heritage={visit.heritage}
                  label="Visited"
                />
              ))}

            </div>
          )}

        </section>

        <section className="mt-16">

          <div className="flex items-center gap-3">
            <Bookmark className="text-amber-300" size={20} />
            <h2 className="text-2xl font-medium">
              My Contributions
            </h2>
          </div>

          <p className="mt-2 text-sm text-white/40">
            Your submitted heritage knowledge and stories.
          </p>

          {user.contributions.length === 0 ? (
            <EmptyState
              icon={<Bookmark size={30} />}
              title="No contributions yet"
              description="Help preserve India's living heritage by contributing knowledge to Virasat."
              href="/contribute"
              button="Contribute Heritage"
            />
          ) : (
            <div className="mt-7 space-y-3">

              {user.contributions.map((contribution) => (
                <div
                  key={contribution.id}
                  className="flex flex-col justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:flex-row sm:items-center"
                >

                  <div>
                    <h3 className="font-medium">
                      {contribution.title}
                    </h3>

                    <p className="mt-1 line-clamp-1 text-sm text-white/40">
                      {contribution.content}
                    </p>
                  </div>

                  <span
                    className={`w-fit rounded-full px-3 py-1 text-xs ${
                      contribution.status === "APPROVED"
                        ? "bg-emerald-500/10 text-emerald-300"
                        : contribution.status === "REJECTED"
                          ? "bg-red-500/10 text-red-300"
                          : "bg-amber-500/10 text-amber-300"
                    }`}
                  >
                    {contribution.status}
                  </span>

                </div>
              ))}

            </div>
          )}

        </section>

      </div>
    </main>
  );
}

function HeritageCard({
  heritage,
  label,
}: {
  heritage: any;
  label: string;
}) {
  const image = heritage.media?.find((item: any) => {
    const type = item.type?.toLowerCase();
    return type === "photo" || type === "image";
  });
  const imageUrl = image?.url || heritage.media?.[0]?.url || heritage.category?.imageUrl;

  return (
    <Link
      href={`/heritage/${heritage.slug}`}
      className="group block"
    >

      <div className="relative aspect-[16/9] overflow-hidden bg-white/5">

        {imageUrl ? (
          <img
            src={imageUrl}
            alt={image?.title || heritage.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-white/20">
            <MapPin size={35} />
          </div>
        )}

        <div className="absolute left-4 top-4">
          <span className="rounded-full border border-white/15 bg-black/60 px-3 py-1.5 text-xs text-white/70 backdrop-blur">
            {label}
          </span>
        </div>

      </div>

      <div className="p-5">

        {heritage.category && (
          <p className="text-xs uppercase tracking-[0.15em] text-amber-300/70">
            {heritage.category.name}
          </p>
        )}

        <h3 className="mt-2 text-xl font-medium">
          {heritage.name}
        </h3>

        <div className="mt-3 flex items-center gap-2 text-sm text-white/40">
          <MapPin size={14} />
          {[heritage.district?.name, heritage.state?.name]
            .filter(Boolean)
            .join(", ")}
        </div>

        <div className="mt-5 flex items-center gap-2 text-sm text-white/50 transition group-hover:text-white">
          View Heritage
          <ArrowRight size={15} />
        </div>

      </div>

    </Link>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="min-w-[85px] rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-center">
      <p className="text-2xl font-semibold">{value}</p>

      <p className="mt-1 text-[10px] uppercase tracking-wider text-white/35">
        {label}
      </p>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
  href,
  button,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  button: string;
}) {
  return (
    <div className="mt-7 rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">

      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/30">
        {icon}
      </div>

      <h3 className="mt-5 text-lg font-medium">
        {title}
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/40">
        {description}
      </p>

      <Link
        href={href}
        className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
      >
        {button}
        <ArrowRight size={15} />
      </Link>

    </div>
  );
}
