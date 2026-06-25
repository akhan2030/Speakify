"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Legacy route — full mock results live under /listening/test/results */
export default function ListeningResultsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/student/listening/test/results");
  }, [router]);

  return null;
}
