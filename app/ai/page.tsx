"use client";

import { FormEvent, useState } from "react";
import {
  Bot,
  Send,
  Sparkles,
  BookOpen,
  ShieldCheck,
  Loader2,
} from "lucide-react";

type Source = {
  title: string;
  type?: string;
  url?: string;
};

type ChatResponse = {
  answer: string;
  sources?: Source[];
  fallback?: boolean;
};

export default function AIPage() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function askAI(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) return;

    setLoading(true);
    setError("");
    setAnswer("");
    setSources([]);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: trimmedQuestion,
        }),
      });

      const data: ChatResponse = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.details || data?.error || data?.answer || "Unable to process your question."
        );
      }

      setAnswer(data.answer || "");
      setSources(Array.isArray(data.sources) ? data.sources : []);
    } catch (err) {
      console.error("AI request error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f5f0] px-4 py-10 text-slate-900 sm:px-6">
      <div className="mx-auto max-w-5xl">

        <section className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg">
            <Bot size={32} />
          </div>

          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-black/5">
            <Sparkles size={16} />
            Virasat AI
          </div>

          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Ask Virasat
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Explore India&apos;s living heritage through a trustworthy AI
            assistant built around the verified Virasat knowledge base.
          </p>
        </section>

        <section className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <BookOpen className="mb-3 text-slate-800" size={24} />
            <h2 className="font-semibold">Heritage Knowledge</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Ask about traditions, forts, arts, festivals and cultural
              practices.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <ShieldCheck className="mb-3 text-slate-800" size={24} />
            <h2 className="font-semibold">Verified Information</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Answers will be grounded in trusted Virasat knowledge and
              verified sources.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <Sparkles className="mb-3 text-slate-800" size={24} />
            <h2 className="font-semibold">AI Assisted Discovery</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Discover connections between India&apos;s diverse heritage
              records.
            </p>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-7">

          <form onSubmit={askAI}>
            <label
              htmlFor="ai-question"
              className="mb-3 block text-sm font-semibold text-slate-800"
            >
              What would you like to know?
            </label>

            <div className="flex flex-col gap-3 sm:flex-row">
              <textarea
                id="ai-question"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Example: Tell me about Powada and its cultural significance..."
                rows={3}
                className="min-h-[90px] flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200"
              />

              <button
                type="submit"
                disabled={loading || !question.trim()}
                className="inline-flex min-h-[90px] items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[150px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Thinking...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Ask Virasat
                  </>
                )}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {answer && (
            <div className="mt-8">
              <div className="mb-3 flex items-center gap-2">
                <Bot size={20} />
                <h2 className="text-lg font-semibold">
                  Virasat AI Answer
                </h2>
              </div>

              <div className="rounded-2xl bg-slate-50 p-5 text-sm leading-7 text-slate-700 ring-1 ring-slate-200">
                <p className="whitespace-pre-wrap">{answer}</p>
              </div>

              {sources.length > 0 && (
                <div className="mt-6">
                  <h3 className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
                    <ShieldCheck size={18} />
                    Sources
                  </h3>

                  <div className="grid gap-3">
                    {sources.map((source, index) => (
                      <div
                        key={`${source.title}-${index}`}
                        className="rounded-2xl bg-white p-4 ring-1 ring-slate-200"
                      >
                        <p className="font-medium text-slate-900">
                          {source.title}
                        </p>

                        {source.type && (
                          <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
                            {source.type}
                          </p>
                        )}

                        {source.url && (
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-block text-sm font-medium text-slate-700 underline"
                          >
                            View source
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!answer && !error && !loading && (
            <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <Bot className="mx-auto mb-3 text-slate-400" size={30} />

              <p className="font-medium text-slate-700">
                Your answer will appear here.
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Ask a question about India&apos;s cultural heritage.
              </p>
            </div>
          )}

        </section>

        <p className="mt-6 text-center text-xs leading-5 text-slate-400">
          Virasat AI is designed to answer using verified heritage
          information. If reliable information is unavailable, it will
          clearly indicate that.
        </p>

      </div>
    </main>
  );
}