"use client";

import {
  countIeltsAnswerTokens,
  isWithinIeltsWordLimit,
} from "@/lib/readingQuestionContent.js";

type DiagramNode = {
  id: string;
  kind: "fixed" | "blank";
  text?: string;
  answer?: string;
};

type DiagramSpec = {
  title?: string;
  orientation?: "vertical" | "horizontal";
  nodes: DiagramNode[];
};

export default function DiagramCompletionPanel({
  diagram,
  answers,
  onChange,
  feedback,
}: {
  diagram: DiagramSpec;
  answers: Record<string, string>;
  onChange: (id: string, value: string) => void;
  feedback?: Record<string, { correct: boolean; correctAnswer: string }> | null;
}) {
  const nodes = diagram.nodes ?? [];
  const vertical = diagram.orientation !== "horizontal";
  const blankCount = nodes.filter((n) => n.kind === "blank").length;

  const boxW = vertical ? 280 : 150;
  const boxH = 56;
  const gap = vertical ? 36 : 28;
  const pad = 24;

  const positions = nodes.map((_, index) => {
    if (vertical) {
      return {
        x: pad + 40,
        y: pad + index * (boxH + gap),
      };
    }
    return {
      x: pad + index * (boxW + gap),
      y: pad + 40,
    };
  });

  const width = vertical
    ? boxW + pad * 2 + 80
    : pad * 2 + nodes.length * boxW + Math.max(0, nodes.length - 1) * gap;
  const height = vertical
    ? pad * 2 + nodes.length * boxH + Math.max(0, nodes.length - 1) * gap
    : boxH + pad * 2 + 80;

  let blankIndex = 0;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-slate-700">
        Label the diagram. Write{" "}
        <span className="font-semibold">
          NO MORE THAN TWO WORDS AND/OR A NUMBER
        </span>{" "}
        for each answer ({blankCount} blanks).
      </div>

      {diagram.title ? (
        <p className="text-sm font-bold text-[#0d1b35]">{diagram.title}</p>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-3">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="mx-auto h-auto w-full max-w-xl"
          role="img"
          aria-label={diagram.title ?? "Diagram"}
        >
          {nodes.map((node, index) => {
            if (index === 0) return null;
            const from = positions[index - 1];
            const to = positions[index];
            const x1 = vertical ? from.x + boxW / 2 : from.x + boxW;
            const y1 = vertical ? from.y + boxH : from.y + boxH / 2;
            const x2 = vertical ? to.x + boxW / 2 : to.x;
            const y2 = vertical ? to.y : to.y + boxH / 2;
            return (
              <g key={`edge-${node.id}`}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#94a3b8"
                  strokeWidth={2}
                  markerEnd="url(#arrow)"
                />
              </g>
            );
          })}
          <defs>
            <marker
              id="arrow"
              markerWidth="8"
              markerHeight="8"
              refX="6"
              refY="3"
              orient="auto"
            >
              <path d="M0,0 L6,3 L0,6 Z" fill="#94a3b8" />
            </marker>
          </defs>

          {nodes.map((node, index) => {
            const pos = positions[index];
            const isBlank = node.kind === "blank";
            if (isBlank) blankIndex += 1;
            const number = isBlank ? blankIndex : null;
            return (
              <g key={node.id} transform={`translate(${pos.x}, ${pos.y})`}>
                <rect
                  width={boxW}
                  height={boxH}
                  rx={10}
                  fill={isBlank ? "#fffbeb" : "#f8fafc"}
                  stroke={isBlank ? "#f59e0b" : "#cbd5e1"}
                  strokeWidth={2}
                />
                {number != null ? (
                  <text
                    x={14}
                    y={boxH / 2 + 5}
                    fontSize={14}
                    fontWeight={700}
                    fill="#0d1b35"
                  >
                    {number}
                  </text>
                ) : null}
                {!isBlank && node.text ? (
                  <text
                    x={boxW / 2}
                    y={boxH / 2 + 5}
                    textAnchor="middle"
                    fontSize={13}
                    fontWeight={600}
                    fill="#334155"
                  >
                    {node.text.length > 28
                      ? `${node.text.slice(0, 28)}…`
                      : node.text}
                  </text>
                ) : null}
                {isBlank ? (
                  <text
                    x={boxW / 2 + 8}
                    y={boxH / 2 + 5}
                    textAnchor="middle"
                    fontSize={12}
                    fill="#92400e"
                  >
                    ________
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="space-y-3">
        {nodes
          .filter((n) => n.kind === "blank")
          .map((node, index) => {
            const value = answers[node.id] ?? "";
            const overLimit =
              value.trim().length > 0 && !isWithinIeltsWordLimit(value, 2);
            const result = feedback?.[node.id];
            return (
              <div
                key={node.id}
                className={`rounded-lg border bg-white p-4 ${
                  result
                    ? result.correct
                      ? "border-green-300"
                      : "border-red-300"
                    : overLimit
                      ? "border-amber-300"
                      : "border-slate-200"
                }`}
              >
                <label className="block text-sm font-semibold text-[#0d1b35]">
                  {index + 1}.{" "}
                  <span className="font-normal text-slate-600">
                    Diagram label
                  </span>
                </label>
                <input
                  type="text"
                  value={value}
                  disabled={Boolean(feedback)}
                  onChange={(e) => onChange(node.id, e.target.value)}
                  placeholder="Max 2 words and/or a number"
                  className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50"
                />
                {overLimit && !feedback ? (
                  <p className="mt-1 text-xs font-semibold text-amber-700">
                    Use no more than two words and/or a number (
                    {countIeltsAnswerTokens(value)} tokens)
                  </p>
                ) : null}
                {result ? (
                  <p
                    className={`mt-2 text-xs font-semibold ${
                      result.correct ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    {result.correct
                      ? `Correct — ${result.correctAnswer}`
                      : `Incorrect — correct answer: ${result.correctAnswer}`}
                  </p>
                ) : null}
              </div>
            );
          })}
      </div>
    </div>
  );
}
