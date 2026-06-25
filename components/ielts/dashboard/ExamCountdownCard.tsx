"use client";

type ExamData = {
  daysRemaining: number | null;
  examDateLabel: string | null;
  achievable: boolean;
  onTrackLabel: string;
};

export default function ExamCountdownCard({
  exam,
  examDateInput,
  savingExam,
  showEditForm,
  onDateChange,
  onSave,
  onEditDate,
}: {
  exam: ExamData;
  examDateInput: string;
  savingExam: boolean;
  showEditForm: boolean;
  onDateChange: (value: string) => void;
  onSave: () => void;
  onEditDate: () => void;
}) {
  if (exam.daysRemaining != null && !showEditForm) {
    return (
      <div className="rounded-xl bg-[#071525] p-5 text-center text-white">
        <p className="text-[11px] tracking-[0.2em] text-[#8BAAC8]">
          IELTS EXAM COUNTDOWN
        </p>
        <p className="mt-1 text-5xl font-medium text-[#C8923E]">{exam.daysRemaining}</p>
        <p className="text-sm text-[#8BAAC8]">days remaining</p>
        {exam.examDateLabel ? (
          <p className="mt-2 text-xs text-[#8BAAC8]">{exam.examDateLabel}</p>
        ) : null}
        <p
          className={`mt-2 text-xs ${exam.achievable ? "text-[#0d9488]" : "text-amber-400"}`}
        >
          {exam.onTrackLabel}
        </p>
        <button
          type="button"
          onClick={onEditDate}
          className="mt-3 rounded-md border border-[#8BAAC8]/60 px-3 py-1 text-xs text-[#8BAAC8] hover:bg-white/5"
        >
          Change date
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-[#071525] p-5 text-center">
      <p className="text-sm text-[#8BAAC8]">When is your IELTS exam?</p>
      <input
        type="date"
        value={examDateInput}
        onChange={(e) => onDateChange(e.target.value)}
        className="mt-3 w-full rounded-lg border border-[#8BAAC8]/30 bg-[#0a1f35] px-3 py-2 text-sm text-white"
      />
      <button
        type="button"
        onClick={onSave}
        disabled={!examDateInput || savingExam}
        className="mt-3 w-full rounded-lg bg-[#0d9488] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
      >
        {savingExam ? "Saving…" : "Set exam date →"}
      </button>
      <p className="mt-3 text-[11px] text-slate-500">
        Setting your date helps Speakify plan your study pace
      </p>
    </div>
  );
}
