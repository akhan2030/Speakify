import { studentDashboardPath, type ProgramType } from "@/lib/programType";

export function buildLoginPath(callbackPath: string, programSlug?: string): string {
  const safe =
    callbackPath.startsWith("/") && !callbackPath.startsWith("//")
      ? callbackPath
      : "/dashboard/home";
  const params = new URLSearchParams();
  params.set("callbackUrl", safe);
  if (programSlug) params.set("program", programSlug);
  return `/login?${params.toString()}`;
}

export const PROGRAM_LOGIN_PATHS = {
  ielts: "/dashboard/ielts/student",
  ieltsGeneral: "/dashboard/ielts-general/student",
  pathway: "/dashboard/pathway/student",
  home: "/dashboard/home",
  teacher: "/dashboard/teacher",
} as const;

/** Post-login destination for each public course slug */
export const COURSE_POST_LOGIN_PATH: Record<string, string> = {
  "ielts-foundation": PROGRAM_LOGIN_PATHS.ielts,
  "ielts-plus": PROGRAM_LOGIN_PATHS.ielts,
  "ielts-elite": PROGRAM_LOGIN_PATHS.ielts,
  "ielts-gt-foundation": PROGRAM_LOGIN_PATHS.ieltsGeneral,
  "ielts-gt-plus": PROGRAM_LOGIN_PATHS.ieltsGeneral,
  "ielts-gt-elite": PROGRAM_LOGIN_PATHS.ieltsGeneral,
  "toefl-accelerator": PROGRAM_LOGIN_PATHS.ielts,
  "step-preparation": PROGRAM_LOGIN_PATHS.ielts,
  "english-pathway": PROGRAM_LOGIN_PATHS.pathway,
  "business-english": "/dashboard/business-english/student",
  "legal-english": "/dashboard/legal-english/student",
  "kids-english": "/dashboard/kids-english/student",
};

export function loginPathForCourseSlug(slug: string): string {
  const path = COURSE_POST_LOGIN_PATH[slug] ?? PROGRAM_LOGIN_PATHS.home;
  return buildLoginPath(path, slug);
}

export function loginPathForProgramType(programType: ProgramType): string {
  return buildLoginPath(studentDashboardPath(programType));
}

export function loginPathFromPathname(pathname: string): string {
  if (
    pathname === "/courses/ielts-gt" ||
    pathname.startsWith("/courses/ielts-gt-")
  ) {
    return buildLoginPath(PROGRAM_LOGIN_PATHS.ieltsGeneral, "ielts-gt-plus");
  }
  if (
    pathname === "/courses/ielts" ||
    (pathname.startsWith("/courses/ielts-") &&
      !pathname.startsWith("/courses/ielts-gt"))
  ) {
    return buildLoginPath(PROGRAM_LOGIN_PATHS.ielts, "ielts-plus");
  }
  if (pathname === "/courses/english-pathway") {
    return buildLoginPath(PROGRAM_LOGIN_PATHS.pathway, "english-pathway");
  }
  if (pathname === "/courses/business-english") {
    return buildLoginPath("/dashboard/business-english/student", "business-english");
  }
  if (pathname === "/courses/legal-english") {
    return buildLoginPath("/dashboard/legal-english/student", "legal-english");
  }
  if (pathname === "/courses/kids-english") {
    return buildLoginPath("/dashboard/kids-english/student", "kids-english");
  }
  const match = pathname.match(/^\/courses\/([^/]+)/);
  if (match) {
    return loginPathForCourseSlug(match[1]);
  }
  if (pathname.startsWith("/register/pathway")) {
    return loginPathForProgramType("pathway");
  }
  if (pathname.startsWith("/register/ielts-general")) {
    return buildLoginPath(PROGRAM_LOGIN_PATHS.ieltsGeneral, "ielts-general");
  }
  if (
    pathname.startsWith("/register/ielts-accelerator") ||
    pathname === "/register/ielts" ||
    pathname.startsWith("/register/toefl")
  ) {
    return loginPathForProgramType("ielts");
  }
  if (pathname.startsWith("/register/ielts")) {
    return loginPathForProgramType("ielts");
  }
  if (pathname.startsWith("/register/business-english")) {
    return buildLoginPath("/dashboard/business-english/student", "business-english");
  }
  if (pathname.startsWith("/register/legal-english")) {
    return buildLoginPath("/dashboard/legal-english/student", "legal-english");
  }
  if (pathname.startsWith("/register/kids-english")) {
    return buildLoginPath("/dashboard/kids-english/student", "kids-english");
  }
  return buildLoginPath(PROGRAM_LOGIN_PATHS.home);
}

