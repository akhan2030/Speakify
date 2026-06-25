"use client";

type StickySubmitBarProps = {
  answeredCount: number;
  totalQuestions: number;
  onSubmit: () => void;
  submitting?: boolean;
  label?: string;
  /** Offset for fixed sidebar (IELTS student layout = 200px) */
  offsetSidebar?: boolean;
};

export default function StickySubmitBar({
  answeredCount,
  totalQuestions,
  onSubmit,
  submitting = false,
  label = "Submit Answers",
  offsetSidebar = false,
}: StickySubmitBarProps) {
  const allAnswered = totalQuestions > 0 && answeredCount >= totalQuestions;
  const canSubmit = allAnswered && !submitting;

  return (
    <>
      <div
        className={`fixed bottom-0 z-50 flex items-center justify-between border-t border-gray-200 bg-white px-6 py-4 shadow-lg ${
          offsetSidebar ? "left-0 right-0 sm:left-[200px]" : "left-0 right-0"
        }`}
      >
        <span className="text-sm text-gray-500">
          {answeredCount < totalQuestions
            ? `Complete all questions to submit — ${answeredCount}/${totalQuestions} answered`
            : `All ${totalQuestions} questions answered ✓`}
        </span>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          className={`rounded-lg px-8 py-3 text-sm font-bold transition-all ${
            canSubmit
              ? "cursor-pointer bg-[#c9972c] text-white hover:bg-yellow-600"
              : "cursor-not-allowed bg-gray-200 text-gray-400"
          }`}
        >
          {submitting ? "Submitting…" : label}
        </button>
      </div>
      <div className="pb-24" aria-hidden />
    </>
  );
}
