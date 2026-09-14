"use client";

import { useSession } from "next-auth/react";
import { PageSpinner } from "@/components/StudentSidebar";
import SpeakifyExamJourneyHome from "@/components/dashboards/SpeakifyExamJourneyHome";
import {
  isToeflEnrolment,
  PROGRAM_JOURNEYS,
} from "@/lib/dashboards/programJourneys";

export default function IeltsStudentDashboard() {
  const { data: session, status } = useSession();
  if (status === "loading") return <PageSpinner />;

  const toefl = isToeflEnrolment(
    session?.user as {
      programType?: string | null;
      programSelected?: string | null;
      enrolledPrograms?: unknown;
    }
  );

  return (
    <SpeakifyExamJourneyHome
      journey={toefl ? PROGRAM_JOURNEYS.toefl : PROGRAM_JOURNEYS.ielts_academic}
      endpoints={{
        load: "/api/student/ielts-dashboard",
        mission: "/api/student/ielts-mission",
        mockHref: "/dashboard/ielts/student/mock-exam",
        homeHref: "/dashboard/ielts/student/today",
        mockDuration: "2h 45m",
      }}
    />
  );
}
