"use client";

import ClassroomShell from "@/components/classroom/ClassroomShell";
import "./classroom-print.css";

export default function ClassroomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClassroomShell mode="student">{children}</ClassroomShell>;
}
