"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import StudentSidebar, { PageSpinner } from "@/components/StudentSidebar";
import { usePathwayStudentContext } from "@/components/pathway/usePathwayStudentContext";
import {
  ACCELERATOR_CYCLE,
  ACCELERATOR_TRACKS,
  type AcceleratorTrackId,
} from "@/lib/accelerator/tracks";

type ApiResponse = {
  placementBand: number | null;
  recommendedTrack: AcceleratorTrackId;
  recommendedTrackName: string;
  tracks: Array<{
    id: AcceleratorTrackId;
    name: string;
    target: string;
    entry: string;
    duration: string;
    price: string;
    weekCount: number;
    badge: string | null;
    bullets: string[];
    href: string;
    isRecommended: boolean;
  }>;
};

function TrackCard({
  track,
  recommendedTrack,
  trackHref,
}: {
  track: ApiResponse["tracks"][number];
  recommendedTrack: AcceleratorTrackId;
  trackHref: string;
}) {
  const isPlus = track.id === "plus";
  const isRecommended = track.id === recommendedTrack;
  const meta = ACCELERATOR_TRACKS[track.id];

  return (
    <div
      className={`flex flex-col rounded-2xl border bg-white p-6 shadow-sm ${
        isPlus
          ? "border-2 border-[#c9972c] ring-2 ring-[#c9972c]/20"
          : isRecommended
            ? "border-[#0d9488]"
            : "border-slate-200"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="text-xl font-bold text-[#0d1b35]">{track.name}</h2>
        {isRecommended ? (
          <span className="rounded-full bg-[#c9972c] px-3 py-1 text-xs font-bold text-[#0d1b35]">
            Your Track
          </span>
        ) : null}
      </div>

      {track.badge ? (
        <p className="mt-2 text-xs font-semibold text-[#c9972c]">{track.badge}</p>
      ) : null}

      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Target</dt>
          <dd className="font-semibold text-[#0d1b35]">{track.target}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Entry</dt>
          <dd className="font-semibold text-[#0d1b35]">{track.entry}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Duration</dt>
          <dd className="font-semibold text-[#0d1b35]">{track.duration}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Price</dt>
          <dd className="font-bold text-[#0d9488]">{track.price}</dd>
        </div>
      </dl>

      <ul className="mt-5 flex-1 space-y-2 text-sm text-slate-600">
        {meta.bullets.map((b) => (
          <li key={b} className="flex gap-2">
            <span className="text-[#0d9488]">✓</span>
            <span>{b}</span>
          </li>
        ))}
      </ul>

      <Link
        href={trackHref}
        className={`mt-6 block rounded-xl px-5 py-3 text-center text-sm font-bold ${
          isPlus
            ? "bg-[#c9972c] text-[#0d1b35] hover:opacity-95"
            : "bg-[#0d1b35] text-white hover:bg-[#152a4d]"
        }`}
      >
        Start {track.name}
      </Link>
    </div>
  );
}

export default function AcceleratorHomePage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const { base } = usePathwayStudentContext();

  useEffect(() => {
    fetch("/api/student/accelerator")
      .then((r) => r.json())
      .then((json) => {
        if (!json.error) setData(json);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSpinner />;

  const recommendedTrack = data?.recommendedTrack ?? "plus";
  const tracks =
    data?.tracks ??
    Object.values(ACCELERATOR_TRACKS).map((t) => ({
      id: t.id,
      name: t.name,
      target: t.target,
      entry: t.entry,
      duration: t.duration,
      price: t.price,
      weekCount: t.weekCount,
      badge: t.badge ?? null,
      bullets: t.bullets,
      href: `/dashboard/student/accelerator/${t.id}`,
      isRecommended: t.id === recommendedTrack,
    }));

  return (
    <div className="flex min-h-screen bg-slate-50">
      <StudentSidebar activePage="accelerator" />

      <main className="ml-[200px] min-h-screen flex-1">
        <header className="bg-[#0d1b35] px-8 py-10 text-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#c9972c]">
            Speakify Flagship Program
          </p>
          <h1 className="mt-2 text-3xl font-bold">IELTS Accelerator</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
            We don&apos;t teach IELTS tricks — we build the English that makes IELTS
            achievable
          </p>
        </header>

        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="grid gap-6 lg:grid-cols-3">
            {tracks.map((track) => (
              <TrackCard
                key={track.id}
                track={track}
                recommendedTrack={recommendedTrack}
                trackHref={
                  base.startsWith("/dashboard/ielts/student")
                    ? `${base}/accelerator/${track.id}/practice`
                    : track.href
                }
              />
            ))}
          </div>

          <div className="mt-10 rounded-xl border border-[#0d9488]/30 bg-[#0d9488]/10 px-5 py-4">
            <p className="text-sm font-semibold text-[#0d9488]">
              Not sure which track? Your placement test recommends:{" "}
              <span className="text-[#0d1b35]">
                {data?.recommendedTrackName ?? "Plus"}
              </span>
              {data?.placementBand != null ? (
                <span className="font-normal text-slate-600">
                  {" "}
                  (Band {data.placementBand.toFixed(1)})
                </span>
              ) : null}
            </p>
          </div>

          <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[#0d1b35]">
              Your weekly learning cycle
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Every week follows the same Monday → Friday rhythm
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-5">
              {ACCELERATOR_CYCLE.map((item, i) => (
                <div
                  key={item.day}
                  className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-center"
                >
                  <p className="text-xs font-bold uppercase text-[#c9972c]">
                    {item.day}
                  </p>
                  <p className="mt-2 text-xs leading-snug text-slate-600">
                    {item.focus}
                  </p>
                  {i < ACCELERATOR_CYCLE.length - 1 ? (
                    <span className="mt-2 hidden text-[#0d9488] sm:inline">→</span>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
