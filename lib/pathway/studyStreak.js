/**
 * Update vocab_streaks when a student completes any pathway lesson day.
 */
export async function updateStudyStreak(supabase, studentId) {
  const today = new Date().toISOString().slice(0, 10);

  const { data: existing } = await supabase
    .from("vocab_streaks")
    .select("current_streak, longest_streak, last_study_date")
    .eq("student_id", studentId)
    .maybeSingle();

  let current = 1;
  let longest = 1;

  if (existing?.last_study_date) {
    const last = String(existing.last_study_date).slice(0, 10);
    if (last === today) {
      current = existing.current_streak ?? 1;
      longest = existing.longest_streak ?? 1;
    } else {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);
      current = last === yesterdayStr ? (existing.current_streak ?? 0) + 1 : 1;
      longest = Math.max(existing.longest_streak ?? 0, current);
    }
  }

  await supabase.from("vocab_streaks").upsert(
    {
      student_id: studentId,
      current_streak: current,
      longest_streak: longest,
      last_study_date: today,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "student_id" }
  );

  return { current, longest };
}