export type LoginProgramContext =
  | "pathway"
  | "ielts"
  | "ielts_general"
  | "business_english"
  | "legal_english"
  | "kids_english"
  | "general";

const PROGRAM_SLUG_TO_CONTEXT: Record<string, LoginProgramContext> = {
  "english-pathway": "pathway",
  "ielts-foundation": "ielts",
  "ielts-plus": "ielts",
  "ielts-elite": "ielts",
  "ielts-gt-foundation": "ielts_general",
  "ielts-gt-plus": "ielts_general",
  "ielts-gt-elite": "ielts_general",
  "toefl-accelerator": "ielts",
  "step-preparation": "ielts",
  "business-english": "business_english",
  "legal-english": "legal_english",
  "kids-english": "kids_english",
  pathway: "pathway",
  ielts: "ielts",
  "ielts-general": "ielts_general",
  toefl: "ielts",
};

function isIeltsGeneralCallbackPath(path: string): boolean {
  return (
    path.includes("/dashboard/ielts-general/") ||
    path === "/courses/ielts-gt" ||
    path.startsWith("/courses/ielts-gt-") ||
    path.includes("/register/ielts-general") ||
    path.includes("ielts-gt-")
  );
}

function isIeltsAcademicCallbackPath(path: string): boolean {
  return (
    path.includes("/dashboard/ielts/") ||
    path === "/courses/ielts" ||
    (path.startsWith("/courses/ielts-") && !path.startsWith("/courses/ielts-gt")) ||
    path.includes("/register/ielts-accelerator") ||
    path === "/register/ielts" ||
    path.includes("/register/toefl") ||
    path.includes("toefl-accelerator") ||
    path.includes("step-preparation")
  );
}

export function loginProgramContextFromPath(path: string | null): LoginProgramContext {
  if (!path) return "general";

  if (path.includes("/business-english") || path.includes("business_english")) {
    return "business_english";
  }
  if (path.includes("/legal-english") || path.includes("legal_english")) {
    return "legal_english";
  }
  if (path.includes("/kids-english") || path.includes("kids_english")) {
    return "kids_english";
  }
  if (path.includes("/pathway") || path.includes("english-pathway")) return "pathway";
  if (isIeltsGeneralCallbackPath(path)) return "ielts_general";
  if (isIeltsAcademicCallbackPath(path)) return "ielts";
  return "general";
}

export function loginProgramContextFromSlug(slug: string | null): LoginProgramContext | null {
  if (!slug) return null;
  return PROGRAM_SLUG_TO_CONTEXT[slug.trim().toLowerCase()] ?? null;
}

export function loginProgramContextFromCallback(
  callbackUrl: string | null,
  programSlug?: string | null
): LoginProgramContext {
  const fromSlug = loginProgramContextFromSlug(programSlug ?? null);
  if (fromSlug) return fromSlug;

  if (!callbackUrl) return "general";

  try {
    const decoded = decodeURIComponent(callbackUrl);
    const path = decoded.startsWith("/")
      ? decoded
      : (() => {
          try {
            return new URL(decoded).pathname;
          } catch {
            return decoded;
          }
        })();
    if (path.startsWith("/") && !path.startsWith("//")) {
      return loginProgramContextFromPath(path);
    }
  } catch {
    // ignore malformed callback
  }
  return "general";
}

export function loginProgramLabel(context: LoginProgramContext): string {
  switch (context) {
    case "pathway":
      return "English Pathway";
    case "ielts":
      return "IELTS";
    case "ielts_general":
      return "IELTS General Training";
    case "business_english":
      return "Business English";
    case "legal_english":
      return "Legal English";
    case "kids_english":
      return "Kids English";
    default:
      return "Speakify";
  }
}
