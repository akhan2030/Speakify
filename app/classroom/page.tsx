"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { normalizeRole } from "@/lib/roles";

export default function ClassroomHomePage() {
  const { status, data: session } = useSession();
  const router = useRouter();
  const role = normalizeRole((session?.user as { role?: string })?.role);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
    if (role === "teacher") router.replace("/classroom-teacher");
    if (role === "admin") router.replace("/admin/classroom");
  }, [status, role, router]);

  if (status === "loading" || role === "teacher" || role === "admin") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-slate-500">
        Loading classroom…
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">
          Level badge · assigned after placement
        </div>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900">
          Speakify Classroom
        </h1>
        <p className="mt-3 text-lg leading-relaxed text-slate-600">
          Teacher-led English for the whole class — separate from your
          self-study LMS dashboard. No AI chat here.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold">Pilot: B1.1</h2>
        <p className="mt-1 text-slate-600">
          Pre-Intermediate 1 · open the pilot unit when content is published.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={`/classroom/${encodeURIComponent("b1-1")}/${encodeURIComponent("unit-1-smart-cities")}`}
            className="inline-flex rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Open Unit 1 — Smart Cities
          </Link>
          <Link
            href={`/classroom/${encodeURIComponent("b1-1")}`}
            className="inline-flex rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            All B1.1 units
          </Link>
          <Link
            href="/classroom/placement"
            className="inline-flex rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Placement info
          </Link>
        </div>
      </section>
    </div>
  );
}
