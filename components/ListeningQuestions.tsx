"use client";

import {
  ExamHighlightQuestionText,
  HighlightableInlineText,
  HighlightableMcqOption,
} from "@/components/exam/ExamHighlightSection";

export type ListeningQuestion = {
  id: number;
  questionNumber: number;
  type: string;
  text: string;
  options?: { label: string; text: string }[];
  chooseCount?: number;
  eitherOrderGroup?: string;
  answer?: string;
  wordLimit?: string;
  explanation?: string;
  tableHeaders?: string[];
  tableRows?: Array<Array<string | { input: boolean; id?: number }>>;
  flowSteps?: Array<{ label: string; isInput?: boolean }>;
};

export type QuestionResult = {
  correct: boolean;
  studentAnswer: string;
  correctAnswer: string;
  category?: string;
  acceptedVariants?: string[];
  feedback?: {
    whyIncorrect?: string;
    correctAnswer?: string;
    explanation?: string;
    coachingNote?: string;
    lossReason?: string;
    skillTested?: string;
    commonTrap?: string;
    studyTip?: string;
    transcriptEvidence?: string | null;
  } | null;
};

export type ListeningQuestionsProps = {
  questions: ListeningQuestion[];
  answers: Record<string | number, string>;
  onChange: (questionId: number | string, value: string) => void;
  disabled?: boolean;
  questionType: string;
  showResults?: boolean;
  results?: QuestionResult[];
  /** Highlight answered questions with a green left border during playback */
  highlightAnswered?: boolean;
  answeredIds?: Set<number | string>;
  /** Dark header bar title (form / table / notes) — official paper style */
  groupTitle?: string;
};

function QuestionPromptText({
  q,
  className = "",
}: {
  q: ListeningQuestion;
  className?: string;
}) {
  return (
    <ExamHighlightQuestionText
      blockId={`lq-${q.id}`}
      number={q.questionNumber}
      text={q.text}
      className={className}
    />
  );
}

function answeredWrapClass(
  qId: number | string,
  props: ListeningQuestionsProps,
  extra = ""
) {
  const answered =
    props.highlightAnswered &&
    props.answeredIds?.has(qId) &&
    String(props.answers[qId] ?? "").trim() !== "";
  return answered ? `border-l-4 border-green-500 pl-3 ${extra}`.trim() : extra;
}

function normalizeType(type: string) {
  return String(type ?? "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-");
}

function inputClass(disabled: boolean, showCorrect?: boolean, showWrong?: boolean) {
  const base =
    "rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:ring-2 focus:ring-[#c9972c]/40";
  if (showCorrect) return `${base} border-green-400 bg-green-50 text-green-900`;
  if (showWrong) return `${base} border-red-400 bg-red-50 text-red-900`;
  if (disabled) return `${base} cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500`;
  return `${base} border-slate-300 bg-white text-[#0d1b35]`;
}

function WordLimitHint({ limit }: { limit?: string }) {
  if (!limit) return null;
  return <p className="mt-1 text-xs text-slate-500">{limit}</p>;
}

/** Official IELTS paper palette (British Council reference). */
const OFFICIAL_HEADER = "bg-[#3d3d3d] px-4 py-2.5 text-sm font-bold text-white";
const OFFICIAL_PANEL =
  "overflow-hidden rounded-lg border border-slate-300 bg-white";
const OFFICIAL_ROW_ODD = "bg-[#f0f0f0]";
const OFFICIAL_ROW_EVEN = "bg-white";
const OFFICIAL_QUESTIONS_BOX =
  "overflow-hidden rounded-lg border border-slate-300 bg-[#f0f0f0]";

const INLINE_INPUT =
  "mx-1 inline-block min-w-[7rem] border-0 border-b-2 border-dotted border-slate-500 bg-transparent px-1 py-0.5 text-sm text-[#1a1a1a] outline-none focus:border-[#c9972c] focus:ring-0 disabled:text-slate-500";

const ANSWER_SHEET_CONTAINER = `${OFFICIAL_PANEL}`;

