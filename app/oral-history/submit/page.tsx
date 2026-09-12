"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Mic2,
  Upload,
  ArrowLeft,
  Send,
  CheckCircle2,
  Play,
  X,
  FileAudio,
  ImagePlus,
} from "lucide-react";

type State = {
  id: string;
  name: string;
  slug: string;
  districts: {
    id: string;
    name: string;
    slug: string;
  }[];
};

type Heritage = {
  id: string;
  name: string;
  slug: string;
};

type Category = {
  id: string;
  name: string;
  slug: string;
};

export default function SubmitOralHistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [states, setStates] = useState<State[]>([]);
  const [heritage, setHeritage] = useState<Heritage[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [stateId, setStateId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [type, setType] = useState<"STORY" | "SONG">("STORY");

  const [title, setTitle] = useState("");
  const [speakerName, setSpeakerName] = useState("");
  const [originalLanguage, setOriginalLanguage] = useState("");
  const [description, setDescription] = useState("");
  const [transcript, setTranscript] = useState("");
  const [translation, setTranslation] = useState("");
  const [heritageId, setHeritageId] = useState("");

  const [audioUrl, setAudioUrl] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState("");

  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState("");
  const [coverUploading, setCoverUploading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    async function loadData() {
      try {
        const [mapResponse, heritageResponse, categoryResponse] = await Promise.all([
          fetch("/api/map"),
          fetch("/api/explore"),
          fetch("/api/categories"),
        ]);

        const mapData = await mapResponse.json();
        const heritageData = await heritageResponse.json();
        const categoryData = await categoryResponse.json();

        const stateList = Array.isArray(mapData)
          ? mapData
          : mapData.states || [];

        setStates(stateList);

        setHeritage(
          Array.isArray(heritageData)
            ? heritageData.map((item: any) => ({
                id: item.id,
                name: item.name,
                slug: item.slug,
              }))
            : []
        );

        const categoryList = Array.isArray(categoryData)
          ? categoryData
          : categoryData?.value || [];
        setCategories(categoryList);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingData(false);
      }
    }

    if (status === "authenticated") {
      loadData();
    }
  }, [status]);

  useEffect(() => {
    return () => {
      if (audioPreviewUrl) {
        URL.revokeObjectURL(audioPreviewUrl);
      }

      if (coverPreviewUrl) {
        URL.revokeObjectURL(coverPreviewUrl);
      }
    };
  }, [audioPreviewUrl, coverPreviewUrl]);

  const selectedState = states.find(
    (item) => item.id === stateId
  );

  const districts = selectedState?.districts || [];

  function handleAudioFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0] || null;

    setError("");

    if (!file) {
      setAudioFile(null);
      setAudioPreviewUrl("");
      return;
    }

    const fileName = file.name.toLowerCase();

    const allowedExtensions = [
      ".mp3",
      ".mpeg",
      ".mpga",
      ".wav",
      ".wave",
      ".m4a",
      ".ogg",
      ".oga",
      ".webm",
      ".aac",
    ];

    const allowedMimeTypes = [
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/x-wav",
      "audio/wave",
      "audio/mp4",
      "audio/x-m4a",
      "audio/ogg",
      "audio/webm",
      "audio/aac",
      "audio/x-aac",
      "application/octet-stream",
    ];

    const extensionAllowed = allowedExtensions.some((extension) =>
      fileName.endsWith(extension)
    );

    if (!extensionAllowed && !file.type.startsWith("audio/")) {
      setAudioFile(null);
      setAudioPreviewUrl("");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setError(
        "Unsupported audio format. Please select an MP3, MPEG, WAV, M4A, OGG, AAC, or WEBM audio file."
      );

      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setAudioFile(null);
      setAudioPreviewUrl("");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setError("Audio file must be 15 MB or smaller.");
      return;
    }

    if (audioPreviewUrl) {
      URL.revokeObjectURL(audioPreviewUrl);
    }

    const previewUrl = URL.createObjectURL(file);

    setAudioFile(file);
    setAudioPreviewUrl(previewUrl);
    setAudioUrl("");
  }

  function removeAudioFile() {
    if (audioPreviewUrl) {
      URL.revokeObjectURL(audioPreviewUrl);
    }

    setAudioFile(null);
    setAudioPreviewUrl("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleCoverImageChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0] || null;

    setError("");

    if (!file) {
      return;
    }

    const fileName = file.name.toLowerCase();

    const allowedExtensions = [
      ".jpg",
      ".jpeg",
      ".png",
      ".webp",
    ];

    const extensionAllowed = allowedExtensions.some((extension) =>
      fileName.endsWith(extension)
    );

    if (!extensionAllowed) {
      setCoverImageFile(null);
      setCoverPreviewUrl("");

      if (coverInputRef.current) {
        coverInputRef.current.value = "";
      }

      setError(
        "Unsupported cover photo format. Please select a JPG, JPEG, PNG, or WEBP image."
      );

      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setCoverImageFile(null);
      setCoverPreviewUrl("");

      if (coverInputRef.current) {
        coverInputRef.current.value = "";
      }

      setError("Cover photo must be 5 MB or smaller.");
      return;
    }

    if (coverPreviewUrl) {
      URL.revokeObjectURL(coverPreviewUrl);
    }

    const previewUrl = URL.createObjectURL(file);

    setCoverImageFile(file);
    setCoverPreviewUrl(previewUrl);
    setCoverImageUrl("");
  }

  function removeCoverImage() {
    if (coverPreviewUrl) {
      URL.revokeObjectURL(coverPreviewUrl);
    }

    setCoverImageFile(null);
    setCoverPreviewUrl("");
    setCoverImageUrl("");

    if (coverInputRef.current) {
      coverInputRef.current.value = "";
    }
  }

  function validateExternalAudioUrl(url: string) {
    if (!url.trim()) {
      return true;
    }

    try {
      const parsed = new URL(url.trim());

      if (!["http:", "https:"].includes(parsed.protocol)) {
        return false;
      }

      const lower = parsed.pathname.toLowerCase();

      return (
        lower.endsWith(".mp3") ||
        lower.endsWith(".mpeg") ||
        lower.endsWith(".wav") ||
        lower.endsWith(".m4a") ||
        lower.endsWith(".ogg") ||
        lower.endsWith(".webm") ||
        lower.endsWith(".aac")
      );
    } catch {
      return false;
    }
  }

  function formatFileSize(bytes: number) {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(0)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  function resetForm() {
    setTitle("");
    setSpeakerName("");
    setOriginalLanguage("");
    setDescription("");
    setTranscript("");
    setTranslation("");
    setHeritageId("");
    setStateId("");
    setDistrictId("");
    setAudioUrl("");
    removeAudioFile();
    removeCoverImage();
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      let uploadedAudioUrl = audioUrl.trim();
      let uploadedCoverImageUrl = coverImageUrl.trim();

      /*
       * Upload audio
       */
      if (audioFile) {
        const formData = new FormData();

        formData.append("file", audioFile);

        const uploadResponse = await fetch(
          "/api/oral-history/upload",
          {
            method: "POST",
            body: formData,
          }
        );

        const uploadData = await uploadResponse.json();

        if (!uploadResponse.ok) {
          throw new Error(
            uploadData.error || "Audio upload failed."
          );
        }

        uploadedAudioUrl = uploadData.url || "";

        if (!uploadedAudioUrl) {
          throw new Error(
            "Audio was uploaded but no audio URL was returned."
          );
        }
      } else if (uploadedAudioUrl) {
        if (!validateExternalAudioUrl(uploadedAudioUrl)) {
          throw new Error(
            "Please enter a direct audio file URL ending in .mp3, .mpeg, .wav, .m4a, .ogg, .webm, or .aac. Website or album URLs such as JioSaavn pages are not supported."
          );
        }
      }

      /*
       * Upload cover photo
       */
      if (coverImageFile) {
        setCoverUploading(true);

        const coverFormData = new FormData();

        coverFormData.append("file", coverImageFile);

        const coverResponse = await fetch(
          "/api/oral-history/cover-upload",
          {
            method: "POST",
            body: coverFormData,
          }
        );

        const coverData = await coverResponse.json();

        setCoverUploading(false);

        if (!coverResponse.ok) {
          throw new Error(
            coverData.error || "Cover photo upload failed."
          );
        }

        uploadedCoverImageUrl = coverData.url || "";

        if (!uploadedCoverImageUrl) {
          throw new Error(
            "Cover photo was uploaded but no image URL was returned."
          );
        }
      }

      /*
       * All India / General means:
       * stateId = null
       * districtId = null
       */
      const finalStateId = stateId || null;
      const finalDistrictId = finalStateId
        ? districtId || null
        : null;

      const response = await fetch("/api/oral-history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          speakerName,
          originalLanguage,
          transcript,
          translation,
          audioUrl: uploadedAudioUrl || null,
          coverImageUrl: uploadedCoverImageUrl || null,
          description,
          heritageId: heritageId || null,
          stateId: finalStateId,
          districtId: finalDistrictId,
          categoryId: categoryId || null,
          type,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Submission failed."
        );
      }

      resetForm();
      setSubmitted(true);

    } catch (err) {
      setCoverUploading(false);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
      setCoverUploading(false);
    }
  }

  if (status === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0b0b0b] text-white">
        <p className="text-sm text-white/40">
          Loading...
        </p>
      </main>
    );
  }

  if (!session) {
    return null;
  }

  /*
   * SUCCESS SCREEN
   */
  if (submitted) {
    return (
      <main className="min-h-screen bg-[#0b0b0b] px-6 py-16 text-white md:px-10">
        <div className="mx-auto flex min-h-[75vh] max-w-3xl items-center justify-center">

          <div className="w-full rounded-[2rem] border border-white/10 bg-white/[0.035] p-8 text-center md:p-14">

            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-green-400/20 bg-green-400/10">
              <CheckCircle2
                size={42}
                className="text-green-300/80"
              />
            </div>

            <p className="mt-8 text-xs uppercase tracking-[0.35em] text-white/30">
              Submission received
            </p>

            <h1 className="mt-4 font-serif text-4xl font-semibold md:text-5xl">
              Oral History Submitted Successfully
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-white/45 md:text-base">
              Your story and audio recording have been successfully
              submitted to the Virasat archive.
            </p>

            <div className="mx-auto mt-8 max-w-xl rounded-2xl border border-amber-300/10 bg-amber-300/[0.04] p-5">
              <p className="text-xs uppercase tracking-[0.25em] text-amber-200/50">
                Current status
              </p>

              <p className="mt-2 text-lg font-medium text-amber-100/80">
                Pending Review
              </p>

              <p className="mt-2 text-sm leading-6 text-white/40">
                Your submission has been sent to the Virasat
                administration team for review. It will appear in
                the public Voices of India archive only after it is
                approved and verified.
              </p>
            </div>

            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">

              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-medium text-white/70 transition hover:bg-white/[0.08] hover:text-white"
              >
                Submit Another Story
              </button>

              <Link
                href="/oral-history"
                className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-medium text-black transition hover:bg-white/90"
              >
                View Voices of India
              </Link>

            </div>

          </div>

        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0b0b0b] px-6 py-16 text-white md:px-10">
      <div className="mx-auto max-w-4xl">

        <Link
          href="/oral-history"
          className="mb-10 inline-flex items-center gap-2 text-sm text-white/40 transition hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to Voices of India
        </Link>

        <div className="mb-12">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
            <Mic2 size={25} className="text-white/60" />
          </div>

          <p className="mb-3 text-xs uppercase tracking-[0.35em] text-white/30">
            Preserve Living Memory
          </p>

          <h1 className="font-serif text-4xl font-semibold md:text-5xl">
            Share an oral history
          </h1>

          <p className="mt-5 max-w-2xl text-sm leading-7 text-white/45 md:text-base">
            Preserve a story, memory, song, tradition or piece of
            traditional knowledge in the voice and language in which
            it lives.
          </p>
        </div>

        {error && (
          <div className="mb-8 rounded-2xl border border-red-400/20 bg-red-400/5 p-5 text-sm text-red-200">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-8"
        >

          {/* Story information */}
          <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 md:p-8">
            <h2 className="font-serif text-2xl">
              Story information
            </h2>

            <p className="mt-2 text-sm text-white/35">
              Tell us about the story and the person whose voice is
              being preserved.
            </p>

            <div className="mt-7 grid gap-5 md:grid-cols-2">

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm text-white/60">
                  Story title *
                </label>

                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Example: The Story of Our Village Festival"
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none placeholder:text-white/20 focus:border-white/30"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/60">
                  Type of Oral Tradition *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setType("STORY")}
                    className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition ${
                      type === "STORY"
                        ? "border-blue-500 bg-blue-500/20 text-white"
                        : "border-white/10 bg-black/30 text-white/50 hover:text-white"
                    }`}
                  >
                    <span>📖 Story</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setType("SONG")}
                    className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition ${
                      type === "SONG"
                        ? "border-purple-500 bg-purple-500/20 text-white"
                        : "border-white/10 bg-black/30 text-white/50 hover:text-white"
                    }`}
                  >
                    <span>🎵 Song</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/60">
                  Cultural Category
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-white/30"
                >
                  <option value="">-- Select Cultural Category --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/60">
                  Speaker / storyteller
                </label>

                <input
                  value={speakerName}
                  onChange={(e) =>
                    setSpeakerName(e.target.value)
                  }
                  placeholder="Name of storyteller"
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none placeholder:text-white/20 focus:border-white/30"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/60">
                  Original language *
                </label>

                <input
                  required
                  value={originalLanguage}
                  onChange={(e) =>
                    setOriginalLanguage(e.target.value)
                  }
                  placeholder="Marathi, Hindi, Tamil..."
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none placeholder:text-white/20 focus:border-white/30"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm text-white/60">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                  rows={4}
                  placeholder="Briefly describe this story..."
                  className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm leading-6 outline-none placeholder:text-white/20 focus:border-white/30"
                />
              </div>
            </div>
          </section>

          {/* Cover photo */}
          <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 md:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05]">
                <ImagePlus
                  size={21}
                  className="text-white/50"
                />
              </div>

              <div>
                <h2 className="font-serif text-2xl">
                  Card cover photo
                </h2>

                <p className="mt-2 text-sm leading-6 text-white/35">
                  Add an optional photo that represents this story,
                  storyteller, tradition or cultural memory.
                </p>
              </div>
            </div>

            <div className="mt-7 rounded-2xl border border-dashed border-white/15 bg-black/20 p-6">

              {coverPreviewUrl ? (
                <div>
                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                    <img
                      src={coverPreviewUrl}
                      alt="Card cover preview"
                      className="aspect-[16/9] w-full object-cover"
                    />
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-3">

                    <label className="cursor-pointer rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm text-white/70 transition hover:bg-white/[0.09] hover:text-white">
                      Change photo

                      <input
                        ref={coverInputRef}
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                        onChange={handleCoverImageChange}
                        className="hidden"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={removeCoverImage}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/45 transition hover:bg-white/10 hover:text-white"
                    >
                      <X size={15} />
                      Remove
                    </button>

                    <span className="text-xs text-green-300/70">
                      ✓ Photo selected successfully
                    </span>
                  </div>

                  {coverImageFile && (
                    <p className="mt-3 text-xs text-white/30">
                      {coverImageFile.name}
                      {" • "}
                      {formatFileSize(coverImageFile.size)}
                    </p>
                  )}
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center justify-center py-8 text-center">

                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                    <ImagePlus
                      size={27}
                      className="text-white/40"
                    />
                  </div>

                  <span className="text-sm text-white/70">
                    Add a card cover photo
                  </span>

                  <span className="mt-2 text-xs text-white/30">
                    JPG, JPEG, PNG or WEBP • Maximum 5 MB
                  </span>

                  <span className="mt-3 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/45">
                    Browse photo
                  </span>

                  <input
                    ref={coverInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    onChange={handleCoverImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <p className="mt-4 text-xs text-white/25">
              Optional. This image will be used as the visual cover
              for the story card in the public archive after approval.
            </p>
          </section>

          {/* Location */}
          <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 md:p-8">
            <h2 className="font-serif text-2xl">
              Cultural location
            </h2>

            <p className="mt-2 text-sm text-white/35">
              Choose a state if this story belongs to a specific
              region. Otherwise select All India / General.
            </p>

            <div className="mt-7 grid gap-5 md:grid-cols-2">

              <div>
                <label className="mb-2 block text-sm text-white/60">
                  State
                </label>

                <select
                  value={stateId}
                  onChange={(e) => {
                    const value = e.target.value;

                    setStateId(value);
                    setDistrictId("");
                  }}
                  disabled={loadingData}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none"
                >
                  <option value="">
                    All India / General
                  </option>

                  {states.map((item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/60">
                  District
                </label>

                <select
                  value={districtId}
                  onChange={(e) =>
                    setDistrictId(e.target.value)
                  }
                  disabled={!stateId}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none disabled:opacity-40"
                >
                  <option value="">
                    {stateId
                      ? "Select district"
                      : "Not applicable for All India / General"}
                  </option>

                  {districts.map((item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm text-white/60">
                  Related heritage
                </label>

                <select
                  value={heritageId}
                  onChange={(e) =>
                    setHeritageId(e.target.value)
                  }
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm outline-none"
                >
                  <option value="">
                    Not linked to a specific heritage record
                  </option>

                  {heritage.map((item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Transcript */}
          <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 md:p-8">
            <h2 className="font-serif text-2xl">
              Words of the story
            </h2>

            <div className="mt-7 space-y-5">

              <div>
                <label className="mb-2 block text-sm text-white/60">
                  Original transcript
                </label>

                <textarea
                  value={transcript}
                  onChange={(e) =>
                    setTranscript(e.target.value)
                  }
                  rows={8}
                  placeholder="Write the story in its original language..."
                  className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm leading-7 outline-none placeholder:text-white/20 focus:border-white/30"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/60">
                  Translation
                </label>

                <textarea
                  value={translation}
                  onChange={(e) =>
                    setTranslation(e.target.value)
                  }
                  rows={8}
                  placeholder="Add an English or other-language translation..."
                  className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm leading-7 outline-none placeholder:text-white/20 focus:border-white/30"
                />
              </div>
            </div>
          </section>

          {/* Audio */}
          <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 md:p-8">
            <h2 className="font-serif text-2xl">
              Voice recording
            </h2>

            <p className="mt-2 text-sm leading-6 text-white/35">
              Upload an audio recording of the storyteller.
              MP3, MPEG, WAV, M4A, OGG, AAC and WEBM recordings
              are supported. Maximum file size: 15 MB.
            </p>

            <div className="mt-7 rounded-2xl border border-dashed border-white/15 bg-black/20 p-6">

              <label className="flex cursor-pointer flex-col items-center justify-center text-center">

                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                  <Upload
                    size={28}
                    className="text-white/40"
                  />
                </div>

                <span className="text-sm text-white/70">
                  Choose an audio recording
                </span>

                <span className="mt-2 text-xs text-white/30">
                  MP3, MPEG, WAV, M4A, OGG, AAC or WEBM
                </span>

                <span className="mt-3 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/45">
                  Browse files
                </span>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".mp3,.mpeg,.mpga,.wav,.wave,.m4a,.ogg,.oga,.webm,.aac,audio/*"
                  onChange={handleAudioFileChange}
                  className="hidden"
                />
              </label>

              {audioFile && (
                <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5">

                  <div className="flex items-start justify-between gap-4">

                    <div className="flex min-w-0 items-center gap-4">

                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05]">
                        <FileAudio
                          size={22}
                          className="text-white/60"
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white/80">
                          {audioFile.name}
                        </p>

                        <p className="mt-1 text-xs text-white/35">
                          {formatFileSize(audioFile.size)}
                          {" • "}
                          {audioFile.type || "Audio file"}
                        </p>

                        <p className="mt-1 text-xs text-green-300/70">
                          ✓ File selected successfully
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={removeAudioFile}
                      className="shrink-0 rounded-lg p-2 text-white/30 transition hover:bg-white/10 hover:text-white"
                      title="Remove audio"
                    >
                      <X size={17} />
                    </button>

                  </div>

                  {audioPreviewUrl && (
                    <div className="mt-5 rounded-xl border border-white/10 bg-black/30 p-4">

                      <div className="mb-3 flex items-center gap-2 text-xs text-white/40">
                        <Play size={14} />
                        Audio preview
                      </div>

                      <audio
                        controls
                        preload="metadata"
                        src={audioPreviewUrl}
                        className="h-10 w-full"
                      />

                    </div>
                  )}

                </div>
              )}
            </div>

            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-white/10" />

              <span className="text-xs text-white/25">
                OR
              </span>

              <div className="h-px flex-1 bg-white/10" />
            </div>

            <input
              value={audioUrl}
              onChange={(e) => {
                setAudioUrl(e.target.value);

                if (e.target.value.trim()) {
                  removeAudioFile();
                }
              }}
              placeholder="Paste a direct .mp3 / .mpeg / .wav / .m4a audio URL"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none placeholder:text-white/20 focus:border-white/30"
            />

            <p className="mt-2 text-xs leading-5 text-white/25">
              Website pages from JioSaavn, YouTube, Spotify and
              similar services are not direct audio files.
            </p>
          </section>

          {/* Submit */}
          <div className="flex flex-col gap-4 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">

            <p className="max-w-lg text-xs leading-5 text-white/30">
              Your submission will remain private until reviewed and
              verified by the Virasat administration team.
            </p>

            <button
              type="submit"
              disabled={loading || coverUploading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {coverUploading ? (
                "Uploading cover photo..."
              ) : loading ? (
                "Submitting..."
              ) : (
                <>
                  Submit for verification
                  <Send size={15} />
                </>
              )}
            </button>

          </div>

        </form>
      </div>
    </main>
  );
}
