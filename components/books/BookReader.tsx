"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  Minus,
  Plus,
  RotateCcw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type BookPage = {
  id?: string;
  pageNo: number;
  title: string | null;
  content: string;
  imageUrl: string | null;
};

type BookReaderProps = {
  slug: string;
  title: string;
  pages: BookPage[];
};

const pageFlipVariants = {
  enter: (direction: number) => ({
    rotateY: direction > 0 ? 0 : -85,
    rotateZ: direction > 0 ? 0 : 2,
    scale: direction > 0 ? 0.98 : 1,
    opacity: direction > 0 ? 0.92 : 0.4,
    transformOrigin: "left center",
    zIndex: direction > 0 ? 1 : 20,
    filter: direction > 0 ? "brightness(0.92)" : "brightness(1)",
    boxShadow:
      direction > 0
        ? "0 4px 10px rgba(0,0,0,0.1)"
        : "-14px 12px 30px rgba(0,0,0,0.35)",
    transition: {
      duration: 0.52,
      ease: [0.25, 1, 0.5, 1] as const,
    },
  }),
  center: {
    rotateY: 0,
    rotateZ: 0,
    scale: 1,
    opacity: 1,
    transformOrigin: "left center",
    zIndex: 10,
    filter: "brightness(1)",
    boxShadow:
      "0 15px 30px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.2)",
    transition: {
      duration: 0.52,
      ease: [0.25, 1, 0.5, 1] as const,
    },
  },
  exit: (direction: number) => ({
    rotateY: direction > 0 ? -85 : 0,
    rotateZ: direction > 0 ? -2 : 0,
    scale: direction > 0 ? 1 : 0.98,
    opacity: direction > 0 ? [1, 0.85, 0] : [1, 0.7, 0],
    transformOrigin: "left center",
    zIndex: direction > 0 ? 20 : 1,
    filter: direction > 0 ? "brightness(0.85)" : "brightness(0.92)",
    boxShadow:
      direction > 0
        ? "-20px 15px 35px rgba(0,0,0,0.45)"
        : "0 4px 10px rgba(0,0,0,0.1)",
    transition: {
      duration: 0.52,
      ease: [0.35, 0, 0.65, 1] as const,
    },
  }),
};

