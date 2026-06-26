"use client";

import { useSearchParams } from "next/navigation";
import { loginProgramContextFromCallback } from "@/lib/courses/loginPaths";
import {
  LOGIN_HERO_CONTENT,
  loginHeroProgrammeFromContext,
} from "@/lib/loginHeroContent";

/**
 * Left-side login hero card. Uses the same layout and colours as the original
 * IELTS SpeakifyWay hero — only the text changes per programme.
 */
export default function LoginWelcomePanel() {
  const searchParams = useSearchParams();
  const context = loginProgramContextFromCallback(
    searchParams.get("callbackUrl"),
    searchParams.get("program")
  );
  const programme = loginHeroProgrammeFromContext(context);
  const content = LOGIN_HERO_CONTENT[programme];

  return (
    <div className="text-white">
      <p className="text-sm font-semibold uppercase tracking-widest text-[#c9972c]">
        {content.eyebrow}
      </p>
      <p className="mt-6 text-2xl font-bold leading-snug sm:text-3xl">
        {content.headline}
        <br />
        <span className="text-[#c9972c]">{content.headlineHighlight}</span>
      </p>
      <ul className="mt-8 space-y-4">
        {content.bullets.map((line) => (
          <li key={line} className="flex gap-3 text-base leading-relaxed text-slate-200 sm:text-lg">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0d9488]" />
            {line}
          </li>
        ))}
      </ul>
      {content.footer && content.footerBold ? (
        <p className="mt-8 text-lg leading-relaxed text-slate-300">
          {content.footer}{" "}
          <span className="font-semibold text-white">{content.footerBold}</span>
        </p>
      ) : null}
    </div>
  );
}
