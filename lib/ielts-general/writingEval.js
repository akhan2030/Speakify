import { evaluateGeneralWritingStructured } from "@/lib/ielts-general/structuredGtWritingEval";

export async function evaluateGeneralWriting(input) {
  return evaluateGeneralWritingStructured(input);
}
