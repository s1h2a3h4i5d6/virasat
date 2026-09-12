"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { translate } from "./translations";

export type Language = "en" | "hi";

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (text: string | null | undefined) => string;
};

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (text) => text || "",
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem("virasat_lang") as Language | null;
      if (stored === "hi" || stored === "en") {
        setLanguageState(stored);
        document.documentElement.lang = stored;
      }
    } catch {
      // Storage access fail-safe
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem("virasat_lang", lang);
      document.documentElement.lang = lang;
    } catch {
      // Storage access fail-safe
    }
  };

  const toggleLanguage = () => {
    const next = language === "en" ? "hi" : "en";
    setLanguage(next);
  };

  const t = (text: string | null | undefined): string => {
    if (!text) return "";
    return translate(text, language);
  };

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage, toggleLanguage, t }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
