import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import PathwaySidebar from "@/components/PathwaySidebar";
import { canAccessStudentDashboard } from "@/lib/programType";
import { normalizeRole } from "@/lib/roles";
import { dashboardPathForStudentUser } from "@/lib/studentLoginRedirect";

export default async function PathwayStudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const role = normalizeRole((session.user as { role?: string }).role);
  if (role === "teacher") redirect("/dashboard/teacher");

  if (role === "student") {
    const user = session.user as {
      programType?: string | null;
      enrolledPrograms?: unknown;
      programSelected?: string | null;
      stepEnrolled?: boolean;
    };
    const allowed = canAccessStudentDashboard("pathway", {
      programType: user.programType,
      enrolledPrograms: user.enrolledPrograms,
      programSelected: user.programSelected,
    });
    if (!allowed) {
      redirect(
        dashboardPathForStudentUser({
          role: "student",
          programType: user.programType,
          enrolledPrograms: user.enrolledPrograms,
          stepEnrolled: user.stepEnrolled,
          programSelected: user.programSelected,
        })
      );
    }
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc" }}>
      <PathwaySidebar user={session.user} />
      <main
        style={{
          flex: 1,
          marginLeft: "260px",
          padding: "2rem",
          maxWidth: "1200px",
        }}
      >
        {children}
      </main>
    </div>
  );
}
