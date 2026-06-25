import {
  formatSeverity,
  formatStatus,
  severityBadgeClass,
  statusBadgeClass,
} from "@/lib/qaIssues";

export function SeverityBadge({ severity }: { severity: string }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${severityBadgeClass(severity)}`}
    >
      {formatSeverity(severity)}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(status)}`}
    >
      {formatStatus(status)}
    </span>
  );
}
