"use client";

import { FormEvent, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Send,
  Upload,
  Info,
} from "lucide-react";

export default function ContributePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [heritageId, setHeritageId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  if (status === "loading") {
    return (
      <main className="min-h-screen bg-[#080808] text-white flex items-center justify-center">
        <p className="text-white/50">Loading...</p>
      </main>
    );
  }

  if (!session?.user) {
    return (
      <main className="min-h-screen bg-[#080808] text-white flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-3xl font-semibold">
            Sign in to contribute
          </h1>

          <p className="mt-3 text-white/50">
            Create an account or sign in to share India's living heritage.
          </p>

          <Link
            href="/login"
            className="mt-6 inline-flex rounded-xl bg-white px-6 py-3 font-semibold text-black"
          >
            Sign in
          </Link>
        </div>
      </main>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!title.trim() || !content.trim()) {
      setError("Please provide a title and contribution content.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/contributions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          heritageId: heritageId || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to submit contribution.");
        setLoading(false);
        return;
      }

      setMessage(
        "Your contribution has been submitted for verification."
      );

      setTitle("");
      setContent("");
      setHeritageId("");

      setTimeout(() => {
        router.push("/profile");
        router.refresh();
      }, 1200);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#080808] text-white px-4 py-28">
      <div className="mx-auto max-w-3xl">

        <Link
          href="/profile"
          className="mb-8 inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition"
        >
          <ArrowLeft size={16} />
          Back to profile
        </Link>

        <div className="mb-10">
          <p className="text-sm uppercase tracking-[0.2em] text-white/40">
            Community Heritage
          </p>

          <h1 className="mt-2 text-4xl font-semibold">
            Share your heritage
          </h1>

          <p className="mt-3 max-w-2xl text-white/50">
            Help preserve India's living heritage by sharing traditions,
            stories, local knowledge, oral histories and cultural practices.
          </p>
        </div>

        <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <div className="flex gap-3">
            <Info className="mt-0.5 shrink-0 text-white/50" size={19} />

            <div>
              <h2 className="font-medium">
                How verification works
              </h2>

              <p className="mt-2 text-sm leading-6 text-white/45">
                Every community contribution is reviewed by the Virasat
                verification team before becoming publicly verified.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-white/10 px-3 py-1.5">
                  Submitted
                </span>

                <span className="text-white/30">→</span>

                <span className="rounded-full bg-white/10 px-3 py-1.5">
                  Pending Review
                </span>

                <span className="text-white/30">→</span>

                <span className="rounded-full bg-white/10 px-3 py-1.5">
                  Verified
                </span>
              </div>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8"
        >
          {message && (
            <div className="mb-6 rounded-xl border border-green-400/20 bg-green-400/10 px-4 py-3 text-sm text-green-300">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <div className="space-y-6">

            <div>
              <label
                htmlFor="title"
                className="mb-2 block text-sm text-white/70"
              >
                Contribution title
              </label>

              <input
                id="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Example: Traditional Powada performance in my village"
                maxLength={200}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3.5 text-white placeholder:text-white/25 outline-none focus:border-white/30"
              />
            </div>

            <div>
              <label
                htmlFor="heritage"
                className="mb-2 block text-sm text-white/70"
              >
                Related heritage
              </label>

              <input
                id="heritage"
                value={heritageId}
                onChange={(event) => setHeritageId(event.target.value)}
                placeholder="Optional heritage record ID"
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3.5 text-white placeholder:text-white/25 outline-none focus:border-white/30"
              />

              <p className="mt-2 text-xs text-white/30">
                Leave empty if this is a completely new cultural record.
              </p>
            </div>

            <div>
              <label
                htmlFor="content"
                className="mb-2 block text-sm text-white/70"
              >
                Your contribution
              </label>

              <textarea
                id="content"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Describe the tradition, story, practice, location, language, people, history or cultural knowledge..."
                rows={10}
                maxLength={10000}
                className="w-full resize-y rounded-xl border border-white/10 bg-black/20 px-4 py-3.5 text-white placeholder:text-white/25 outline-none focus:border-white/30"
              />

              <p className="mt-2 text-right text-xs text-white/30">
                {content.length}/10000
              </p>
            </div>

            <div className="rounded-2xl border border-dashed border-white/15 bg-black/10 p-5">
              <div className="flex items-center gap-3">
                <Upload size={19} className="text-white/50" />

                <div>
                  <p className="text-sm font-medium">
                    Media attachments
                  </p>

                  <p className="mt-1 text-xs text-white/35">
                    Photo, audio and video uploads will be enabled in the
                    next contribution stage.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-white py-3.5 font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Send size={18} />

              {loading ? "Submitting..." : "Submit for verification"}
            </button>

          </div>
        </form>
      </div>
    </main>
  );
}