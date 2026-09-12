"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export type ShowcaseVideo = {
  id: string;
  title: string;
  description: string | null;
  url: string;
  thumbnail: string | null;
  sortOrder: number;
  rotation: number;
};

export default function HomepageVideoShowcase({
  videos,
}: {
  videos: ShowcaseVideo[];
}) {
  const { t } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const isHoveredRef = useRef(false);
  isHoveredRef.current = isHovered;

  const currentVideo = videos[currentIndex] || null;
  const totalVideos = videos.length;

  // Safe play helper
  const playCurrentVideo = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = isMuted;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
        })
        .catch(() => {
          setIsPlaying(false);
        });
    }
  }, [isMuted]);

  // Safe pause helper
  const pauseCurrentVideo = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    video.pause();
    setIsPlaying(false);
  }, []);

  // Sync index change with video element
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = 0;
    video.muted = isMuted;

    if (isHoveredRef.current) {
      playCurrentVideo();
    } else {
      pauseCurrentVideo();
    }
  }, [currentIndex, isMuted, playCurrentVideo, pauseCurrentVideo]);

  // When hover state changes
  const handleMouseEnter = () => {
    setIsHovered(true);
    playCurrentVideo();
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    pauseCurrentVideo();
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (totalVideos <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % totalVideos);
  };

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (totalVideos <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + totalVideos) % totalVideos);
  };

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) {
      pauseCurrentVideo();
    } else {
      playCurrentVideo();
    }
  };

  // Toggle mute
  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (videoRef.current) {
      videoRef.current.muted = newMuted;
    }
  };

  // Video ended behavior
  const handleVideoEnded = () => {
    if (totalVideos <= 1) {
      // Loop single video
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        if (isHoveredRef.current) {
          playCurrentVideo();
        }
      }
      return;
    }

    // Move to next video and keep playing if hovered
    handleNext();
  };

  if (!videos || videos.length === 0 || !currentVideo) {
    return null;
  }

  const isSideways =
    currentVideo.rotation === 90 || currentVideo.rotation === 270;

  return (
    <section className="bg-[#0b0b0b] px-6 py-20 text-white md:px-10">
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="mb-12 max-w-3xl">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.4em] text-white/35">
            {t("Living Heritage")}
          </p>

          <h2 className="font-serif text-3xl font-semibold md:text-5xl">
            {t("A country. Countless traditions.")}
          </h2>

          <p className="mt-4 text-base leading-relaxed text-white/50 md:text-lg">
            {t(
              "Explore India's living heritage through its music, dance, festivals, crafts, stories, architecture and indigenous knowledge."
            )}
          </p>
        </div>

        {/* Cinematic Showcase Card */}
        <div
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="group relative overflow-hidden rounded-3xl border border-white/10 bg-black/60 shadow-2xl transition-all duration-500 hover:border-white/20"
        >
          {/* Video Container Stage */}
          <div className="relative flex h-[380px] w-full items-center justify-center overflow-hidden bg-black sm:h-[480px] md:h-[620px] lg:h-[700px]">
            <div
              className="relative flex items-center justify-center transition-all duration-500"
              style={
                isSideways
                  ? {
                      width: "100%",
                      height: "100%",
                      aspectRatio: "1 / 1",
                      maxWidth: "100%",
                      maxHeight: "100%",
                    }
                  : {
                      width: "100%",
                      height: "100%",
                    }
              }
            >
              <video
                ref={videoRef}
                key={currentVideo.id}
                src={currentVideo.url}
                poster={currentVideo.thumbnail || undefined}
                playsInline
                muted={isMuted}
                preload="metadata"
                onEnded={handleVideoEnded}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                className="h-full w-full object-contain"
                style={{
                  transform: `rotate(${currentVideo.rotation || 0}deg)`,
                  transformOrigin: "center center",
                }}
              />
            </div>

            {/* Subtle Gradient Overlays for Cinematic Feel */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />

            {/* Play prompt when not hovered and video paused */}
            {!isPlaying && !isHovered && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md transition-transform duration-300 group-hover:scale-110">
                  <Play size={32} className="ml-1 fill-white text-white" />
                </div>
              </div>
            )}

            {/* Top Toolbar: Counter & Mute Button */}
            <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
              <span className="rounded-full border border-white/10 bg-black/40 px-4 py-1.5 text-xs font-mono tracking-wider text-white/70 backdrop-blur-md">
                {String(currentIndex + 1).padStart(2, "0")} /{" "}
                {String(totalVideos).padStart(2, "0")}
              </span>

              <button
                type="button"
                onClick={toggleMute}
                aria-label={isMuted ? "Unmute video" : "Mute video"}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white/80 backdrop-blur-md transition hover:bg-white/20 hover:text-white"
              >
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
            </div>

            {/* Bottom Content Area: Details & Navigation Controls */}
            <div className="absolute bottom-6 left-6 right-6 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <h3 className="font-serif text-2xl font-semibold tracking-wide text-white md:text-3xl">
                  {currentVideo.title}
                </h3>

                {currentVideo.description && (
                  <p className="mt-2 text-sm leading-relaxed text-white/70 md:text-base">
                    {currentVideo.description}
                  </p>
                )}
              </div>

              {/* Navigation Controls: Previous / Next */}
              {totalVideos > 1 && (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handlePrev}
                    aria-label={t("Previous Video")}
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-5 py-2.5 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/20 hover:border-white/30 active:scale-95"
                  >
                    <ChevronLeft size={18} />
                    <span>{t("Previous")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNext}
                    aria-label={t("Next Video")}
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-5 py-2.5 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/20 hover:border-white/30 active:scale-95"
                  >
                    <span>{t("Next")}</span>
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