export default function BookReader({
  slug,
  title,
  pages,
}: BookReaderProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isTurning, setIsTurning] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const page = pages[currentPage];

  const imageSrc =
    page?.imageUrl ||
    (slug === "karnataka-the-living-heritage"
      ? `/books/karnataka-the-living-heritage/page-${String(
          page?.pageNo || currentPage + 1
        ).padStart(2, "0")}.png`
      : slug === "top-15-historic-forts-shivaji-maharaj"
      ? `/books/top-15-forts-pages/page-${String(
          page?.pageNo || currentPage + 1
        ).padStart(2, "0")}.png`
      : null);

  const nextPage = useCallback(() => {
    if (currentPage >= pages.length - 1 || isTurning) return;
    setDirection(1);
    setIsTurning(true);
    setCurrentPage((prev) => Math.min(prev + 1, pages.length - 1));
    setTimeout(() => setIsTurning(false), 580);
  }, [currentPage, pages.length, isTurning]);

  const previousPage = useCallback(() => {
    if (currentPage <= 0 || isTurning) return;
    setDirection(-1);
    setIsTurning(true);
    setCurrentPage((prev) => Math.max(prev - 1, 0));
    setTimeout(() => setIsTurning(false), 580);
  }, [currentPage, isTurning]);

  const zoomIn = () => {
    setZoom((prev) => Math.min(prev + 10, 200));
  };

  const zoomOut = () => {
    setZoom((prev) => Math.max(prev - 10, 50));
  };

  const resetZoom = () => {
    setZoom(100);
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    const handleKeyboard = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        nextPage();
      }

      if (event.key === "ArrowLeft") {
        previousPage();
      }

      if (event.key === "+" || event.key === "=") {
        setZoom((prev) => Math.min(prev + 10, 200));
      }

      if (event.key === "-") {
        setZoom((prev) => Math.max(prev - 10, 50));
      }

      if (event.key === "0") {
        setZoom(100);
      }

      if (event.key === "Escape" && document.fullscreenElement) {
        document.exitFullscreen();
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    window.addEventListener("keydown", handleKeyboard);

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange
      );
      window.removeEventListener("keydown", handleKeyboard);
    };
  }, [nextPage, previousPage]);

  if (!page) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>No pages available for this book.</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f5ef]">
      <div
        className={`mx-auto w-full ${
          isFullscreen ? "h-screen max-w-none" : "max-w-7xl"
        }`}
      >
        {!isFullscreen && (
          <div className="px-4 pt-6 sm:px-6">
            <Link
              href="/books"
              className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-gray-100"
            >
              <ArrowLeft size={16} />
              Back to Books
            </Link>

            <h1 className="mt-5 text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
              {title}
            </h1>
          </div>
        )}

        <section
          className={`${
            isFullscreen
              ? "flex h-screen flex-col bg-black"
              : "mt-6 px-4 pb-8 sm:px-6"
          }`}
        >
          {/* Toolbar */}
          <div
            className={`flex flex-wrap items-center justify-between gap-3 ${
              isFullscreen
                ? "border-b border-gray-300 bg-white px-4 py-3 text-gray-900"
                : "rounded-2xl border border-gray-300 bg-white px-4 py-3 text-gray-900"
            }`}
          >
            <div className="flex items-center gap-2">
              <button
                onClick={previousPage}
                disabled={currentPage === 0 || isTurning}
                className="rounded-lg border border-gray-300 bg-white p-2 text-gray-900 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
                title="Previous page"
              >
                <ChevronLeft size={20} />
              </button>

              <span className="min-w-[90px] text-center text-sm font-semibold text-gray-900">
                {currentPage + 1} / {pages.length}
              </span>

              <button
                onClick={nextPage}
                disabled={currentPage === pages.length - 1 || isTurning}
                className="rounded-lg border border-gray-300 bg-white p-2 text-gray-900 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
                title="Next page"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={zoomOut}
                disabled={zoom <= 50}
                className="rounded-lg border border-gray-300 bg-white p-2 text-gray-900 transition hover:bg-gray-100 disabled:opacity-30"
                title="Zoom out"
              >
                <Minus size={18} />
              </button>

              <span className="min-w-[55px] text-center text-sm font-semibold text-gray-900">
                {zoom}%
              </span>

              <button
                onClick={zoomIn}
                disabled={zoom >= 200}
                className="rounded-lg border border-gray-300 bg-white p-2 text-gray-900 transition hover:bg-gray-100 disabled:opacity-30"
                title="Zoom in"
              >
                <Plus size={18} />
              </button>

              <button
                onClick={resetZoom}
                className="rounded-lg border border-gray-300 bg-white p-2 text-gray-900 transition hover:bg-gray-100"
                title="Reset zoom"
              >
                <RotateCcw size={17} />
              </button>

              <button
                onClick={toggleFullscreen}
                className="rounded-lg border border-gray-300 bg-white p-2 text-gray-900 transition hover:bg-gray-100"
                title="Fullscreen"
              >
                {isFullscreen ? (
                  <Minimize size={18} />
                ) : (
                  <Maximize size={18} />
                )}
              </button>
            </div>
          </div>

          {/* Book page */}
          <div
            className={`${
              isFullscreen
                ? "flex-1 overflow-auto bg-gray-900"
                : "mt-4 rounded-2xl border border-gray-300 bg-[#e9e5da] p-3 shadow-sm sm:p-5"
            }`}
          >
            <div
              className={`flex min-h-full items-start justify-center overflow-x-auto ${
                isFullscreen ? "p-4 sm:p-8" : "py-2"
              }`}
              style={{
                perspective: "2200px",
                perspectiveOrigin: "50% 50%",
              }}
            >
              <div
                className="relative grid w-full justify-items-center items-start"
                style={{
                  gridTemplateColumns: "1fr",
                  gridTemplateRows: "1fr",
                  perspective: "2200px",
                  transformStyle: "preserve-3d",
                }}
              >
                <AnimatePresence custom={direction} initial={false}>
                  <motion.div
                    key={currentPage}
                    custom={direction}
                    variants={pageFlipVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    onAnimationComplete={() => setIsTurning(false)}
                    className="col-start-1 row-start-1 relative flex flex-col items-center justify-center select-none"
                    style={{
                      transformStyle: "preserve-3d",
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                      willChange: "transform, opacity, filter",
                    }}
                  >
                    {imageSrc ? (
                      <div
                        className="relative inline-block overflow-hidden rounded-lg shadow-2xl transition-all duration-200"
                        style={{
                          width: `${zoom}%`,
                          minWidth: zoom > 100 ? "100%" : undefined,
                        }}
                      >
                        {/* Book spine gutter shadow along left edge */}
                        <div className="pointer-events-none absolute inset-y-0 left-0 w-6 sm:w-10 bg-gradient-to-r from-stone-950/30 via-stone-900/10 to-transparent z-20" />

                        {/* Subtle paper lighting gradient across page */}
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/0 via-transparent to-black/10 z-10" />

                        <img
                          src={imageSrc}
                          alt={`${title} - Page ${page.pageNo}`}
                          className="block h-auto w-full max-w-none select-none"
                          draggable={false}
                        />
                      </div>
                    ) : page.content ? (
                      <div
                        className="relative w-full max-w-4xl rounded-xl bg-white p-8 text-lg leading-8 shadow-xl overflow-hidden"
                        style={{
                          width: `${zoom}%`,
                        }}
                      >
                        {/* Book spine gutter shadow */}
                        <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-stone-950/20 via-stone-900/5 to-transparent z-20" />
                        {page.content}
                      </div>
                    ) : (
                      <div className="flex min-h-[500px] w-full items-center justify-center rounded-xl bg-white shadow-xl">
                        <p className="text-gray-500">Page image not available.</p>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div
            className={`flex items-center justify-between gap-4 ${
              isFullscreen
                ? "border-t border-white/10 bg-black px-4 py-3 text-white"
                : "mt-4"
            }`}
          >
            <button
              onClick={previousPage}
              disabled={currentPage === 0 || isTurning}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronLeft size={18} />
              Previous
            </button>

            <span className="text-sm font-semibold text-gray-900">
              Page {page.pageNo}
            </span>

            <button
              onClick={nextPage}
              disabled={currentPage === pages.length - 1 || isTurning}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
            >
              Next
              <ChevronRight size={18} />
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}


