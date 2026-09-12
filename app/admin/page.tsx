import Link from "next/link";
import {
  Landmark,
  Map,
  Images,
  BookOpen,
  Users,
  ClipboardCheck,
  Plus,
  ArrowRight,
} from "lucide-react";
import { prisma } from "@/lib/db/prisma";

export default async function AdminDashboard() {
  const [
    states,
    districts,
    heritage,
    media,
    books,
    users,
    pendingContributions,
  ] = await Promise.all([
    prisma.state.count(),
    prisma.district.count(),
    prisma.heritage.count(),
    prisma.media.count(),
    prisma.book.count(),
    prisma.user.count(),
    prisma.contribution.count({
      where: { status: "PENDING" },
    }),
  ]);

  const stats = [
    {
      label: "States",
      value: states,
      icon: Map,
      href: "/admin/states",
    },
    {
      label: "Districts",
      value: districts,
      icon: Map,
      href: "/admin/districts",
    },
    {
      label: "Heritage Records",
      value: heritage,
      icon: Landmark,
      href: "/admin/heritage",
    },
    {
      label: "Media",
      value: media,
      icon: Images,
      href: "/admin/media",
    },
    {
      label: "Books",
      value: books,
      icon: BookOpen,
      href: "/admin/books",
    },
    {
      label: "Users",
      value: users,
      icon: Users,
      href: "/admin/users",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8">
        <div className="text-xs uppercase tracking-[0.25em] text-white/30">
          Control Centre
        </div>

        <h2 className="mt-2 font-serif text-4xl font-semibold">
          Welcome to Virasat Admin
        </h2>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">
          Manage India's living heritage, traditions, media, books,
          community contributions and every piece of content displayed
          across the Virasat platform.
        </p>
      </div>

      {pendingContributions > 0 && (
        <Link
          href="/admin/contributions"
          className="mb-8 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition hover:bg-white/[0.07]"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-black">
              <ClipboardCheck size={21} />
            </div>

            <div>
              <div className="font-medium">
                Contributions waiting for review
              </div>
              <div className="mt-1 text-sm text-white/40">
                {pendingContributions} pending contribution
                {pendingContributions !== 1 ? "s" : ""}
              </div>
            </div>
          </div>

          <ArrowRight size={20} className="text-white/40" />
        </Link>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:-translate-y-0.5 hover:bg-white/[0.06]"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05]">
                  <Icon size={20} className="text-white/70" />
                </div>

                <ArrowRight
                  size={18}
                  className="text-white/20 transition group-hover:translate-x-1 group-hover:text-white/60"
                />
              </div>

              <div className="mt-6">
                <div className="text-3xl font-semibold">
                  {stat.value}
                </div>

                <div className="mt-1 text-sm text-white/40">
                  {stat.label}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold">
              Quick Actions
            </h3>

            <p className="mt-1 text-sm text-white/40">
              Frequently used content management actions
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Link
            href="/admin/heritage/new"
            className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:bg-white/[0.07]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black">
              <Plus size={19} />
            </div>

            <div>
              <div className="font-medium">Add Heritage</div>
              <div className="text-xs text-white/40">
                Create tradition or heritage record
              </div>
            </div>
          </Link>

          <Link
            href="/admin/states"
            className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:bg-white/[0.07]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black">
              <Map size={19} />
            </div>

            <div>
              <div className="font-medium">Manage Geography</div>
              <div className="text-xs text-white/40">
                States and districts
              </div>
            </div>
          </Link>

          <Link
            href="/admin/books"
            className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:bg-white/[0.07]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black">
              <BookOpen size={19} />
            </div>

            <div>
              <div className="font-medium">Manage Books</div>
              <div className="text-xs text-white/40">
                Digital heritage library
              </div>
            </div>
          </Link>

          <Link
            href="/admin/contributions"
            className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:bg-white/[0.07]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black">
              <ClipboardCheck size={19} />
            </div>

            <div>
              <div className="font-medium">Review Contributions</div>
              <div className="text-xs text-white/40">
                Verify community submissions
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
