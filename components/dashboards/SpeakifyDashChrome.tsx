"use client";

import { speakifyFraunces, speakifyInter } from "@/lib/brand/fonts";
import "@/components/ielts/dashboard/ieltsDashboardBlueprint.css";

export default function SpeakifyDashChrome({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`${speakifyInter.variable} ${speakifyFraunces.variable} ${speakifyInter.className} speakify-dash ${className}`.trim()}
    >
      {children}
    </div>
  );
}
