const transcript = `Coordinator: Good morning, FutureTech Conference registration desk in London. How can I help you?
Caller: Hello, I'd like to register for the AI Research Summit on the fifteenth of March.
Coordinator: Of course. Can I take your first name?
Caller: James.
Coordinator: And your surname?
Caller: Henderson — that's H-E-N-D-E-R-S-O-N.`;

const body = JSON.stringify({
  transcript,
  text: transcript,
  voice: "onyx",
  mockTest: true,
  sectionNumber: 1,
  speakers: [
    { label: "Coordinator", name: "Coordinator" },
    { label: "Caller", name: "James" },
  ],
  questions: [
    { questionNumber: 1, answer: "James" },
    { questionNumber: 2, answer: "Henderson" },
  ],
  testId: "mock-1-s1-test",
});

const url =
  process.argv[2] ?? "https://ielts-ai-tutor-neon.vercel.app/api/listening/tts";

const start = Date.now();
const res = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body,
});

const ct = res.headers.get("content-type") ?? "";
console.log("status", res.status, "content-type", ct, "ms", Date.now() - start);

if (res.ok && ct.includes("audio")) {
  const buf = Buffer.from(await res.arrayBuffer());
  console.log("audio bytes", buf.length);
} else {
  console.log("body", (await res.text()).slice(0, 500));
}
