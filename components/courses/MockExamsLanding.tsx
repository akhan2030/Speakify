"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  ACADEMIC_MOCK_CATALOG,
} from "@/lib/mock-test/academicMockCatalog";
import {
  GT_MOCK_CATALOG,
  GT_MOCK_PRICING,
} from "@/lib/ielts-general/gtMockCatalog";
import {
  GT_MOCK_LOBBY_PATH,
  IELTS_MOCK_LOBBY_PATH,
  gtMockLobbyHref,
  ieltsMockLobbyHref,
} from "@/lib/mock-test/ieltsMockRoutes";
import {
  FOUNDING_50_OFFER_CODE,
  getFoundingOffer,
  rememberFoundingOffer,
} from "@/lib/discounts";
import FoundingOfferPopup from "@/components/offers/FoundingOfferPopup";
import { useMarketingLocale } from "@/components/marketing/MarketingLocale";

const NAVY = "#0d1b35";
const GOLD = "#c9972c";
const TEAL = "#0d9488";

const singleOffer = getFoundingOffer("mock-single");
const pack3Offer = getFoundingOffer("mock-pack3");
const pack5Offer = getFoundingOffer("mock-pack5");

function buyHref(
  product: string,
  mockNumber?: number,
  programme: "ielts" | "ielts_general" = "ielts"
) {
  const params = new URLSearchParams({ product, offer: FOUNDING_50_OFFER_CODE });
  if (programme === "ielts_general") params.set("programme", "ielts_general");
  if (product === "single" && mockNumber != null) {
    params.set("mock", String(mockNumber));
  }
  return `/checkout/mock?${params.toString()}`;
}

function registerHref(
  product: string,
  mockNumber?: number,
  programme: "ielts" | "ielts_general" = "ielts"
) {
  const params = new URLSearchParams({ product, offer: FOUNDING_50_OFFER_CODE });
  if (programme === "ielts_general") params.set("programme", "ielts_general");
  if (product === "single" && mockNumber != null) {
    params.set("mock", String(mockNumber));
  }
  return `/register/mock-exam?${params.toString()}`;
}

