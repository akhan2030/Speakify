import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions, dashboardPathForSessionUser } from "@/lib/auth";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/courses");
  }

  const dashboardPath = dashboardPathForSessionUser(
    session.user as { role?: string; programType?: string }
  );

  if (dashboardPath && dashboardPath !== "/login") {
    redirect(dashboardPath);
  }

  redirect("/login");
}
