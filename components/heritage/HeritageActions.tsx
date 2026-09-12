"use client";

import { useEffect, useState } from "react";
import { Heart, MapPin, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";

type Props = {
  heritageId: string;
};

export default function HeritageActions({ heritageId }: Props) {
  const { data: session, status } = useSession();

  const [wishlisted, setWishlisted] = useState(false);
  const [visited, setVisited] = useState(false);
  const [loadingWishlist, setLoadingWishlist] = useState(false);
  const [loadingVisited, setLoadingVisited] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") return;

    async function loadStatus() {
      try {
        const [wishlistRes, visitedRes] = await Promise.all([
          fetch("/api/wishlist"),
          fetch("/api/visited"),
        ]);

        if (wishlistRes.ok) {
          const wishlist = await wishlistRes.json();

          setWishlisted(
            wishlist.some(
              (item: any) => item.heritageId === heritageId
            )
          );
        }

        if (visitedRes.ok) {
          const visitedList = await visitedRes.json();

          setVisited(
            visitedList.some(
              (item: any) => item.heritageId === heritageId
            )
          );
        }
      } catch (error) {
        console.error("Failed to load heritage status:", error);
      }
    }

    loadStatus();
  }, [heritageId, status]);

  async function toggleWishlist() {
    if (!session) {
      window.location.href = "/login";
      return;
    }

    setLoadingWishlist(true);

    try {
      const response = await fetch("/api/wishlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ heritageId }),
      });

      if (response.ok) {
        const data = await response.json();
        setWishlisted(data.wishlisted);
      }
    } catch (error) {
      console.error("Wishlist error:", error);
    } finally {
      setLoadingWishlist(false);
    }
  }

  async function toggleVisited() {
    if (!session) {
      window.location.href = "/login";
      return;
    }

    setLoadingVisited(true);

    try {
      const response = await fetch("/api/visited", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ heritageId }),
      });

      if (response.ok) {
        const data = await response.json();
        setVisited(data.visited);
      }
    } catch (error) {
      console.error("Visited error:", error);
    } finally {
      setLoadingVisited(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="flex flex-wrap gap-3">
        <div className="h-11 w-40 animate-pulse rounded-full bg-white/10" />
        <div className="h-11 w-40 animate-pulse rounded-full bg-white/10" />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      <button
        onClick={toggleWishlist}
        disabled={loadingWishlist}
        className={`inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-medium transition-all ${
          wishlisted
            ? "border-red-400/50 bg-red-500/15 text-red-200"
            : "border-white/20 bg-white/10 text-white hover:bg-white/20"
        }`}
      >
        {loadingWishlist ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Heart
            className={`h-4 w-4 ${wishlisted ? "fill-current" : ""}`}
          />
        )}

        {wishlisted ? "In Wishlist" : "Add to Wishlist"}
      </button>

      <button
        onClick={toggleVisited}
        disabled={loadingVisited}
        className={`inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-medium transition-all ${
          visited
            ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-200"
            : "border-white/20 bg-white/10 text-white hover:bg-white/20"
        }`}
      >
        {loadingVisited ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <MapPin className="h-4 w-4" />
        )}

        {visited ? "Visited ?" : "Mark as Visited"}
      </button>
    </div>
  );
}
