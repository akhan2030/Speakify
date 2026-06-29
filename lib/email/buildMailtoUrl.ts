type BuildMailtoUrlInput = {
  to: string;
  subject: string;
  body: string;
};

export function buildMailtoUrl(input: BuildMailtoUrlInput): string {
  const params = new URLSearchParams();
  params.set("subject", input.subject);
  params.set("body", input.body);
  return `mailto:${input.to}?${params.toString()}`;
}
