import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import PathwaySidebar from "@/components/PathwaySidebar";

export default async function PathwayStudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const role = (session.user as { role?: string }).role;
  if (role === "teacher") redirect("/dashboard/teacher");

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
