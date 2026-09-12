"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageContext";

type Slide = {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  buttonText: string | null;
  buttonUrl: string | null;
};

export default function Hero({ slides }: { slides: Slide[] }) {
  const { t } = useLanguage();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;

    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [slides.length]);

  if (!slides.length) {
    return (
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-stone-950 via-stone-900 to-black">
        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <p className="mb-5 text-sm uppercase tracking-[0.4em] text-white/50">
            {t("India's Living Heritage")}
          </p>

          <h1 className="font-serif text-5xl font-semibold tracking-tight text-white md:text-7xl">
            {t("Discover India.")}
            <br />
            {t("Experience India.")}
            <br />
            {t("Preserve India.")}
          </h1>
        </div>
      </section>
    );
  }

  const slide = slides[current];

  const previousSlide = () => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % slides.length);
  };

  return (
    <section className="relative min-h-screen overflow-hidden bg-black">
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2 }}
          className="absolute inset-0"
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url("${slide.imageUrl}")`,
            }}
          />

          {/* Gentle directional scrims to keep typography crisp without dimming the image */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/25 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 flex min-h-screen items-center">
        <div className="mx-auto w-full max-w-7xl px-6 pt-24 md:px-10 lg:px-12">
          <div className="max-w-3xl">
            <motion.div
              key={`eyebrow-${slide.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.7 }}
            >
              <p className="mb-5 text-xs font-medium uppercase tracking-[0.45em] text-white/80 drop-shadow-sm md:text-sm">
                {t("India's Living Heritage")}
              </p>
            </motion.div>

            <motion.h1
              key={`title-${slide.id}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="font-serif text-5xl font-semibold leading-[1.05] tracking-tight text-white drop-shadow-lg sm:text-6xl md:text-7xl lg:text-8xl"
            >
              {t(slide.title)}
            </motion.h1>

            {slide.subtitle && (
              <motion.p
                key={`subtitle-${slide.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.7 }}
                className="mt-6 max-w-2xl text-base leading-7 text-white/90 drop-shadow md:text-lg md:leading-8"
              >
                {t(slide.subtitle)}
              </motion.p>
            )}

            {slide.buttonText && slide.buttonUrl && (
              <motion.div
                key={`button-${slide.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.7 }}
                className="mt-8"
              >
                <Link
                  href={slide.buttonUrl}
                  className="group inline-flex items-center gap-3 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-black transition hover:bg-white/90"
                >
                  {t(slide.buttonText)}
                  <ArrowRight
                    size={17}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </Link>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-0 right-0 z-20">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 md:px-10 lg:px-12">
          <div className="flex items-center gap-2">
            {slides.map((item, index) => (
              <button
                key={item.id}
                type="button"
                aria-label={`Go to slide ${index + 1}`}
                onClick={() => setCurrent(index)}
                className="group p-1"
              >
                <span
                  className={`block h-1 rounded-full transition-all duration-500 ${
                    index === current
                      ? "w-12 bg-white"
                      : "w-5 bg-white/35 group-hover:bg-white/60"
                  }`}
                />
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous slide"
              onClick={previousSlide}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/20 text-white backdrop-blur-md transition hover:bg-white/15"
            >
              <ChevronLeft size={19} />
            </button>

            <button
              type="button"
              aria-label="Next slide"
              onClick={nextSlide}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/20 text-white backdrop-blur-md transition hover:bg-white/15"
            >
              <ChevronRight size={19} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
