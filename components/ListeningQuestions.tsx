"use client";

export type ListeningQuestion = {
  id: number;
  questionNumber: number;
  type: string;
  text: string;
  options?: { label: string; text: string }[];
  chooseCount?: number;
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
};

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

/** IELTS answer sheet — label and input stay visually paired (no stretched 1fr gap). */
const ANSWER_SHEET_CONTAINER =
  "mx-auto w-full max-w-3xl rounded-xl border border-slate-200 bg-white p-4 sm:p-5";

const ANSWER_ROW =
  "grid grid-cols-1 gap-2 py-3 sm:grid-cols-[minmax(0,20rem)_12.5rem] sm:items-start sm:gap-x-5 md:grid-cols-[minmax(0,22rem)_14rem] md:gap-x-6";

const ANSWER_ROW_MATCHING =
  "grid grid-cols-1 gap-2 py-3 sm:grid-cols-[minmax(0,20rem)_10rem] sm:items-center sm:gap-x-5 md:grid-cols-[minmax(0,22rem)_11rem] md:gap-x-6";

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
  } = props;
  return (
    <div className={`${ANSWER_SHEET_CONTAINER} divide-y divide-slate-100`}>
      {questions.map((q, i) => {
        const result = results?.[i];
        return (
          <div
            key={q.id}
            className={answeredWrapClass(q.id, props, ANSWER_ROW)}
          >
            <label className="text-sm font-medium leading-snug text-[#0d1b35]">
              <span className="font-bold">{q.questionNumber}.</span> {q.text}
            </label>
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
    <div className="space-y-4">
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
            className={`rounded-xl border bg-white p-4 shadow-sm ${
              rawSelected ? "border-[#c9972c]" : "border-slate-200"
            } ${showResults && result?.correct ? "border-green-400 bg-green-50/30" : ""} ${
              showResults && result && !result.correct ? "border-red-400 bg-red-50/30" : ""
            } ${answeredWrapClass(q.id, props)}`}
          >
            <p className="font-bold text-[#0d1b35]">
              {q.questionNumber}. {q.text}
            </p>
            {isMultiSelect ? (
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Select {chooseCount} answers
              </p>
            ) : null}
            <div className="mt-3 space-y-2">
              {options.map((opt) => {
                const letter = String(opt.label ?? "").trim().toUpperCase();
                const optionText = displayOptionText(opt.text);
                const isSelected = selectedLetters.has(letter);
                return (
                  <label
                    key={`${q.id}-${letter || optionText}`}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm ${
                      isSelected
                        ? "border-[#c9972c] bg-[#c9972c]/10"
                        : "border-slate-200"
                    } ${disabled ? "pointer-events-none opacity-60" : ""}`}
                  >
                    <input
                      type={isMultiSelect ? "checkbox" : "radio"}
                      name={isMultiSelect ? undefined : `q-${q.id}`}
                      value={letter}
                      checked={isSelected}
                      disabled={disabled}
                      onChange={() =>
                        isMultiSelect
                          ? toggleMulti(letter)
                          : onChange(q.id, letter)
                      }
                      className="accent-[#c9972c]"
                    />
                    <span>
                      {letter ? (
                        <>
                          <strong>{letter}.</strong> {optionText}
                        </>
                      ) : (
                        optionText
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
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
  const optionLetters = ["A", "B", "C", "D", "E", "F", "G", "H"];
  return (
    <div className={`${ANSWER_SHEET_CONTAINER} divide-y divide-slate-100`}>
      {questions.map((q, i) => {
        const result = results?.[i];
        return (
          <div
            key={q.id}
            className={`rounded-lg border border-slate-200 bg-white px-4 ${
              showResults && result?.correct ? "border-green-400 bg-green-50/40" : ""
            } ${showResults && result && !result.correct ? "border-red-400 bg-red-50/40" : ""} ${answeredWrapClass(q.id, props, ANSWER_ROW_MATCHING)}`}
          >
            <span className="text-sm leading-snug text-slate-700">
              {q.questionNumber}. {q.text}
            </span>
            <select
              value={answers[q.id] ?? ""}
              disabled={disabled}
              onChange={(e) => onChange(q.id, e.target.value)}
              className={`w-full min-w-0 ${inputClass(
                disabled,
                !!(showResults && result?.correct),
                !!(showResults && result && !result.correct)
              )}`}
            >
              <option value="">Select…</option>
              {(q.options?.length ? q.options.map((o) => o.label) : optionLetters).map(
                (letter) => (
                  <option key={letter} value={letter}>
                    {letter}
                  </option>
                )
              )}
            </select>
          </div>
        );
      })}
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
  } = props;
  return (
    <div className={`${ANSWER_SHEET_CONTAINER} space-y-4 bg-slate-50`}>
      {questions.map((q, i) => {
        const result = results?.[i];
        const parts = q.text.split(/(\[_{3,}\]|_{3,}|\[\s*\])/);
        let gapIndex = 0;
        return (
          <div
            key={q.id}
            className={`text-sm leading-loose text-slate-700 ${
              showResults && result?.correct ? "rounded-lg bg-green-50/60 p-2" : ""
            } ${showResults && result && !result.correct ? "rounded-lg bg-red-50/60 p-2" : ""} ${answeredWrapClass(q.id, props)}`}
          >
            <span className="mr-2 font-bold text-[#0d1b35]">{q.questionNumber}.</span>
            {parts.map((part, idx) => {
              const isGap = /\[_{3,}\]|_{3,}|\[\s*\]/.test(part);
              if (!isGap) {
                return <span key={idx}>{part}</span>;
              }
              gapIndex += 1;
              const gapId = `${q.id}-${gapIndex}`;
              return (
                <input
                  key={idx}
                  type="text"
                  value={answers[gapId] ?? answers[q.id] ?? ""}
                  disabled={disabled}
                  onChange={(e) =>
                    onChange(gapIndex === 1 ? q.id : gapId, e.target.value)
                  }
                  className={`mx-1 inline-block w-28 ${inputClass(
                    disabled,
                    !!(showResults && result?.correct),
                    !!(showResults && result && !result.correct)
                  )}`}
                />
              );
            })}
            {!/\[_{3,}\]|_{3,}|\[\s*\]/.test(q.text) ? (
              <input
                type="text"
                value={answers[q.id] ?? ""}
                disabled={disabled}
                onChange={(e) => onChange(q.id, e.target.value)}
                className={`mt-1 w-full max-w-xs ${inputClass(
                  disabled,
                  !!(showResults && result?.correct),
                  !!(showResults && result && !result.correct)
                )}`}
              />
            ) : null}
          </div>
        );
      })}
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
  } = props;
  const headers =
    questions[0]?.tableHeaders ??
    ["Item", "Detail", "Notes"];
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full min-w-[480px] text-sm">
        <thead>
          <tr className="bg-slate-50">
            {headers.map((h) => (
              <th key={h} className="border-b border-slate-200 px-4 py-3 text-left font-semibold text-[#0d1b35]">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {questions.map((q, i) => {
            const result = results?.[i];
            return (
              <tr
                key={q.id}
                className={`border-b border-slate-100 ${answeredWrapClass(q.id, props)}`}
              >
                <td className="px-4 py-3 text-slate-600">{q.questionNumber}. {q.text}</td>
                <td className="px-4 py-3" colSpan={Math.max(1, headers.length - 1)}>
                  <input
                    type="text"
                    value={answers[q.id] ?? ""}
                    disabled={disabled}
                    onChange={(e) => onChange(q.id, e.target.value)}
                    className={`w-full ${inputClass(
                      disabled,
                      !!(showResults && result?.correct),
                      !!(showResults && result && !result.correct)
                    )} border-[#c9972c]/50`}
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
        return (
          <div
            key={q.id}
            className={`flex w-full max-w-md flex-col items-center ${answeredWrapClass(q.id, props)}`}
          >
            <div
              className={`w-full rounded-lg border-2 px-4 py-3 text-center text-sm ${
                showResults && result?.correct
                  ? "border-green-400 bg-green-50"
                  : showResults && result && !result.correct
                    ? "border-red-400 bg-red-50"
                    : "border-[#0d1b35] bg-white"
              }`}
            >
              <p className="mb-2 text-left text-sm font-bold text-[#0d1b35]">
                {q.questionNumber}.
              </p>
              {q.text && !q.text.includes("___") ? (
                <p className="text-slate-700">{q.text}</p>
              ) : (
                <input
                  type="text"
                  value={answers[q.id] ?? ""}
                  disabled={disabled}
                  onChange={(e) => onChange(q.id, e.target.value)}
                  className={`w-full ${inputClass(
                    disabled,
                    !!(showResults && result?.correct),
                    !!(showResults && result && !result.correct)
                  )}`}
                />
              )}
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
              {q.questionNumber}. {q.text}
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
