"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Languages, Check } from "lucide-react";

export default function LanguageFloatingPill() {
  const { language, toggleLanguage } = useLanguage();

  return (
    <aside
      aria-label="Language selection"
      className="fixed bottom-6 right-6 z-40"
    >
      <button
        type="button"
        onClick={toggleLanguage}
        className="group flex items-center gap-2.5 rounded-full border border-white/20 bg-neutral-900/90 px-4 py-2.5 text-xs font-medium text-white shadow-2xl backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:border-amber-400/60 hover:bg-black hover:shadow-amber-500/10"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-400/15 text-amber-300 transition group-hover:bg-amber-400/25">
          <Languages size={14} />
        </span>

        <span className="flex items-center gap-1.5 font-medium tracking-wide">
          {language === "en" ? (
            <>
              <span>Language:</span>
              <span className="font-semibold text-amber-300">हिन्दी</span>
            </>
          ) : (
            <>
              <span>भाषा:</span>
              <span className="font-semibold text-amber-300">English</span>
            </>
          )}
        </span>

        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/70">
          {language === "en" ? "Switch" : "बदलें"}
        </span>
      </button>
    </aside>
  );
}
