export type AdminActivePage =
  | "overview"
  | "users"
  | "programmes"
  | "courses"
  | "teachers"
  | "reports"
  | "settings";

export const ADMIN_NAV_ITEMS: {
  id: AdminActivePage;
  label: string;
  href: string;
  icon: string;
  description: string;
}[] = [
  {
    id: "overview",
    label: "Overview",
    href: "/dashboard/admin",
    icon: "◆",
    description: "Platform summary",
  },
  {
    id: "users",
    label: "Users",
    href: "/dashboard/admin/users",
    icon: "👥",
    description: "Students & accounts",
  },
  {
    id: "programmes",
    label: "Programmes",
    href: "/dashboard/admin/programmes",
    icon: "📚",
    description: "IELTS, Pathway, specialty",
  },
  {
    id: "courses",
    label: "Courses",
    href: "/dashboard/admin/courses",
    icon: "🗂",
    description: "Catalog & content",
  },
  {
    id: "teachers",
    label: "Teachers",
    href: "/dashboard/admin/teachers",
    icon: "🎓",
    description: "Staff & access",
  },
  {
    id: "reports",
    label: "Reports",
    href: "/dashboard/admin/reports",
    icon: "📊",
    description: "Analytics & exports",
  },
  {
    id: "settings",
    label: "Settings",
    href: "/dashboard/admin/settings",
    icon: "⚙",
    description: "System configuration",
  },
];

export function getAdminActivePage(pathname: string): AdminActivePage {
  if (pathname === "/dashboard/admin") return "overview";
  const match = ADMIN_NAV_ITEMS.find(
    (item) => item.id !== "overview" && pathname.startsWith(item.href)
  );
  return match?.id ?? "overview";
}
