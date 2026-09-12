"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import {
  Menu,
  X,
  Search,
  Map,
  BookOpen,
  Sparkles,
  Image,
  Mic2,
  User,
  LogOut,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import LanguageToggle from "@/components/LanguageToggle";

const navItems = [
  { label: "Explore", href: "/explore", icon: Search },
  { label: "Heritage Map", href: "/map", icon: Map },
  { label: "Media", href: "/media", icon: Image },
  { label: "Voices", href: "/oral-history", icon: Mic2 },
  { label: "Books", href: "/books", icon: BookOpen },
  { label: "Ask AI", href: "/ai", icon: Sparkles },
];

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  if (pathname.startsWith("/books/") && pathname.endsWith("/read")) {
    return null;
  }

  const user = session?.user;

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 text-white backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link
          href="/"
          className="font-serif text-2xl font-semibold tracking-wide"
        >
          {t("Virasat")}
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm transition ${
                  active
                    ? "bg-white text-black"
                    : "text-white/55 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon size={15} />
                {t(item.label)}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <LanguageToggle />

          {user ? (
            <>
              {user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/60 hover:bg-white/10 hover:text-white"
                >
                  {t("Admin")}
                </Link>
              )}

              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-white/60 hover:bg-white/10 hover:text-white"
              >
                <User size={15} />
                {t("Profile")}
              </Link>

              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded-xl p-2 text-white/40 transition hover:bg-white/10 hover:text-white"
                title={t("Sign out")}
              >
                <LogOut size={17} />
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-xl px-4 py-2 text-sm text-white/55 hover:text-white"
              >
                {t("Login")}
              </Link>

              <Link
                href="/register"
                className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/90"
              >
                {t("Register")}
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <LanguageToggle />

          <button
            onClick={() => setOpen(!open)}
            className="rounded-xl border border-white/10 p-2"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-white/10 px-6 py-5 lg:hidden">
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/60 hover:bg-white/10 hover:text-white"
                >
                  <Icon size={17} />
                  {t(item.label)}
                </Link>
              );
            })}

            <Link
              href={user ? "/profile" : "/login"}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/60 hover:bg-white/10 hover:text-white"
            >
              <User size={17} />
              {user ? t("Profile") : t("Login")}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

