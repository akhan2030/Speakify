"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CEFR_SUB_LEVELS } from "@/lib/course/cefrLevels";

type Trend = "improving" | "declining" | "stable";

type BandCard = { current: number | null; trend: Trend };

type ProfileData = {
  student: {
    id: string;
    name: string;
    email: string;
    phone: string;
    cefrLevel: string;
    joinDateLabel: string;
    lastActiveLabel: string;
  };
  bands: {
    writing: BandCard;
    speaking: BandCard;
    reading: BandCard;
    listening: BandCard;
  };
  writingHistory: {
    id: number;
    taskType: string;
    bandOverall: number | null;
    dateLabel: string;
    bandTa: number | null;
    bandCc: number | null;
    bandLr: number | null;
    bandGra: number | null;
    essayText: string;
    evaluationText: string;
  }[];
  speakingHistory: {
    id: number;
    part: string;
    bandOverall: number | null;
    bandFc: number | null;
    bandLr: number | null;
    bandGra: number | null;
    bandP: number | null;
    dateLabel: string;
  }[];
  readingProgress: {
    questionType: string;
    accuracy: number;
    band: number | null;
  }[];
  listeningProgress: {
    section: number;
    label: string;
    accuracy: number | null;
    attempts: number;
  }[];
  vocabulary: {
    cefrLevel: string;
    wordsMastered: number;
    totalWords: number;
    percent: number;
    streak: number;
  };
  teacherNotes: string;
  bookingUrl: string;
};

function formatBand(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "—";
  return value.toFixed(1);
}

