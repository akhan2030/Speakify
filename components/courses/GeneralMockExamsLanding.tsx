"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  GT_MOCK_CATALOG,
  GT_MOCK_PRICING,
} from "@/lib/ielts-general/gtMockCatalog";
import {
  GT_MOCK_LOBBY_PATH,
  gtMockLobbyHref,
} from "@/lib/mock-test/ieltsMockRoutes";
import {
  FOUNDING_50_OFFER_CODE,
  rememberFoundingOffer,
} from "@/lib/discounts";

const NAVY = "#0d1b35";
const GOLD = "#c9972c";
const TEAL = "#0d9488";

function buyHref(product: string, mockNumber?: number) {
  const params = new URLSearchParams({
    product,
    programme: "ielts_general",
    offer: FOUNDING_50_OFFER_CODE,
  });
  if (product === "single" && mockNumber != null) {
    params.set("mock", String(mockNumber));
  }
  return `/checkout/mock?${params.toString()}`;
}

function registerHref(product: string, mockNumber?: number) {
  const params = new URLSearchParams({
    product,
    programme: "ielts_general",
    offer: FOUNDING_50_OFFER_CODE,
  });
  if (product === "single" && mockNumber != null) {
    params.set("mock", String(mockNumber));
  }
  return `/register/mock-exam?${params.toString()}`;
}

export default function GeneralMockExamsLanding() {
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated";
  const enrolled = ((session?.user as { enrolledPrograms?: unknown })?.enrolledPrograms ??
    []) as unknown[];
  const enrolledSlugs = enrolled.map((p) => String(p).trim().toLowerCase());
  const hasGeneralFullAccess =
    (session?.user as { hasDashboardAccess?: boolean })?.hasDashboardAccess === true &&
    (session?.user as { purchaseIntent?: string | null })?.purchaseIntent !== "mock_only" &&
    enrolledSlugs.includes("ielts_general");

  function ctaForMock(mockNumber: number) {
    // Always send logged-in General Accelerator students to the General lobby —
    // never the Academic path under /dashboard/ielts/...
    if (isLoggedIn && hasGeneralFullAccess) {
      return {
        href: gtMockLobbyHref(mockNumber),
        label: `Start General Mock #${mockNumber}`,
      };
    }
    if (isLoggedIn) {
      return {
        href: buyHref("single", mockNumber),
        label: `Buy General Mock #${mockNumber}`,
      };
    }
    return {
      href: registerHref("single", mockNumber),
      label: `Buy General Mock #${mockNumber}`,
    };
  }

  const packHref = hasGeneralFullAccess
    ? GT_MOCK_LOBBY_PATH
    : isLoggedIn
      ? buyHref("pack3")
      : registerHref("pack3");
  const packLabel = hasGeneralFullAccess
    ? "Go to General lobby"
    : "Buy General 3-Mock Pack";

  return (
    <div>
      <section className="relative overflow-hidden px-4 py-14 sm:px-6 sm:py-20" style={{ backgroundColor: NAVY }}>
        <div className="relative mx-auto max-w-6xl text-center">
          <p className="text-sm font-bold uppercase tracking-widest" style={{ color: GOLD }}>
            IELTS General Training · Full mock exams
          </p>
          <h1 className="mx-auto mt-4 max-w-3xl text-3xl font-extrabold text-white sm:text-4xl">
            3 full timed General mock exams
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-300 sm:text-lg">
            Letter Writing Task 1, General Reading Sections A/B/C, Listening &amp; Speaking.
            Sold separately from Academic mocks — this page never opens the Academic lobby.
          </p>
          <p
            className="mx-auto mt-6 max-w-xl rounded-xl border px-4 py-3 text-sm font-medium text-[#f5e6c8]"
            style={{ borderColor: `${GOLD}66`, backgroundColor: `${GOLD}18` }}
          >
            After purchase you land on{" "}
            <span className="font-bold">/dashboard/ielts-general/student/mock-exam</span>
          </p>
          <Link
            href="/courses/mock-exams"
            className="mt-6 inline-block text-sm font-semibold text-slate-300 underline hover:text-white"
          >
            Looking for Academic mocks instead? →
          </Link>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {GT_MOCK_CATALOG.map((mock) => {
            const cta = ctaForMock(mock.mockNumber);
            return (
              <article
                key={mock.mockNumber}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  General Mock #{mock.mockNumber}
                </p>
                <h3 className="mt-2 text-base font-bold text-[#0d1b35]">
                  Full IELTS General Training Mock Exam
                </h3>
                <p className="mt-2 text-xs text-slate-600">{mock.theme}</p>
                <ul className="mt-4 flex-1 space-y-1 text-xs text-slate-600">
                  <li>Listening · Reading A/B/C · Writing (letter) · Speaking</li>
                  <li>~2h 45m timed · unlimited retakes</li>
                  <li>AI + human Writing/Speaking review</li>
                </ul>
                <p className="mt-4 text-2xl font-extrabold" style={{ color: TEAL }}>
                  {GT_MOCK_PRICING.single.priceLabel}
                </p>
                <Link
                  href={cta.href}
                  onClick={() => rememberFoundingOffer()}
                  className="mt-4 block rounded-xl py-2.5 text-center text-sm font-bold text-white hover:opacity-95"
                  style={{ backgroundColor: TEAL }}
                >
                  {cta.label}
                </Link>
              </article>
            );
          })}
        </div>

        <div className="mt-8 rounded-2xl border border-[#c9972c]/40 bg-[#c9972c]/5 p-6 sm:p-8">
          <h3 className="text-lg font-bold text-[#0d1b35]">General 3-Mock Pack</h3>
          <p className="mt-1 text-3xl font-extrabold" style={{ color: TEAL }}>
            {GT_MOCK_PRICING.pack3.priceLabel}
          </p>
          <p className="mt-1 text-sm font-medium" style={{ color: GOLD }}>
            {GT_MOCK_PRICING.pack3.saveVsSinglesLabel}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Unlocks all 3 full timed General mocks. Not interchangeable with Academic packs.
          </p>
          <Link
            href={packHref}
            onClick={() => rememberFoundingOffer()}
            className="mt-4 inline-flex rounded-xl px-5 py-2.5 text-sm font-bold text-white"
            style={{ backgroundColor: NAVY }}
          >
            {packLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
