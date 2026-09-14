const JOIN_LEAD_MINUTES = 10;

function liveClassKindLabel(sessionType: string): string {
  const kind = String(sessionType ?? "").trim().toLowerCase();
  if (kind === "one_to_one") return "One-on-One";
  if (kind === "topic_group") return "Group Live Class";
  if (kind === "orientation") return "Orientation";
  return "Live class";
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function icsUtc(date: Date): string {
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  );
}

function foldIcsLine(line: string): string {
  if (line.length <= 75) return line;
  const chunks = [line.slice(0, 75)];
  let rest = line.slice(75);
  while (rest.length > 74) {
    chunks.push(` ${rest.slice(0, 74)}`);
    rest = rest.slice(74);
  }
  if (rest) chunks.push(` ${rest}`);
  return chunks.join("\r\n");
}

function escapeIcsText(value: string): string {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

export function liveClassCalendarDescription(input: {
  sessionType: string;
  pageUrl?: string | null;
}): string {
  const kind = liveClassKindLabel(input.sessionType);
  const join = `Join from Speakify ${JOIN_LEAD_MINUTES} minutes before start.`;
  const url = String(input.pageUrl ?? "").trim();
  if (!url) return `${kind}. ${join}`;
  return `${kind}. ${join} Open: ${url}`;
}

export function buildLiveClassIcs(input: {
  id: string;
  title: string;
  startsAt: Date | string;
  durationMinutes: number;
  description: string;
  url?: string | null;
}): string {
  const start = input.startsAt instanceof Date ? input.startsAt : new Date(input.startsAt);
  const minutes = Math.max(1, Math.round(Number(input.durationMinutes) || 55));
  const end = new Date(start.getTime() + minutes * 60 * 1000);
  const stamp = icsUtc(new Date());
  const uid = `live-class-${String(input.id).replace(/[^a-zA-Z0-9-]/g, "")}@speakify`;
  const url = String(input.url ?? "").trim();
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Speakify//Live Classes//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${icsUtc(start)}`,
    `DTEND:${icsUtc(end)}`,
    foldIcsLine(`SUMMARY:${escapeIcsText(input.title)}`),
    foldIcsLine(`DESCRIPTION:${escapeIcsText(input.description)}`),
    "LOCATION:Speakify live class",
  ];
  if (url) lines.push(foldIcsLine(`URL:${url}`));
  lines.push("END:VEVENT", "END:VCALENDAR", "");
  return lines.join("\r\n");
}

export function liveClassIcsFilename(input: {
  sessionType: string;
  startsAt: Date | string;
}): string {
  const start = input.startsAt instanceof Date ? input.startsAt : new Date(input.startsAt);
  const ymd = Number.isFinite(start.getTime()) ? start.toISOString().slice(0, 10) : "class";
  const kind = String(input.sessionType ?? "class")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `speakify-${kind || "class"}-${ymd}.ics`;
}
