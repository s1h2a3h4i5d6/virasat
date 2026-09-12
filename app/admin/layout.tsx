"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Map,
  Landmark,
  Tags,
  Images,
  Video,
  Mic2,
  BookOpen,
  Home,
  Compass,
  ClipboardCheck,
  ShieldCheck,
  Database,
  Brain,
  Trophy,
  BarChart3,
  Settings,
  ArrowLeft,
} from "lucide-react";

const sections = [
  {
    title: "Overview",
    items: [
      { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    ],
  },
  {
    title: "Geography",
    items: [
      { name: "States", href: "/admin/states", icon: Map },
      { name: "Districts", href: "/admin/districts", icon: Compass },
    ],
  },
  {
    title: "Heritage",
    items: [
      { name: "Traditions & Heritage", href: "/admin/heritage", icon: Landmark },
      { name: "Categories", href: "/admin/categories", icon: Tags },
      { name: "Preservation", href: "/admin/preservation", icon: ShieldCheck },
    ],
  },
  {
    title: "Media",
    items: [
      { name: "Photos", href: "/admin/media", icon: Images },
      { name: "Videos", href: "/admin/media/videos", icon: Video },
      { name: "Oral History", href: "/admin/oral-history", icon: Mic2 },
    ],
  },
  {
    title: "Digital Library",
    items: [
      { name: "Books", href: "/admin/books", icon: BookOpen },
    ],
  },
  {
    title: "Website Content",
    items: [
      { name: "Slideshow", href: "/admin/slideshow", icon: Home },
      { name: "Discover Cards", href: "/admin/discover", icon: Compass },
    ],
  },
  {
    title: "Community",
    items: [
      { name: "Contributions", href: "/admin/contributions", icon: ClipboardCheck },
      { name: "Verification", href: "/admin/verification", icon: ShieldCheck },
      { name: "Users", href: "/admin/users", icon: Users },
    ],
  },
  {
    title: "Knowledge",
    items: [
      { name: "Sources", href: "/admin/sources", icon: Database },
      { name: "AI Knowledge Base", href: "/admin/ai", icon: Brain },
    ],
  },
  {
    title: "Engagement",
    items: [
      { name: "Quizzes", href: "/admin/quizzes", icon: Trophy },
    ],
  },
  {
    title: "System",
    items: [
      { name: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-72 overflow-y-auto border-r border-white/10 bg-[#0d0d0d] lg:block">
        <div className="border-b border-white/10 px-6 py-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white font-serif text-xl font-bold text-black">
              V
            </div>

            <div>
              <div className="font-serif text-xl font-semibold">
                Virasat
              </div>
              <div className="text-[9px] uppercase tracking-[0.25em] text-white/40">
                Admin CMS
              </div>
            </div>
          </Link>
        </div>

        <div className="p-4">
          {sections.map((section) => (
            <div key={section.title} className="mb-6">
              <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">
                {section.title}
              </div>

              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active =
                    pathname === item.href ||
                    (item.href !== "/admin" &&
                      pathname?.startsWith(item.href));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                        active
                          ? "bg-white text-black"
                          : "text-white/60 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <Icon size={17} strokeWidth={1.8} />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 p-4">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/50 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft size={17} />
            Back to Website
          </Link>
        </div>
      </aside>

      <main className="min-h-screen lg:ml-72">
        <div className="border-b border-white/10 bg-[#0b0b0b]/90 px-5 py-4 backdrop-blur-xl lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-white/30">
                Virasat CMS
              </div>
              <h1 className="mt-1 text-lg font-semibold">
                Administration
              </h1>
            </div>

            <Link
              href="/"
              className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              View Website
            </Link>
          </div>
        </div>

        <div className="p-5 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
