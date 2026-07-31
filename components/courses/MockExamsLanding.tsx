"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  ACADEMIC_MOCK_CATALOG,
  ACADEMIC_MOCK_PRICING,
} from "@/lib/mock-test/academicMockCatalog";
import { useMarketingLocale } from "@/components/marketing/MarketingLocale";

const NAVY = "#0d1b35";
const GOLD = "#c9972c";
const TEAL = "#0d9488";
const MOCK_LOBBY = "/dashboard/ielts/student/mock-exam";

function buyHref(product: string, mockNumber?: number) {
  const params = new URLSearchParams({ product });
  if (product === "single" && mockNumber != null) {
    params.set("mock", String(mockNumber));
  }
  return `/checkout/mock?${params.toString()}`;
}

function registerHref(product: string, mockNumber?: number) {
  const params = new URLSearchParams({ product });
  if (product === "single" && mockNumber != null) {
    params.set("mock", String(mockNumber));
  }
  return `/register/mock-exam?${params.toString()}`;
}

export default function MockExamsLanding() {
  const { t } = useMarketingLocale();
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated";
  const hasFullAccess =
    (session?.user as { hasDashboardAccess?: boolean })?.hasDashboardAccess === true &&
    (session?.user as { purchaseIntent?: string | null })?.purchaseIntent !== "mock_only";

  function ctaForMock(mockNumber: number) {
    if (isLoggedIn && hasFullAccess) {
      return { href: MOCK_LOBBY, label: t("mockExams.startMock").replace("{n}", String(mockNumber)) };
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
    if (isLoggedIn && hasFullAccess) {
      return { href: MOCK_LOBBY, label: t("mockExams.goToLobby") };
    }
    if (isLoggedIn) {
      return { href: buyHref(product), label: t(`mockExams.buy${product}`) };
    }
    return { href: registerHref(product), label: t(`mockExams.buy${product}`) };
  }

  const pack3 = packCta("pack3");
  const pack5 = packCta("pack5");

  return (
    <div>
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
        <h2 className="text-center text-2xl font-bold text-[#0d1b35]">
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
                <h3 className="mt-2 text-base font-bold text-[#0d1b35]">{mock.theme}</h3>
                <p className="mt-1 text-xs text-slate-500">{mock.readingFocus}</p>
                <ul className="mt-4 flex-1 space-y-1 text-xs text-slate-600">
                  <li>{t("mockExams.skillsLine")}</li>
                  <li>{t("mockExams.durationLine")}</li>
                  <li>{t("mockExams.retakesLine")}</li>
                </ul>
                <p className="mt-4 text-2xl font-extrabold" style={{ color: TEAL }}>
                  {mock.priceLabel}
                </p>
                <Link
                  href={cta.href}
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
                {ACADEMIC_MOCK_PRICING.pack3.priceLabel}
              </p>
              <p className="mt-1 text-sm text-slate-500">{ACADEMIC_MOCK_PRICING.pack3.saveVsSinglesLabel}</p>
              <p className="mt-2 text-sm text-slate-600">{t("mockExams.pack3Unlocks")}</p>
              <Link
                href={pack3.href}
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
                {ACADEMIC_MOCK_PRICING.pack5.priceLabel}
              </p>
              <p className="mt-1 text-sm text-slate-500">{ACADEMIC_MOCK_PRICING.pack5.saveVsSinglesLabel}</p>
              <p className="mt-2 text-sm text-slate-600">{t("mockExams.pack5Unlocks")}</p>
              <Link
                href={pack5.href}
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
              <Link href={MOCK_LOBBY} className="font-semibold underline" style={{ color: TEAL }}>
                {t("mockExams.goToLobby")} →
              </Link>
            </p>
          ) : null}
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
