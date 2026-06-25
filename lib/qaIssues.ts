export type QaSeverity = "critical" | "high" | "medium" | "low";
export type QaStatus =
  | "detected"
  | "under_review"
  | "assigned"
  | "fixed"
  | "verified"
  | "dismissed";

export type QaIssueType =
  | "content_error"
  | "technical_error"
  | "assessment_error"
  | "student_experience"
  | "ai_generated_content"
  | "design_ui"
  | "mobile_responsiveness"
  | "trust_safety"
  | "certificate_error"
  | "placement_test_error";

export type QaIssue = {
  id: string;
  title: string;
  description?: string | null;
  issue_type: QaIssueType;
  issueType?: QaIssueType;
  severity: QaSeverity;
  affected_area?: string | null;
  affectedArea?: string | null;
  affected_url?: string | null;
  affectedUrl?: string | null;
  content_id?: string | null;
  contentId?: string | null;
  suggested_fix?: string | null;
  suggestedFix?: string | null;
  assigned_to?: string | null;
  assignedTo?: string | null;
  quick_fix?: boolean;
  quickFix?: boolean;
  status: QaStatus;
  resolution_notes?: string | null;
  resolutionNotes?: string | null;
  created_by?: string | null;
  createdBy?: string | null;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
};

export type QaStats = {
  critical: number;
  high: number;
  medium: number;
  low: number;
  pendingReview: number;
  fixedThisWeek: number;
  urgentCount: number;
};

export const ISSUE_TYPES: { value: QaIssueType; label: string }[] = [
  { value: "content_error", label: "Content Error" },
  { value: "technical_error", label: "Technical Error" },
  { value: "assessment_error", label: "Assessment Error" },
  { value: "student_experience", label: "Student Experience" },
  { value: "ai_generated_content", label: "AI Generated Content" },
  { value: "design_ui", label: "Design / UI" },
  { value: "mobile_responsiveness", label: "Mobile Responsiveness" },
  { value: "trust_safety", label: "Trust & Safety" },
  { value: "certificate_error", label: "Certificate Error" },
  { value: "placement_test_error", label: "Placement Test Error" },
];

