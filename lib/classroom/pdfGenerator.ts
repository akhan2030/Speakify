/**
 * Classroom printable / PDF helper (stub).
 *
 * Approach: use the browser's native print pipeline — open the unit/lesson
 * view, apply `printCss`, then call `window.print()`. Teachers/students can
 * "Save as PDF" from the print dialog. No heavy PDF libraries (jspdf, etc.).
 *
 * Usage (client component):
 *   import { printCss, printClassroomPage } from "@/lib/classroom/pdfGenerator";
 *   // inject printCss into a <style> tag, then:
 *   printClassroomPage();
 */

/** CSS applied only in print media for clean A4 workbook pages. */
export const printCss = `
@media print {
  @page {
    size: A4;
    margin: 14mm 12mm;
  }

  html, body {
    background: #fff !important;
    color: #111 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .print\\:hidden,
  nav,
  aside,
  header,
  footer,
  [data-classroom-no-print="true"] {
    display: none !important;
  }

  .classroom-print-root,
  [data-classroom-print-root="true"] {
    display: block !important;
    width: 100% !important;
    max-width: none !important;
    box-shadow: none !important;
    border: none !important;
  }

  a[href]::after {
    content: none !important;
  }

  h1, h2, h3 {
    break-after: avoid;
    page-break-after: avoid;
  }

  section, article {
    break-inside: avoid;
    page-break-inside: avoid;
  }
}
`.trim();

/**
 * Trigger the browser print dialog (Save as PDF).
 * No-op on the server.
 */
export function printClassroomPage(): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.print();
    return true;
  } catch {
    return false;
  }
}

/**
 * Placeholder for a future server-side PDF export.
 * Intentionally unimplemented — use window.print + printCss instead.
 */
export async function generateClassroomPdfStub(_opts?: {
  title?: string;
  html?: string;
}): Promise<{ ok: false; reason: string }> {
  return {
    ok: false,
    reason:
      "Server PDF generation is not enabled. Use printCss + window.print() (Save as PDF) on the client.",
  };
}
