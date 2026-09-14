/** Numbered Academic Listening papers shown on the Listening hub. */
export const ACADEMIC_LISTENING_FULL_TESTS = [
  {
    n: 1,
    title: "Listening Test 1",
    summary: "Fitness membership · community centre · park research · urban bees",
  },
  {
    n: 2,
    title: "Listening Test 2",
    summary: "Hotel booking · museum tour · renewable energy · microplastics",
  },
  {
    n: 3,
    title: "Listening Test 3",
    summary: "Car rental · library orientation · transport survey · vertical farming",
  },
  {
    n: 4,
    title: "Listening Test 4",
    summary: "Vet clinic · wildlife rescue · food-waste audit · night-shift work",
  },
  {
    n: 5,
    title: "Listening Test 5",
    summary: "Music school · climbing centre · bicycle theft · peatland carbon",
  },
] as const;

export type AcademicListeningTestNumber = (typeof ACADEMIC_LISTENING_FULL_TESTS)[number]["n"];

export function isAcademicListeningTestNumber(
  value: unknown
): value is AcademicListeningTestNumber {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 5;
}