export const SEVERITIES: { value: QaSeverity; label: string }[] = [
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export const STATUSES: { value: QaStatus; label: string }[] = [
  { value: "detected", label: "Detected" },
  { value: "under_review", label: "Under Review" },
  { value: "assigned", label: "Assigned" },
  { value: "fixed", label: "Fixed" },
  { value: "verified", label: "Verified" },
  { value: "dismissed", label: "Dismissed" },
];

const CLOSED_STATUSES = new Set<QaStatus>(["fixed", "verified", "dismissed"]);

export function formatIssueType(value: string) {
  return ISSUE_TYPES.find((t) => t.value === value)?.label ?? value.replace(/_/g, " ");
}

export function formatSeverity(value: string) {
  return SEVERITIES.find((s) => s.value === value)?.label ?? value;
}

export function formatStatus(value: string) {
  return STATUSES.find((s) => s.value === value)?.label ?? value.replace(/_/g, " ");
}

export function severityBadgeClass(severity: string) {
  switch (severity) {
    case "critical":
      return "bg-[#dc2626]/15 text-[#dc2626] border-[#dc2626]/30";
    case "high":
      return "bg-[#ea580c]/15 text-[#ea580c] border-[#ea580c]/30";
    case "medium":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "low":
      return "bg-slate-100 text-slate-600 border-slate-200";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
}

export function statusBadgeClass(status: string) {
  switch (status) {
    case "detected":
      return "bg-[#dc2626]/15 text-[#dc2626] border-[#dc2626]/30";
    case "under_review":
      return "bg-[#ea580c]/15 text-[#ea580c] border-[#ea580c]/30";
    case "assigned":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "fixed":
      return "bg-green-100 text-green-800 border-green-200";
    case "verified":
      return "bg-[#0d9488]/15 text-[#0d9488] border-[#0d9488]/30";
    case "dismissed":
      return "bg-slate-100 text-slate-600 border-slate-200";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
}

export function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function isOpenIssue(issue: QaIssue) {
  return !CLOSED_STATUSES.has(issue.status);
}

export function computeStats(issues: QaIssue[]): QaStats {
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);

  let critical = 0;
  let high = 0;
  let medium = 0;
  let low = 0;
  let pendingReview = 0;
  let fixedThisWeek = 0;

  for (const issue of issues) {
    const open = isOpenIssue(issue);
    if (open && issue.severity === "critical") critical += 1;
    if (open && issue.severity === "high") high += 1;
    if (open && issue.severity === "medium") medium += 1;
    if (open && issue.severity === "low") low += 1;
    if (issue.status === "detected" || issue.status === "under_review") {
      pendingReview += 1;
    }
    const updated = issue.updated_at ?? issue.updatedAt;
    if (issue.status === "fixed" && updated && new Date(updated) >= weekStart) {
      fixedThisWeek += 1;
    }
  }

  return {
    critical,
    high,
    medium,
    low,
    pendingReview,
    fixedThisWeek,
    urgentCount: critical + high,
  };
}

export function normalizeIssue(row: Record<string, unknown>): QaIssue {
  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    description: row.description as string | null,
    issue_type: row.issue_type as QaIssueType,
    issueType: row.issue_type as QaIssueType,
    severity: row.severity as QaSeverity,
    affected_area: row.affected_area as string | null,
    affectedArea: row.affected_area as string | null,
    affected_url: row.affected_url as string | null,
    affectedUrl: row.affected_url as string | null,
    content_id: row.content_id as string | null,
    contentId: row.content_id as string | null,
    suggested_fix: row.suggested_fix as string | null,
    suggestedFix: row.suggested_fix as string | null,
    assigned_to: row.assigned_to as string | null,
    assignedTo: row.assigned_to as string | null,
    quick_fix: Boolean(row.quick_fix),
    quickFix: Boolean(row.quick_fix),
    status: row.status as QaStatus,
    resolution_notes: row.resolution_notes as string | null,
    resolutionNotes: row.resolution_notes as string | null,
    created_by: row.created_by as string | null,
    createdBy: row.created_by as string | null,
    created_at: row.created_at as string | undefined,
    createdAt: row.created_at as string | undefined,
    updated_at: row.updated_at as string | undefined,
    updatedAt: row.updated_at as string | undefined,
  };
}

export function filterIssues(
  issues: QaIssue[],
  opts: {
    card?: string | null;
    severity?: string | null;
    type?: string | null;
    status?: string | null;
    assigned?: string | null;
    search?: string | null;
  }
) {
  let result = [...issues];

  if (opts.card === "critical") {
    result = result.filter((i) => i.severity === "critical" && isOpenIssue(i));
  } else if (opts.card === "high") {
    result = result.filter((i) => i.severity === "high" && isOpenIssue(i));
  } else if (opts.card === "medium") {
    result = result.filter((i) => i.severity === "medium" && isOpenIssue(i));
  } else if (opts.card === "low") {
    result = result.filter((i) => i.severity === "low" && isOpenIssue(i));
  } else if (opts.card === "pending") {
    result = result.filter(
      (i) => i.status === "detected" || i.status === "under_review"
    );
  } else if (opts.card === "fixed_week") {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    result = result.filter((i) => {
      const updated = i.updated_at ?? i.updatedAt;
      return (
        i.status === "fixed" && updated && new Date(updated) >= weekStart
      );
    });
  }

  if (opts.severity && opts.severity !== "all") {
    result = result.filter((i) => i.severity === opts.severity);
  }
  if (opts.type && opts.type !== "all") {
    result = result.filter((i) => i.issue_type === opts.type);
  }
  if (opts.status && opts.status !== "all") {
    result = result.filter((i) => i.status === opts.status);
  }
  if (opts.assigned && opts.assigned !== "all") {
    result = result.filter((i) => (i.assigned_to ?? "") === opts.assigned);
  }
  if (opts.search?.trim()) {
    const q = opts.search.trim().toLowerCase();
    result = result.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        (i.description ?? "").toLowerCase().includes(q) ||
        (i.affected_area ?? "").toLowerCase().includes(q) ||
        (i.assigned_to ?? "").toLowerCase().includes(q)
    );
  }

  return result;
}