const ANSWER_ROW =
  "grid grid-cols-1 gap-2 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_11rem] sm:items-center sm:gap-x-4";

const ANSWER_ROW_MATCHING =
  "grid grid-cols-1 gap-2 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_5rem] sm:items-center sm:gap-x-4";

function TextInput({
  q,
  value,
  onChange,
  disabled,
  showResults,
  result,
}: {
  q: ListeningQuestion;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  showResults?: boolean;
  result?: QuestionResult;
}) {
  return (
    <div>
      <input
        type="text"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass(
          disabled,
          !!(showResults && result?.correct),
          !!(showResults && result && !result.correct)
        )}
      />
      <WordLimitHint limit={q.wordLimit} />
    </div>
  );
}

function FormCompletionQuestions(props: ListeningQuestionsProps) {
  const {
    questions,
    answers,
    onChange,
    disabled = false,
    showResults,
    results,
    groupTitle,
  } = props;
  return (
    <div className={ANSWER_SHEET_CONTAINER}>
      {groupTitle ? (
        <div className={`${OFFICIAL_HEADER} text-center`}>{groupTitle}</div>
      ) : null}
      <div className="divide-y divide-white">
        {questions.map((q, i) => {
          const result = results?.[i];
          const rowBg = i % 2 === 0 ? OFFICIAL_ROW_ODD : OFFICIAL_ROW_EVEN;
          return (
            <div
              key={q.id}
              className={`${rowBg} px-4 py-3 text-sm leading-relaxed text-[#1a1a1a] ${answeredWrapClass(q.id, props)}`}
            >
              <span>{q.text.replace(/:\s*$/, "")}</span>{" "}
              <strong className="text-[#1a1a1a]">({q.questionNumber})</strong>
              <input
                type="text"
                value={answers[q.id] ?? ""}
                disabled={disabled}
                onChange={(e) => onChange(q.id, e.target.value)}
                className={`${INLINE_INPUT} ${
                  showResults && result?.correct
                    ? "border-green-500 text-green-800"
                    : showResults && result && !result.correct
                      ? "border-red-500 text-red-800"
                      : ""
                }`}
                aria-label={`Answer for question ${q.questionNumber}`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function displayOptionText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value).trim();
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of ["text", "label", "value", "content", "option", "choice"]) {
      const nested = displayOptionText(record[key]);
      if (nested && nested !== "[object Object]") return nested;
    }
  }
  const direct = String(value).trim();
  return direct === "[object Object]" ? "" : direct;
}

function parseSelectedLetters(value: string): Set<string> {
  return new Set(
    String(value ?? "")
      .split(/[,;\s]+/)
      .map((part) => part.trim().toUpperCase())
      .filter(Boolean)
  );
}

function formatSelectedLetters(selected: Set<string>): string {
  return [...selected].sort().join(",");
}

function MultipleChoiceQuestions(props: ListeningQuestionsProps) {
  const {
    questions,
    answers,
    onChange,
    disabled = false,
    showResults,
    results,
  } = props;
  return (
    <div className={OFFICIAL_QUESTIONS_BOX}>
      <div className={OFFICIAL_HEADER}>Questions</div>
      <div className="divide-y divide-white">
        {questions.map((q, i) => {
          const result = results?.[i];
          const chooseCount = Math.max(1, Number(q.chooseCount ?? 1));
          const isMultiSelect = chooseCount > 1;
          const rawSelected = answers[q.id] ?? "";
          const selectedLetters = isMultiSelect
            ? parseSelectedLetters(rawSelected)
            : new Set(rawSelected ? [rawSelected.toUpperCase()] : []);
          const options = q.options ?? [];

          const toggleMulti = (letter: string) => {
            const next = new Set(selectedLetters);
            if (next.has(letter)) {
              next.delete(letter);
            } else if (next.size < chooseCount) {
              next.add(letter);
            }
            onChange(q.id, formatSelectedLetters(next));
          };

          return (
            <div
              key={q.id}
              className={`px-4 py-4 ${
                showResults && result?.correct ? "bg-green-50/50" : ""
              } ${showResults && result && !result.correct ? "bg-red-50/50" : ""} ${answeredWrapClass(q.id, props)}`}
            >
              <p className="font-bold text-[#1a1a1a]">
                <QuestionPromptText q={q} />
              </p>
              {isMultiSelect ? (
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Select {chooseCount} answers
                </p>
              ) : null}
              <div className="mt-2 space-y-1.5 pl-1">
                {options.map((opt) => {
                  const letter = String(opt.label ?? "").trim().toUpperCase();
                  const optionText = displayOptionText(opt.text);
                  const isSelected = selectedLetters.has(letter);
                  return (
                    <HighlightableMcqOption
                      key={`${q.id}-${letter || optionText}`}
                      blockId={`lq-${q.id}-opt-${letter || optionText.slice(0, 24)}`}
                      letter={letter || "?"}
                      text={optionText}
                      name={`q-${q.id}`}
                      checked={isSelected}
                      disabled={disabled}
                      multiSelect={isMultiSelect}
                      onSelect={() =>
                        isMultiSelect ? toggleMulti(letter) : onChange(q.id, letter)
                      }
                      className={
                        isSelected
                          ? "border-[#c9972c] bg-white"
                          : "border-transparent bg-transparent"
                      }
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MatchingQuestions(props: ListeningQuestionsProps) {
  const {
    questions,
    answers,
    onChange,
    disabled = false,
    showResults,
    results,
  } = props;

  const boxOptions =
    questions.find((q) => (q.options?.length ?? 0) >= 2)?.options ?? [];

  return (
    <div className="space-y-4">
      {boxOptions.length > 0 ? (
        <div className={OFFICIAL_PANEL}>
          <table className="w-full text-sm">
            <tbody>
              {boxOptions.map((opt, idx) => (
                <tr
                  key={opt.label}
                  className={idx % 2 === 0 ? OFFICIAL_ROW_ODD : OFFICIAL_ROW_EVEN}
                >
                  <td className="w-12 px-4 py-2 font-bold text-[#1a1a1a]">
                    {opt.label}
                  </td>
                  <td className="px-4 py-2 text-[#1a1a1a]">{opt.text}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <div className={OFFICIAL_QUESTIONS_BOX}>
        <div className={`${OFFICIAL_HEADER} text-red-600`}>Questions</div>
        <div className="divide-y divide-white">
          {questions.map((q, i) => {
            const result = results?.[i];
            return (
              <div
                key={q.id}
                className={`px-4 py-3 text-sm ${
                  showResults && result?.correct ? "bg-green-50/50" : ""
                } ${showResults && result && !result.correct ? "bg-red-50/50" : ""} ${answeredWrapClass(q.id, props, ANSWER_ROW_MATCHING)}`}
              >
                <span className="leading-snug text-[#1a1a1a]">
                  <QuestionPromptText q={q} />
                </span>
                <input
                  type="text"
                  maxLength={1}
                  value={answers[q.id] ?? ""}
                  disabled={disabled}
                  onChange={(e) =>
                    onChange(q.id, e.target.value.toUpperCase().replace(/[^A-J]/g, ""))
                  }
                  className={`${INLINE_INPUT} w-12 min-w-[3rem] text-center uppercase ${
                    showResults && result?.correct
                      ? "border-green-500"
                      : showResults && result && !result.correct
                        ? "border-red-500"
                        : ""
                  }`}
                  aria-label={`Letter answer for question ${q.questionNumber}`}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function NoteStyleQuestions(props: ListeningQuestionsProps) {
  const {
    questions,
    answers,
    onChange,
    disabled = false,
    showResults,
    results,
    groupTitle,
  } = props;
  return (
    <div className={ANSWER_SHEET_CONTAINER}>
      {groupTitle ? (
        <div className={`${OFFICIAL_HEADER} text-center`}>{groupTitle}</div>
      ) : (
        <div className={OFFICIAL_HEADER}>Questions</div>
      )}
      <div className="divide-y divide-white">
        {questions.map((q, i) => {
          const result = results?.[i];
          const parts = q.text.split(/(\[_{3,}\]|_{3,}|\[\s*\])/);
          let gapIndex = 0;
          const rowBg = i % 2 === 0 ? OFFICIAL_ROW_ODD : OFFICIAL_ROW_EVEN;
          const hasInlineGap = /\[_{3,}\]|_{3,}|\[\s*\]/.test(q.text);
          return (
            <div
              key={q.id}
              className={`${rowBg} px-4 py-3 text-sm leading-relaxed text-[#1a1a1a] ${
                showResults && result?.correct ? "bg-green-50/60" : ""
              } ${showResults && result && !result.correct ? "bg-red-50/60" : ""} ${answeredWrapClass(q.id, props)}`}
            >
              {!hasInlineGap ? (
                <>
                  <span>{q.text.replace(/:\s*$/, "")}</span>{" "}
                  <strong>({q.questionNumber})</strong>
                  <input
                    type="text"
                    value={answers[q.id] ?? ""}
                    disabled={disabled}
                    onChange={(e) => onChange(q.id, e.target.value)}
                    className={`${INLINE_INPUT} ${
                      showResults && result?.correct
                        ? "border-green-500"
                        : showResults && result && !result.correct
                          ? "border-red-500"
                          : ""
                    }`}
                  />
                </>
              ) : (
                parts.map((part, idx) => {
                  const isGap = /\[_{3,}\]|_{3,}|\[\s*\]/.test(part);
                  if (!isGap) {
                    return (
                      <HighlightableInlineText
                        key={idx}
                        blockId={`lq-${q.id}-p-${idx}`}
                        text={part}
                      />
                    );
                  }
                  gapIndex += 1;
                  const gapId = `${q.id}-${gapIndex}`;
                  return (
                    <span key={idx}>
                      <strong>({q.questionNumber})</strong>
                      <input
                        type="text"
                        value={answers[gapId] ?? answers[q.id] ?? ""}
                        disabled={disabled}
                        onChange={(e) =>
                          onChange(gapIndex === 1 ? q.id : gapId, e.target.value)
                        }
                        className={`${INLINE_INPUT} ${
                          showResults && result?.correct
                            ? "border-green-500"
                            : showResults && result && !result.correct
                              ? "border-red-500"
                              : ""
                        }`}
                      />
                    </span>
                  );
                })
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TableCompletionQuestions(props: ListeningQuestionsProps) {
  const {
    questions,
    answers,
    onChange,
    disabled = false,
    showResults,
    results,
    groupTitle,
  } = props;
  const headers =
    questions[0]?.tableHeaders ??
    ["Item", "Detail"];
  return (
    <div className={`${OFFICIAL_PANEL} overflow-x-auto`}>
      {groupTitle ? (
        <div className={`${OFFICIAL_HEADER} text-center`}>{groupTitle}</div>
      ) : null}
      <table className="w-full min-w-[480px] text-sm">
        <thead>
          <tr className="bg-[#3d3d3d] text-white">
            {headers.map((h) => (
              <th key={h} className="px-4 py-2.5 text-left font-bold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {questions.map((q, i) => {
            const result = results?.[i];
            const rowBg = i % 2 === 0 ? OFFICIAL_ROW_ODD : OFFICIAL_ROW_EVEN;
            return (
              <tr
                key={q.id}
                className={`${rowBg} ${answeredWrapClass(q.id, props)}`}
              >
                <td className="px-4 py-3 text-[#1a1a1a]">
                  {q.text.replace(/:\s*$/, "")}
                </td>
                <td className="px-4 py-3" colSpan={Math.max(1, headers.length - 1)}>
                  <strong>({q.questionNumber})</strong>
                  <input
                    type="text"
                    value={answers[q.id] ?? ""}
                    disabled={disabled}
                    onChange={(e) => onChange(q.id, e.target.value)}
                    className={`${INLINE_INPUT} min-w-[10rem] ${
                      showResults && result?.correct
                        ? "border-green-500"
                        : showResults && result && !result.correct
                          ? "border-red-500"
                          : ""
                    }`}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function FlowchartQuestions(props: ListeningQuestionsProps) {
  const {
    questions,
    answers,
    onChange,
    disabled = false,
    showResults,
    results,
  } = props;
  return (
    <div className="flex flex-col items-center gap-2">
      {questions.map((q, i) => {
        const result = results?.[i];
        const raw = String(q.text ?? "").trim();
        // Never render a flowchart step as a closed question with no input
        const label = raw
          .replace(/_{2,}/g, "…")
          .replace(/\.{3,}|…/g, "…")
          .trim();
        return (
          <div
            key={q.id}
            className={`flex w-full max-w-md flex-col items-center ${answeredWrapClass(q.id, props)}`}
          >
            <div
              className={`w-full rounded-lg border-2 px-4 py-3 text-sm ${
                showResults && result?.correct
                  ? "border-green-400 bg-green-50"
                  : showResults && result && !result.correct
                    ? "border-red-400 bg-red-50"
                    : "border-[#0d1b35] bg-white"
              }`}
            >
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Step ({q.questionNumber})
              </p>
              {label ? (
                <p className="mb-2 text-left text-[#1a1a1a]">
                  <HighlightableInlineText blockId={`lq-${q.id}`} text={label} />
                </p>
              ) : null}
              <input
                type="text"
                value={answers[q.id] ?? ""}
                disabled={disabled}
                onChange={(e) => onChange(q.id, e.target.value)}
                placeholder="Write your answer…"
                aria-label={`Flow chart step ${q.questionNumber}`}
                className={`w-full ${inputClass(
                  disabled,
                  !!(showResults && result?.correct),
                  !!(showResults && result && !result.correct)
                )}`}
              />
            </div>
            {i < questions.length - 1 ? (
              <svg className="my-1 h-6 w-6 text-[#c9972c]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M12 5v14M7 13l5 5 5-5" />
              </svg>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function SentenceOrShortQuestions(props: ListeningQuestionsProps) {
  const {
    questions,
    answers,
    onChange,
    disabled = false,
    showResults,
    results,
  } = props;
  return (
    <div className={`${ANSWER_SHEET_CONTAINER} divide-y divide-slate-100`}>
      {questions.map((q, i) => {
        const result = results?.[i];
        return (
          <div
            key={q.id}
            className={`${
              showResults && result?.correct ? "bg-green-50/40" : ""
            } ${showResults && result && !result.correct ? "bg-red-50/40" : ""} ${answeredWrapClass(q.id, props, ANSWER_ROW)}`}
          >
            <p className="text-sm font-medium leading-snug text-[#0d1b35]">
              <QuestionPromptText q={q} />
            </p>
            <div className="w-full min-w-0 sm:max-w-[14rem]">
              <TextInput
                q={q}
                value={answers[q.id] ?? ""}
                onChange={(v) => onChange(q.id, v)}
                disabled={disabled}
                showResults={showResults}
                result={result}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ListeningQuestions(props: ListeningQuestionsProps) {
  const type = normalizeType(props.questionType);
  const perQuestionType = normalizeType(props.questions[0]?.type ?? type);

  const resolvedType = perQuestionType || type;

  switch (resolvedType) {
    case "form-completion":
      return <FormCompletionQuestions {...props} />;
    case "multiple-choice":
      return <MultipleChoiceQuestions {...props} />;
    case "matching":
    case "plan-map-diagram":
      return <MatchingQuestions {...props} />;
    case "table-completion":
      return <TableCompletionQuestions {...props} />;
    case "flowchart-completion":
      return <FlowchartQuestions {...props} />;
    case "diagram-labelling":
    case "summary-completion":
    case "note-completion":
      return <NoteStyleQuestions {...props} />;
    case "sentence-completion":
    case "short-answer":
      return <SentenceOrShortQuestions {...props} />;
    default:
      return <SentenceOrShortQuestions {...props} />;
  }
}
