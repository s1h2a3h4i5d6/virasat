"use client";

import { MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function WishlistActions({
  heritageId,
}: {
  heritageId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function markAsVisited() {
    if (loading) return;

    setLoading(true);

    try {
      const response = await fetch("/api/visited", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          heritageId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to mark heritage as visited");
      }

      await fetch("/api/wishlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          heritageId,
        }),
      });

      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={markAsVisited}
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-medium text-emerald-300 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <MapPin size={16} />

      {loading ? "Updating..." : "Mark as Visited"}
    </button>
  );
}
