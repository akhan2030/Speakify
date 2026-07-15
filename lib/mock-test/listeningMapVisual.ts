/**
 * Build IELTS-style map visuals for Section 2 plan/map labelling.
 * Letters are placed from location wording (east/west/north/south/basement…).
 */

export type ListeningMapLocation = {
  letter: string;
  text: string;
  x: number;
  y: number;
};

export type ListeningMapLandmark = {
  label: string;
  x: number;
  y: number;
};

export type ListeningMapVisual = {
  kind: "map";
  title: string;
  locations: ListeningMapLocation[];
  landmarks?: ListeningMapLandmark[];
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/** Place a location on a 0–100 floor-plan grid from its wording. */
export function positionFromLocationText(text: string, index: number): { x: number; y: number } {
  const t = text.toLowerCase();
  let x = 50;
  let y = 50;

  if (/\beast\b/.test(t)) x = 82;
  else if (/\bwest\b/.test(t)) x = 18;
  else if (/\bnorth\b/.test(t)) x = 50;
  else if (/\bsouth\b/.test(t)) x = 50;

  if (/\bnorth\b/.test(t)) y = 18;
  else if (/\bsouth\b/.test(t)) y = 82;
  else if (/\bbasement\b|\blevel one\b|\bground\b/.test(t)) y = 72;
  else if (/\bsecond floor\b|\blevel two\b|\bthird\b/.test(t)) y = 28;
  else if (/\bentrance\b|\bmain\b/.test(t)) y = 58;
  else if (/\bopposite\b|\bticket\b|\batrium\b|\bplaza\b/.test(t)) {
    x = 50;
    y = 48;
  } else if (/\bannex\b|\blab\b|\bwing\b/.test(t) && !/\beast\b|\bwest\b/.test(t)) {
    x = 70;
    y = 40;
  }

  // Slight stagger so overlapping keywords don't stack perfectly.
  const stagger = ((index % 3) - 1) * 4;
  return { x: clamp(x + stagger, 12, 88), y: clamp(y + stagger * 0.5, 12, 88) };
}

const DEFAULT_LANDMARKS: ListeningMapLandmark[] = [
  { label: "Main entrance", x: 50, y: 92 },
  { label: "Ticket machines", x: 50, y: 55 },
  { label: "Information desk", x: 38, y: 40 },
];

/**
 * Build a map visual from a lettered option box (same order as questions.options).
 */
export function buildListeningMapVisual(
  title: string,
  optionTexts: string[],
  landmarks?: ListeningMapLandmark[]
): ListeningMapVisual {
  const locations = optionTexts.map((text, i) => {
    const letter = String.fromCharCode(65 + i);
    const pos = positionFromLocationText(text, i);
    return { letter, text, ...pos };
  });

  return {
    kind: "map",
    title,
    locations,
    landmarks: landmarks ?? DEFAULT_LANDMARKS,
  };
}

/** Default titles per curated mock for Section 2 map blocks. */
export function defaultMapTitleForMock(mockNumber: number): string {
  switch (mockNumber) {
    case 1:
      return "National Science Centre — Ground Floor Map";
    case 2:
      return "Community Wellbeing Centre — Site Map";
    case 3:
      return "Student Learning Centre — Floor Map";
    case 4:
      return "National Space Education Centre — Map";
    case 5:
      return "Riyadh Cultural Festival — Site Map";
    default:
      return "Site Map";
  }
}
