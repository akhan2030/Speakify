"use client";

import { useMarketingLocale, type MarketingLang } from "./MarketingLocale";

export default function LanguageSwitcher() {
  const { lang, setLang } = useMarketingLocale();

  function toggle(next: MarketingLang) {
    setLang(next);
  }

  return (
    <div
      className="inline-flex items-center rounded-lg border border-white/20 p-0.5 text-xs font-semibold"
      role="group"
      aria-label="Language"
    >
      <button
        type="button"
        onClick={() => toggle("en")}
        className={`rounded-md px-2.5 py-1.5 transition-colors ${
          lang === "en"
            ? "bg-[#c9972c] text-[#0d1b35]"
            : "text-slate-300 hover:text-white"
        }`}
        aria-pressed={lang === "en"}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => toggle("ar")}
        className={`rounded-md px-2.5 py-1.5 transition-colors ${
          lang === "ar"
            ? "bg-[#c9972c] text-[#0d1b35]"
            : "text-slate-300 hover:text-white"
        }`}
        aria-pressed={lang === "ar"}
        lang="ar"
      >
        العربية
      </button>
    </div>
  );
}
