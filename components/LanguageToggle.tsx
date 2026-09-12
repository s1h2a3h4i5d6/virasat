"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Languages } from "lucide-react";

export default function LanguageToggle({
  className = "",
}: {
  className?: string;
}) {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      title={
        language === "en"
          ? "Switch website to Hindi / वेबसाइट को हिन्दी में बदलें"
          : "Switch website to English / अंग्रेज़ी में बदलें"
      }
      aria-label="Toggle language"
      className={`group inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-white shadow-sm backdrop-blur-md transition hover:border-amber-400/40 hover:bg-white/[0.09] ${className}`}
    >
      <Languages
        size={15}
        className="text-amber-300 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110"
      />
      <div className="flex items-center gap-1.5">
        <span
          className={`transition-colors ${
            language === "en"
              ? "font-semibold text-white"
              : "text-white/40 hover:text-white/70"
          }`}
        >
          EN
        </span>
        <span className="text-white/20">|</span>
        <span
          className={`transition-colors ${
            language === "hi"
              ? "font-semibold text-amber-300"
              : "text-white/40 hover:text-white/70"
          }`}
        >
          हिन्दी
        </span>
      </div>
    </button>
  );
}
