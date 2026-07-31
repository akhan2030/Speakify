"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageSpinner } from "@/components/StudentSidebar";
import { isIeltsAcademicMockPath } from "@/lib/mock-test/ieltsMockRoutes";

export const IELTS_ONBOARDING_CACHE_KEY = "ielts_onboarding_completed";

export function readIeltsOnboardingCache(): boolean | null {
  if (typeof window === "undefined") return null;
  const value = sessionStorage.getItem(IELTS_ONBOARDING_CACHE_KEY);
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

export function writeIeltsOnboardingCache(completed: boolean) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(IELTS_ONBOARDING_CACHE_KEY, completed ? "true" : "false");
}

export default function IeltsOnboardingGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const onOnboardingPage = pathname?.includes("/onboarding");
  const onMockExamPath = Boolean(pathname && isIeltsAcademicMockPath(pathname));
  const [ready, setReady] = useState(() =>
    onMockExamPath ? true : readIeltsOnboardingCache() !== null
  );

  useEffect(() => {
    if (onMockExamPath) {
      setReady(true);
      return;
    }
    let cancelled = false;

    async function check() {
      try {
        const res = await fetch("/api/student/ielts-onboarding");
        const json = await res.json();
        if (cancelled) return;

        const completed = Boolean(json.completed);
        writeIeltsOnboardingCache(completed);

        if (!completed && !onOnboardingPage) {
          router.replace("/dashboard/ielts/student/onboarding");
        } else if (completed && onOnboardingPage) {
          router.replace("/dashboard/ielts/student");
        }
      } catch {
        // Allow access if onboarding API is unavailable
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, [onOnboardingPage, onMockExamPath, pathname, router]);

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <PageSpinner />
      </div>
    );
  }

  return <>{children}</>;
}
