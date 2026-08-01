import {
  getBuiltinPassages,
  getFullGtReadingTestForMock,
} from "../lib/ielts-general/readingContent.ts";

const c = getBuiltinPassages("C");
console.log("Section C count:", c.length);
console.log(
  "IDs:",
  c.map((p) => p.id)
);
for (const p of c) {
  const words = p.text.trim().split(/\s+/).length;
  const types = p.questions.map((q) => q.type);
  const tfng = p.questions
    .filter((q) => q.type === "true_false_not_given")
    .map((q) => ({ n: q.number, a: q.answer }));
  const mcq = p.questions.filter((q) => q.type === "multiple_choice");
  console.log(p.id, "words=", words, "qs=", p.questions.length);
  console.log("  TFNG:", JSON.stringify(tfng));
  console.log(
    "  MCQ option counts:",
    mcq.map((q) => (q.options || []).length)
  );
  console.log("  types:", types.join(", "));
  const orderOk = p.questions.every((q, i) => q.number === i + 1);
  console.log("  number order 1..n:", orderOk);
}
for (let m = 1; m <= 6; m++) {
  const t = getFullGtReadingTestForMock(m);
  const cPass = t.passages.find((p) => p.section === "C");
  console.log("mock", m, "Section C:", cPass?.id);
}