export default function MockExamsLanding() {
  const { t } = useMarketingLocale();
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated";
  const enrolled = ((session?.user as { enrolledPrograms?: unknown })?.enrolledPrograms ??
    []) as unknown[];
  const enrolledSlugs = enrolled.map((p) => String(p).trim().toLowerCase());
  const hasAcademicFullAccess =
    (session?.user as { hasDashboardAccess?: boolean })?.hasDashboardAccess === true &&
    (session?.user as { purchaseIntent?: string | null })?.purchaseIntent !== "mock_only" &&
    enrolledSlugs.includes("ielts");
  const hasGeneralFullAccess =
    (session?.user as { hasDashboardAccess?: boolean })?.hasDashboardAccess === true &&
    (session?.user as { purchaseIntent?: string | null })?.purchaseIntent !== "mock_only" &&
    enrolledSlugs.includes("ielts_general");

  function ctaForMock(mockNumber: number) {
    if (isLoggedIn && hasAcademicFullAccess) {
      return {
        href: ieltsMockLobbyHref(mockNumber),
        label: t("mockExams.startMock").replace("{n}", String(mockNumber)),
      };
    }
    if (isLoggedIn) {
      return {
        href: buyHref("single", mockNumber),
        label: t("mockExams.buyMock").replace("{n}", String(mockNumber)),
      };
    }
    return {
      href: registerHref("single", mockNumber),
      label: t("mockExams.buyMock").replace("{n}", String(mockNumber)),
    };
  }

  function packCta(product: "pack3" | "pack5") {
    if (isLoggedIn && hasAcademicFullAccess) {
      return { href: IELTS_MOCK_LOBBY_PATH, label: t("mockExams.goToLobby") };
    }
    if (isLoggedIn) {
      return { href: buyHref(product), label: t(`mockExams.buy${product}`) };
    }
    return { href: registerHref(product), label: t(`mockExams.buy${product}`) };
  }

  function generalCtaForMock(mockNumber: number) {
    if (isLoggedIn && hasGeneralFullAccess) {
      return {
        href: gtMockLobbyHref(mockNumber),
        label: `Start General Mock #${mockNumber}`,
      };
    }
    if (isLoggedIn) {
      return {
        href: buyHref("single", mockNumber, "ielts_general"),
        label: `Buy General Mock #${mockNumber}`,
      };
    }
    return {
      href: registerHref("single", mockNumber, "ielts_general"),
      label: `Buy General Mock #${mockNumber}`,
    };
  }

  function generalPack3Cta() {
    if (isLoggedIn && hasGeneralFullAccess) {
      return { href: GT_MOCK_LOBBY_PATH, label: "Go to General lobby" };
    }
    if (isLoggedIn) {
      return {
        href: buyHref("pack3", undefined, "ielts_general"),
        label: "Buy General 3-Mock Pack",
      };
    }
    return {
      href: registerHref("pack3", undefined, "ielts_general"),
      label: "Buy General 3-Mock Pack",
    };
  }

  const pack3 = packCta("pack3");
  const pack5 = packCta("pack5");
  const generalPack3 = generalPack3Cta();
  const hasFullAccess = hasAcademicFullAccess;

  return (
    <div>
      <FoundingOfferPopup productId="mock-pack5" />
      <section className="relative overflow-hidden px-4 py-14 sm:px-6 sm:py-20" style={{ backgroundColor: NAVY }}>
        <div className="relative mx-auto max-w-6xl text-center">
          <p className="text-sm font-bold uppercase tracking-widest" style={{ color: GOLD }}>
            {t("mockExams.heroEyebrow")}
          </p>
          <h1 className="mx-auto mt-4 max-w-3xl text-3xl font-extrabold text-white sm:text-4xl">
            {t("mockExams.heroTitle")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-300 sm:text-lg">
            {t("mockExams.heroSubtitle")}
          </p>
          <p className="mx-auto mt-6 max-w-xl rounded-xl border px-4 py-3 text-sm font-medium text-[#f5e6c8]"
            style={{ borderColor: `${GOLD}66`, backgroundColor: `${GOLD}18` }}
          >
            {t("mockExams.heroTrust")}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <section id="academic" className="scroll-mt-24">
        <p className="text-center text-xs font-bold uppercase tracking-widest" style={{ color: TEAL }}>
          IELTS Academic
        </p>
        <h2 className="mt-2 text-center text-2xl font-bold text-[#0d1b35]">
          {t("mockExams.individualTitle")}
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-slate-600">
          {t("mockExams.individualSubtitle")}
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {ACADEMIC_MOCK_CATALOG.map((mock) => {
            const cta = ctaForMock(mock.mockNumber);
            return (
              <article
                key={mock.mockNumber}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Mock #{mock.mockNumber}
                </p>
                <h3 className="mt-2 text-base font-bold text-[#0d1b35]">
                  Full IELTS Academic Mock Exam
                </h3>
                <ul className="mt-4 flex-1 space-y-1 text-xs text-slate-600">
                  <li>{t("mockExams.skillsLine")}</li>
                  <li>{t("mockExams.durationLine")}</li>
                  <li>{t("mockExams.retakesLine")}</li>
                </ul>
                <p className="mt-4 text-2xl font-extrabold" style={{ color: TEAL }}>
                  {singleOffer.discountedPriceLabel}
                </p>
                <p className="text-xs text-slate-400 line-through">
                  {singleOffer.originalPriceLabel}
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

        <section className="mt-14 rounded-2xl border border-[#0d9488]/30 bg-[#0d9488]/5 p-6 sm:p-8">
          <h2 className="text-xl font-bold text-[#0d1b35]">{t("mockExams.packsTitle")}</h2>
          <p className="mt-1 text-sm text-slate-600">{t("mockExams.packsSubtitle")}</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <article className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="font-bold text-[#0d1b35]">{t("mockExams.pack3Name")}</h3>
              <p className="mt-1 text-3xl font-extrabold" style={{ color: TEAL }}>
                {pack3Offer.discountedPriceLabel}
              </p>
              <p className="text-sm text-slate-400 line-through">
                {pack3Offer.originalPriceLabel}
              </p>
              <p className="mt-1 text-sm font-medium" style={{ color: GOLD }}>
                Founding 50 · Save {pack3Offer.discountPercent}%
              </p>
              <p className="mt-2 text-sm text-slate-600">{t("mockExams.pack3Unlocks")}</p>
              <Link
                href={pack3.href}
                onClick={() => rememberFoundingOffer()}
                className="mt-4 inline-flex rounded-xl px-5 py-2.5 text-sm font-bold text-white"
                style={{ backgroundColor: TEAL }}
              >
                {pack3.label}
              </Link>
            </article>
            <article className="rounded-xl border-2 border-[#0d9488] bg-white p-5 ring-2 ring-[#0d9488]/20">
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: TEAL }}>
                {t("mockExams.bestValue")}
              </p>
              <h3 className="mt-1 font-bold text-[#0d1b35]">{t("mockExams.pack5Name")}</h3>
              <p className="mt-1 text-3xl font-extrabold" style={{ color: TEAL }}>
                {pack5Offer.discountedPriceLabel}
              </p>
              <p className="text-sm text-slate-400 line-through">
                {pack5Offer.originalPriceLabel}
              </p>
              <p className="mt-1 text-sm font-medium" style={{ color: GOLD }}>
                Founding 50 · Save {pack5Offer.discountPercent}%
              </p>
              <p className="mt-2 text-sm text-slate-600">{t("mockExams.pack5Unlocks")}</p>
              <Link
                href={pack5.href}
                onClick={() => rememberFoundingOffer()}
                className="mt-4 inline-flex rounded-xl px-5 py-2.5 text-sm font-bold text-white"
                style={{ backgroundColor: NAVY }}
              >
                {pack5.label}
              </Link>
            </article>
          </div>
          {isLoggedIn && hasFullAccess ? (
            <p className="mt-6 text-sm text-slate-600">
              {t("mockExams.acceleratorIncluded")}{" "}
              <Link href={IELTS_MOCK_LOBBY_PATH} className="font-semibold underline" style={{ color: TEAL }}>
                {t("mockExams.goToLobby")} →
              </Link>
            </p>
          ) : null}
        </section>
        </section>

        <section id="general" className="mt-16 scroll-mt-24 border-t border-slate-200 pt-14">
          <p className="text-center text-xs font-bold uppercase tracking-widest" style={{ color: GOLD }}>
            IELTS General Training
          </p>
          <h2 className="mt-2 text-center text-2xl font-bold text-[#0d1b35]">
            3 full timed General mock exams
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-slate-600">
            Letter Writing Task 1, General Reading Sections A/B/C, Listening &amp; Speaking —
            sold separately from Academic mocks. No 5-pack (Reading inventory supports 3).
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {GT_MOCK_CATALOG.map((mock) => {
              const cta = generalCtaForMock(mock.mockNumber);
              return (
                <article
                  key={`general-${mock.mockNumber}`}
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
              href={generalPack3.href}
              onClick={() => rememberFoundingOffer()}
              className="mt-4 inline-flex rounded-xl px-5 py-2.5 text-sm font-bold text-white"
              style={{ backgroundColor: NAVY }}
            >
              {generalPack3.label}
            </Link>
            {isLoggedIn && hasGeneralFullAccess ? (
              <p className="mt-4 text-sm text-slate-600">
                General Accelerator includes all 3 mocks —{" "}
                <Link
                  href={GT_MOCK_LOBBY_PATH}
                  className="font-semibold underline"
                  style={{ color: TEAL }}
                >
                  open General lobby →
                </Link>
              </p>
            ) : null}
          </div>
        </section>

        <p className="mt-10 text-center text-xs text-slate-500">{t("mockExams.footerNote")}</p>
        <p className="mt-4 text-center text-sm text-slate-600">
          {t("mockExams.acceleratorUpsell")}{" "}
          <Link href="/courses#test-prep" className="font-semibold text-[#c9972c] hover:underline">
            {t("mockExams.browseAccelerator")} →
          </Link>
        </p>
      </div>
    </div>
  );
}
