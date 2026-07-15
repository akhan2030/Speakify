"use client";

/**
 * Official IELTS Listening example row (British Council style).
 * Only render when question + answer are provided from the same recording.
 * Never use a hardcoded placeholder (e.g. "Harbour City") that is not spoken.
 */
export default function ListeningExampleQuestion({
  questionText,
  answerText,
}: {
  questionText?: string;
  answerText?: string;
}) {
  const q = String(questionText ?? "").trim();
  const a = String(answerText ?? "").trim();
  if (!q || !a) return null;

  return (
    <div className="overflow-hidden rounded-lg border border-slate-300">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#3d3d3d] text-white">
            <th className="px-4 py-2.5 text-left font-bold">Example question</th>
            <th className="px-4 py-2.5 text-left font-bold">Answer</th>
          </tr>
        </thead>
        <tbody>
          <tr className="bg-[#f0f0f0]">
            <td className="px-4 py-3 text-[#1a1a1a]">{q}</td>
            <td className="px-4 py-3 font-medium text-[#1a1a1a]">{a}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