function formatQuestionType(slug: string) {
  return slug
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function TrendBadge({ trend }: { trend: Trend }) {
  const styles = {
    improving: "bg-green-100 text-green-800",
    declining: "bg-red-100 text-red-800",
    stable: "bg-slate-100 text-slate-600",
  };
  const labels = {
    improving: "↑ Improving",
    declining: "↓ Declining",
    stable: "→ Stable",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${styles[trend]}`}
    >
      {labels[trend]}
    </span>
  );
}

function BandOverviewCard({
  label,
  band,
  trend,
}: {
  label: string;
  band: BandCard;
  trend: Trend;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </p>
        <TrendBadge trend={trend} />
      </div>
      <p className="mt-2 text-3xl font-bold text-[#0d1b35]">
        {formatBand(band.current)}
      </p>
    </div>
  );
}

export default function TeacherStudentProfilePage() {
  const params = useParams();
  const studentId = String(params?.id ?? "");
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  const [savingLevel, setSavingLevel] = useState(false);
  const [levelSaved, setLevelSaved] = useState(false);
  const [essayModal, setEssayModal] = useState<ProfileData["writingHistory"][0] | null>(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/teacher/student/${studentId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      setProfile(json);
      setNotes(json.teacherNotes ?? "");
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    if (!studentId) return;
    loadProfile();
  }, [studentId, loadProfile]);

  const saveNotes = async () => {
    setSavingNotes(true);
    setNotesSaved(false);
    try {
      const res = await fetch(`/api/teacher/student/${studentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) throw new Error("Save failed");
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 3000);
    } finally {
      setSavingNotes(false);
    }
  };

  const updateCefrLevel = async (cefrLevel: string) => {
    if (!profile || cefrLevel === profile.student.cefrLevel) return;
    setSavingLevel(true);
    setLevelSaved(false);
    try {
      const res = await fetch(`/api/teacher/student/${studentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cefrLevel }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to update level");
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              student: { ...prev.student, cefrLevel },
              vocabulary: { ...prev.vocabulary, cefrLevel },
            }
          : null
      );
      setLevelSaved(true);
      setTimeout(() => setLevelSaved(false), 3000);
    } catch {
      /* keep previous level on failure */
    } finally {
      setSavingLevel(false);
    }
  };

  const whatsappHref = profile?.student.phone
    ? `https://wa.me/${profile.student.phone}?text=${encodeURIComponent(
        `Hello ${profile.student.name}, this is your Speakify IELTS teacher.`
      )}`
    : null;

  return (
    <>
        <div className="mx-auto max-w-5xl px-6 py-8">
          <Link
            href="/dashboard/teacher/students"
            className="text-sm font-medium text-[#0d9488] hover:underline"
          >
            ← Back to students
          </Link>

          {loading ? (
            <p className="mt-8 text-slate-500">Loading student profile…</p>
          ) : !profile ? (
            <p className="mt-8 text-slate-500">Student not found.</p>
          ) : (
            <>
              <header className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-[#0d1b35]">
                      {profile.student.name}
                    </h1>
                    <p className="mt-1 text-sm text-slate-600">
                      {profile.student.email}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                      <label className="flex flex-col gap-1">
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          CEFR level
                        </span>
                        <div className="flex items-center gap-2">
                          <select
                            value={profile.student.cefrLevel}
                            disabled={savingLevel}
                            onChange={(e) => void updateCefrLevel(e.target.value)}
                            className="rounded-lg border border-[#c9972c]/40 bg-[#c9972c]/10 px-3 py-1.5 text-sm font-semibold text-[#8a6918] disabled:opacity-60"
                          >
                            {CEFR_SUB_LEVELS.map((level) => (
                              <option key={level.code} value={level.code}>
                                {level.code} — {level.name}
                              </option>
                            ))}
                          </select>
                          {savingLevel ? (
                            <span className="text-xs text-slate-500">Saving…</span>
                          ) : levelSaved ? (
                            <span className="text-xs font-medium text-[#0d9488]">
                              Level updated
                            </span>
                          ) : null}
                        </div>
                      </label>
                      <span className="self-end pb-1">Joined {profile.student.joinDateLabel}</span>
                      <span className="self-end pb-1">
                        Last active {profile.student.lastActiveLabel}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href="/dashboard/teacher/homework"
                      className="rounded-lg bg-[#0d1b35] px-4 py-2 text-sm font-bold text-white hover:bg-[#152a4d]"
                    >
                      Assign Homework
                    </Link>
                    {whatsappHref ? (
                      <a
                        href={whatsappHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-[#0d9488] bg-white px-4 py-2 text-sm font-bold text-[#0d9488] hover:bg-[#0d9488]/10"
                      >
                        Send Message
                      </a>
                    ) : (
                      <span
                        className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-400"
                        title="Add phone number to user record"
                      >
                        Send Message
                      </span>
                    )}
                    <a
                      href={profile.bookingUrl}
                      className="rounded-lg bg-[#c9972c] px-4 py-2 text-sm font-bold text-[#0d1b35] hover:bg-[#b8862b]"
                    >
                      Book Consultation
                    </a>
                  </div>
                </div>
              </header>

              <section className="mt-8">
                <h2 className="text-lg font-bold text-[#0d1b35]">Band score overview</h2>
                <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
                  <BandOverviewCard
                    label="Writing"
                    band={profile.bands.writing}
                    trend={profile.bands.writing.trend}
                  />
                  <BandOverviewCard
                    label="Speaking"
                    band={profile.bands.speaking}
                    trend={profile.bands.speaking.trend}
                  />
                  <BandOverviewCard
                    label="Reading"
                    band={profile.bands.reading}
                    trend={profile.bands.reading.trend}
                  />
                  <BandOverviewCard
                    label="Listening"
                    band={profile.bands.listening}
                    trend={profile.bands.listening.trend}
                  />
                </div>
              </section>

              <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-[#0d1b35]">Writing history</h2>
                {profile.writingHistory.length === 0 ? (
                  <p className="mt-4 text-sm text-slate-500">
                    No saved essays yet. Run{" "}
                    <code className="text-xs">supabase/writing_attempts_setup.sql</code> and
                    save attempts from the writing module.
                  </p>
                ) : (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[640px] text-left text-sm">
                      <thead>
                        <tr className="border-b text-xs uppercase text-slate-500">
                          <th className="py-2 pr-4">Task</th>
                          <th className="py-2 pr-4">Band</th>
                          <th className="py-2 pr-4">TA / CC / LR / GRA</th>
                          <th className="py-2 pr-4">Date</th>
                          <th className="py-2" />
                        </tr>
                      </thead>
                      <tbody>
                        {profile.writingHistory.map((row) => (
                          <tr key={row.id} className="border-b border-slate-100">
                            <td className="py-3 font-medium text-[#0d1b35]">
                              {row.taskType}
                            </td>
                            <td className="py-3 font-bold text-[#c9972c]">
                              {formatBand(row.bandOverall)}
                            </td>
                            <td className="py-3 text-slate-600">
                              {formatBand(row.bandTa)} / {formatBand(row.bandCc)} /{" "}
                              {formatBand(row.bandLr)} / {formatBand(row.bandGra)}
                            </td>
                            <td className="py-3 text-slate-600">{row.dateLabel}</td>
                            <td className="py-3">
                              <button
                                type="button"
                                onClick={() => setEssayModal(row)}
                                className="text-sm font-semibold text-[#0d9488] hover:underline"
                              >
                                View Essay
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-[#0d1b35]">Speaking history</h2>
                {profile.speakingHistory.length === 0 ? (
                  <p className="mt-4 text-sm text-slate-500">No speaking attempts yet.</p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {profile.speakingHistory.map((row) => (
                      <div
                        key={row.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3"
                      >
                        <div>
                          <p className="font-semibold text-[#0d1b35]">
                            {row.part} · Band {formatBand(row.bandOverall)}
                          </p>
                          <p className="mt-1 text-xs text-slate-600">
                            FC {formatBand(row.bandFc)} · LR {formatBand(row.bandLr)} ·
                            GRA {formatBand(row.bandGra)} · P {formatBand(row.bandP)}
                          </p>
                        </div>
                        <span className="text-sm text-slate-500">{row.dateLabel}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-[#0d1b35]">Reading progress</h2>
                {profile.readingProgress.length === 0 ? (
                  <p className="mt-4 text-sm text-slate-500">No reading practice data yet.</p>
                ) : (
                  <div className="mt-6 space-y-4">
                    {profile.readingProgress.map((row) => (
                      <div key={row.questionType}>
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-[#0d1b35]">
                            {formatQuestionType(row.questionType)}
                          </span>
                          <span className="text-slate-600">
                            {row.accuracy}% · Band {formatBand(row.band)}
                          </span>
                        </div>
                        <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-[#0d9488] transition-all"
                            style={{
                              width: `${Math.min(100, Math.max(0, row.accuracy))}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-[#0d1b35]">Listening progress</h2>
                <div className="mt-6 space-y-4">
                  {profile.listeningProgress.map((row) => (
                    <div key={row.section}>
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-[#0d1b35]">{row.label}</span>
                        <span className="text-slate-600">
                          {row.accuracy != null
                            ? `${row.accuracy}%`
                            : "—"}{" "}
                          · {row.attempts} attempt{row.attempts === 1 ? "" : "s"}
                        </span>
                      </div>
                      <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-[#c9972c] transition-all"
                          style={{
                            width: `${row.accuracy != null ? Math.min(100, row.accuracy) : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="mt-8 rounded-xl border border-[#0d9488]/30 bg-[#0d9488]/5 p-6">
                <h2 className="text-lg font-bold text-[#0d1b35]">Vocabulary progress</h2>
                <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div>
                    <p className="text-xs uppercase text-slate-500">CEFR level</p>
                    <p className="mt-1 text-xl font-bold text-[#0d1b35]">
                      {profile.vocabulary.cefrLevel}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-slate-500">Words mastered</p>
                    <p className="mt-1 text-xl font-bold text-[#0d1b35]">
                      {profile.vocabulary.wordsMastered}
                      <span className="text-sm font-normal text-slate-500">
                        {" "}
                        / {profile.vocabulary.totalWords}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-slate-500">Progress</p>
                    <p className="mt-1 text-xl font-bold text-[#0d9488]">
                      {profile.vocabulary.percent}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-slate-500">Streak</p>
                    <p className="mt-1 text-xl font-bold text-[#c9972c]">
                      {profile.vocabulary.streak} days
                    </p>
                  </div>
                </div>
              </section>

              <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-[#0d1b35]">Teacher notes</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Private notes — only visible to teachers
                </p>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={5}
                  className="mt-4 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm text-[#0d1b35] focus:border-[#c9972c] focus:outline-none focus:ring-1 focus:ring-[#c9972c]"
                  placeholder="Observations, goals, parent contact notes…"
                />
                <div className="mt-3 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={saveNotes}
                    disabled={savingNotes}
                    className="rounded-lg bg-[#0d1b35] px-4 py-2 text-sm font-bold text-white hover:bg-[#152a4d] disabled:opacity-50"
                  >
                    {savingNotes ? "Saving…" : "Save notes"}
                  </button>
                  {notesSaved ? (
                    <span className="text-sm font-medium text-[#0d9488]">Saved ✓</span>
                  ) : null}
                </div>
              </section>
            </>
          )}
        </div>

      {essayModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-lg font-bold text-[#0d1b35]">
                {essayModal.taskType} · Band {formatBand(essayModal.bandOverall)}
              </h3>
              <button
                type="button"
                onClick={() => setEssayModal(null)}
                className="text-slate-500 hover:text-[#0d1b35]"
              >
                ✕
              </button>
            </div>
            <p className="mt-1 text-sm text-slate-500">{essayModal.dateLabel}</p>
            <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm leading-relaxed text-slate-800 whitespace-pre-wrap">
              {essayModal.essayText || "No essay text stored."}
            </div>
            {essayModal.evaluationText ? (
              <>
                <h4 className="mt-4 text-sm font-bold text-[#0d1b35]">Evaluation</h4>
                <div className="mt-2 rounded-lg border border-slate-200 p-4 text-sm text-slate-700 whitespace-pre-wrap">
                  {essayModal.evaluationText}
                </div>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
