"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import StudentSidebar, { PageSpinner } from "@/components/StudentSidebar";
import { BAND_FILTERS, IELTS_SKILLS, type IeltsPhrase } from "@/lib/vocabulary";

export default function VocabularyPhrasesPage() {
  const { status } = useSession();
  const router = useRouter();
  const [skill, setSkill] = useState("");
  const [band, setBand] = useState("");
  const [phrases, setPhrases] = useState<IeltsPhrase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  const loadPhrases = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (skill) params.set("skill", skill);
      if (band) params.set("band", band);
      const res = await fetch(`/api/vocabulary/phrases?${params}`);
      const json = await res.json();
      setPhrases(json.phrases ?? []);
    } finally {
      setLoading(false);
    }
  }, [skill, band]);

  useEffect(() => {
    if (status !== "authenticated") return;
    loadPhrases();
  }, [status, loadPhrases]);

  if (status === "loading" || status === "unauthenticated") {
    return <PageSpinner />;
  }

  return (
    <div className="flex min-h-screen">
      <StudentSidebar activePage="vocabulary" />
      <main className="ml-[200px] min-h-screen flex-1 bg-slate-50 px-8 py-8">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/dashboard/student/vocabulary"
            className="text-sm font-medium text-[#0d9488] hover:underline"
          >
            ← Back to Vocabulary
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-[#0d1b35]">IELTS Phrases</h1>
          <p className="mt-1 text-sm text-slate-600">
            High-band linking phrases for Writing &amp; Speaking
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSkill("")}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                !skill
                  ? "bg-[#0d1b35] text-white"
                  : "bg-white text-[#0d1b35] border border-slate-200"
              }`}
            >
              All skills
            </button>
            {IELTS_SKILLS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSkill(s)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  skill === s
                    ? "bg-[#0d1b35] text-white"
                    : "bg-white text-[#0d1b35] border border-slate-200"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setBand("")}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                !band
                  ? "bg-[#c9972c] text-white"
                  : "bg-white text-[#0d1b35] border border-slate-200"
              }`}
            >
              All bands
            </button>
            {BAND_FILTERS.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setBand(b.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  band === b.id
                    ? "bg-[#c9972c] text-white"
                    : "bg-white text-[#0d1b35] border border-slate-200"
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="mt-10 text-slate-500">Loading phrases…</p>
          ) : phrases.length === 0 ? (
            <p className="mt-10 text-slate-500">No phrases match these filters.</p>
          ) : (
            <div className="mt-8 grid gap-4">
              {phrases.map((p) => (
                <article
                  key={p.id}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h2 className="text-lg font-bold text-[#0d1b35]">{p.phrase}</h2>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-[#0d9488]/15 px-2.5 py-0.5 text-xs font-semibold text-[#0d9488]">
                        {p.function}
                      </span>
                      <span className="rounded-full bg-[#c9972c]/15 px-2.5 py-0.5 text-xs font-semibold text-[#c9972c]">
                        {p.band_level}
                      </span>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{p.skill}</p>
                  <p className="mt-3 text-sm text-slate-700">
                    <span className="font-semibold text-[#0d1b35]">Example: </span>
                    {p.example_sentence}
                  </p>
                  {p.avoid_phrase ? (
                    <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
                      <span className="font-semibold">Avoid saying: </span>
                      &ldquo;{p.avoid_phrase}&rdquo;
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
