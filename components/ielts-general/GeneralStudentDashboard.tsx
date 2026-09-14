"use client";

import SpeakifyExamJourneyHome from "@/components/dashboards/SpeakifyExamJourneyHome";
import { PROGRAM_JOURNEYS } from "@/lib/dashboards/programJourneys";

export default function GeneralStudentDashboard() {
  return (
    <SpeakifyExamJourneyHome
      journey={PROGRAM_JOURNEYS.ielts_general}
      endpoints={{
        load: "/api/ielts-general/dashboard",
        mission: "/api/ielts-general/mission",
        mockHref: "/dashboard/ielts-general/student/mock-exam",
        homeHref: "/dashboard/ielts-general/student",
        mockDuration: "2h 45m",
      }}
    />
  );
}
