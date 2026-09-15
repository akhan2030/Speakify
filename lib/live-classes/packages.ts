import {
  examCourseKey,
  orientationCourseKey,
  pathwayCourseKey,
  policyForKind,
  specialtyCourseKey,
  topicClassesForPackage,
  type LiveClassTier,
  type LiveCoursePackage,
} from "./model";

export type LiveClassUserSnapshot = {
  enrolledPrograms?: unknown;
  programSelected?: string | null;
  programType?: string | null;
  acceleratorTrack?: string | null;
  checkoutTrack?: string | null;
  paymentStatus?: string | null;
  cefrLevel?: string | null;
  currentPathwayLevel?: string | null;
};

export type LiveClassCatalog = "standard" | "one_to_one_only";

function enrollmentSet(user: LiveClassUserSnapshot): Set<string> {
  const slugs = parseEnrollmentSlugs(user.enrolledPrograms);
  const selected = normalizeSlug(user.programSelected ?? user.programType);
  return new Set([...slugs, selected].filter(Boolean));
}

function hasStepEnrollment(enrolled: Set<string>): boolean {
  for (const slug of enrolled) {
    if (slug === "step" || slug.startsWith("step_")) return true;
  }
  return false;
}

function hasGroupLiveClassPrograms(enrolled: Set<string>): boolean {
  for (const slug of enrolled) {
    if (
      slug === "ielts" ||
      slug.startsWith("ielts_") ||
      slug === "toefl" ||
      slug.startsWith("toefl_") ||
      slug.includes("pathway") ||
      slug.includes("business") ||
      slug.includes("legal") ||
      slug.includes("kids")
    ) {
      return true;
    }
  }
  return false;
}

/** STEP dashboards never offer group live classes. Dual-enrolled students still see groups on IELTS/TOEFL pages. */
export function liveClassCatalogForUser(
  user: LiveClassUserSnapshot,
  requested?: string | null
): LiveClassCatalog {
  const raw = String(requested ?? "").trim().toLowerCase();
  if (raw.includes("one_to_one") || raw.includes("/dashboard/step/")) {
    return "one_to_one_only";
  }
  const enrolled = enrollmentSet(user);
  if (hasStepEnrollment(enrolled) && !hasGroupLiveClassPrograms(enrolled)) {
    return "one_to_one_only";
  }
  return "standard";
}

function parseEnrollmentSlugs(value: unknown): string[] {
  const out: string[] = [];
  const add = (raw: string) => {
    const v = raw.trim().toLowerCase().replace(/-/g, "_");
    if (v) out.push(v);
  };
  if (Array.isArray(value)) {
    for (const entry of value) add(String(entry));
  } else if (typeof value === "string" && value.trim()) {
    for (const part of value.split(",")) add(part);
  }
  return out;
}

function normalizeSlug(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_");
}

function resolveTier(user: LiveClassUserSnapshot): LiveClassTier {
  const raw = String(user.acceleratorTrack ?? user.checkoutTrack ?? "foundation")
    .trim()
    .toLowerCase();
  if (raw === "plus" || raw === "elite" || raw === "foundation") return raw;
  return "foundation";
}

function paidExamAccess(user: LiveClassUserSnapshot): boolean {
  const status = String(user.paymentStatus ?? "").trim().toLowerCase();
  return status === "paid" || status === "comped";
}

export function orientationPackage(): LiveCoursePackage {
  return {
    courseKey: orientationCourseKey(),
    kind: "account",
    policy: "language_development",
    label: "Orientation (all courses)",
    tier: null,
    topicIncluded: 0,
  };
}

export function packagesForStudent(user: LiveClassUserSnapshot): LiveCoursePackage[] {
  const packages: LiveCoursePackage[] = [orientationPackage()];
  const enrolled = enrollmentSet(user);
  const tier = resolveTier(user);

  const add = (pkg: LiveCoursePackage) => {
    if (packages.some((p) => p.courseKey === pkg.courseKey)) return;
    packages.push(pkg);
  };

  if (enrolled.has("ielts") && paidExamAccess(user)) {
    add({
      courseKey: examCourseKey("ielts", tier),
      kind: "exam_tiered",
      policy: policyForKind("exam_tiered"),
      label: `IELTS Academic · ${capitalize(tier)}`,
      tier,
      topicIncluded: topicClassesForPackage("exam_tiered", tier),
    });
  }

  if (enrolled.has("ielts_general") && paidExamAccess(user)) {
    add({
      courseKey: examCourseKey("ielts_general", tier),
      kind: "exam_tiered",
      policy: policyForKind("exam_tiered"),
      label: `IELTS General · ${capitalize(tier)}`,
      tier,
      topicIncluded: topicClassesForPackage("exam_tiered", tier),
    });
  }

  if (enrolled.has("toefl")) {
    add({
      courseKey: examCourseKey("toefl", "foundation"),
      kind: "exam_single_tier",
      policy: policyForKind("exam_single_tier"),
      label: "TOEFL iBT",
      tier: "foundation",
      topicIncluded: topicClassesForPackage("exam_single_tier", "foundation"),
    });
  }

  if (hasStepEnrollment(enrolled)) {
    add({
      courseKey: examCourseKey("step", "foundation"),
      kind: "exam_single_tier",
      policy: policyForKind("exam_single_tier"),
      label: "STEP",
      tier: "foundation",
      topicIncluded: topicClassesForPackage("exam_single_tier", "foundation"),
    });
  }

  if (enrolled.has("pathway") || enrolled.has("english_pathway")) {
    const level = String(user.currentPathwayLevel ?? user.cefrLevel ?? "current")
      .trim()
      .toLowerCase();
    add({
      courseKey: pathwayCourseKey(level),
      kind: "pathway_level",
      policy: policyForKind("pathway_level"),
      label: `English Pathway · ${level.toUpperCase()}`,
      tier: null,
      topicIncluded: topicClassesForPackage("pathway_level", null),
    });
  }

  if (enrolled.has("business_english")) {
    add({
      courseKey: specialtyCourseKey("business_english"),
      kind: "specialty_course",
      policy: policyForKind("specialty_course"),
      label: "Business English",
      tier: null,
      topicIncluded: topicClassesForPackage("specialty_course", null),
    });
  }

  if (enrolled.has("legal_english")) {
    add({
      courseKey: specialtyCourseKey("legal_english"),
      kind: "specialty_course",
      policy: policyForKind("specialty_course"),
      label: "Legal English",
      tier: null,
      topicIncluded: topicClassesForPackage("specialty_course", null),
    });
  }

  if (enrolled.has("kids_english")) {
    add({
      courseKey: specialtyCourseKey("kids_english"),
      kind: "specialty_course",
      policy: policyForKind("specialty_course"),
      label: "Kids English",
      tier: null,
      topicIncluded: topicClassesForPackage("specialty_course", null),
    });
  }

  return packages;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
