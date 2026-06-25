const INACTIVE_DAYS = 3;

export function getTodayDateKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getTodayBounds() {
  const today = getTodayDateKey();
  return {
    today,
    start: `${today}T00:00:00.000Z`,
    end: `${today}T23:59:59.999Z`,
  };
}

function roundBand(value) {
  if (!Number.isFinite(value)) return null;
  return Math.round(value * 10) / 10;
}

function averageBand(values) {
  const nums = values.filter((v) => Number.isFinite(v));
  if (!nums.length) return null;
  return roundBand(nums.reduce((a, b) => a + b, 0) / nums.length);
}

function maxTimestamp(map, studentId, iso) {
  if (!studentId || !iso) return;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return;
  const prev = map.get(studentId);
  if (prev === undefined || t > prev) map.set(studentId, t);
}

function daysSince(ms) {
  if (!Number.isFinite(ms)) return null;
  return Math.floor((Date.now() - ms) / (1000 * 60 * 60 * 24));
}

function studentReadingBand(rows) {
  const bands = rows
    .map((r) => Number(r.estimated_band))
    .filter((v) => Number.isFinite(v));
  return averageBand(bands);
}

function studentListeningBand(rows) {
  const bands = rows
    .map((r) => Number(r.estimated_band))
    .filter((v) => Number.isFinite(v));
  return averageBand(bands);
}

function studentSpeakingBand(rows) {
  const bands = rows
    .map((r) => Number(r.band_overall))
    .filter((v) => Number.isFinite(v));
  return averageBand(bands);
}

function compositeBand(reading, listening, speaking, writing) {
  return averageBand(
    [reading, listening, speaking, writing].filter((v) => v !== null)
  );
}

export function emptyOverview() {
  return {
    totalStudents: 0,
    testsToday: 0,
    averageBandScore: null,
    inactiveStudents3PlusDays: 0,
  };
}

/**
 * Dashboard summary for teachers.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 */
export async function computeTeacherOverview(supabase) {
  const { start, end, today } = getTodayBounds();

  let students = [];
  const usersResult = await supabase
    .from("users")
    .select("id")
    .eq("role", "student");

  if (usersResult.error) throw usersResult.error;
  students = usersResult.data ?? [];

  const studentIds = students.map((s) => s.id).filter(Boolean);
  if (!studentIds.length) return emptyOverview();

  const [
    readingTrackers,
    listeningTrackers,
    speakingTrackers,
    readingToday,
    listeningToday,
    speakingToday,
    dailyLimitsToday,
    readingRecent,
    listeningRecent,
    speakingRecent,
    vocabRecent,
    dailyLimitsAll,
  ] = await Promise.all([
    supabase
      .from("reading_tracker")
      .select("student_id, estimated_band, updated_at")
      .in("student_id", studentIds),
    supabase
      .from("listening_tracker")
      .select("student_id, estimated_band, updated_at")
      .in("student_id", studentIds),
    supabase
      .from("speaking_tracker")
      .select("student_id, band_overall, updated_at")
      .in("student_id", studentIds),
    supabase
      .from("reading_attempts")
      .select("student_id")
      .in("student_id", studentIds)
      .gte("created_at", start)
      .lte("created_at", end),
    supabase
      .from("listening_attempts")
      .select("student_id")
      .in("student_id", studentIds)
      .gte("completed_at", start)
      .lte("completed_at", end),
    supabase
      .from("speaking_attempts")
      .select("student_id")
      .in("student_id", studentIds)
      .gte("created_at", start)
      .lte("created_at", end),
    supabase
      .from("daily_test_limits")
      .select(
        "student_id, tests_taken, mock_tests_taken, passage_tests_taken, practice_tests_taken"
      )
      .in("student_id", studentIds)
      .eq("test_date", today),
    supabase
      .from("reading_attempts")
      .select("student_id, created_at")
      .in("student_id", studentIds)
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("listening_attempts")
      .select("student_id, completed_at")
      .in("student_id", studentIds)
      .order("completed_at", { ascending: false })
      .limit(500),
    supabase
      .from("speaking_attempts")
      .select("student_id, created_at")
      .in("student_id", studentIds)
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("student_vocab_progress")
      .select("student_id, last_studied_at")
      .in("student_id", studentIds)
      .order("last_studied_at", { ascending: false })
      .limit(500),
    supabase
      .from("daily_test_limits")
      .select("student_id, last_test_at")
      .in("student_id", studentIds)
      .order("last_test_at", { ascending: false })
      .limit(500),
  ]);

  const readingByStudent = new Map();
  for (const row of readingTrackers.data ?? []) {
    const id = row.student_id;
    if (!readingByStudent.has(id)) readingByStudent.set(id, []);
    readingByStudent.get(id).push(row);
  }

  const listeningByStudent = new Map();
  for (const row of listeningTrackers.data ?? []) {
    const id = row.student_id;
    if (!listeningByStudent.has(id)) listeningByStudent.set(id, []);
    listeningByStudent.get(id).push(row);
  }

  const speakingByStudent = new Map();
  for (const row of speakingTrackers.data ?? []) {
    const id = row.student_id;
    if (!speakingByStudent.has(id)) speakingByStudent.set(id, []);
    speakingByStudent.get(id).push(row);
  }

  let testsToday = 0;
  const bump = (rows) => {
    testsToday += (rows ?? []).length;
  };
  bump(readingToday.data);
  bump(listeningToday.data);
  bump(speakingToday.data);

  for (const row of dailyLimitsToday.data ?? []) {
    testsToday +=
      (Number(row.tests_taken) || 0) +
      (Number(row.mock_tests_taken) || 0) +
      (Number(row.passage_tests_taken) || 0) +
      (Number(row.practice_tests_taken) || 0);
  }

  const lastActiveMs = new Map();
  const touch = (id, iso) => maxTimestamp(lastActiveMs, id, iso);

  for (const [id, rows] of readingByStudent) {
    for (const r of rows) touch(id, r.updated_at);
  }
  for (const [id, rows] of listeningByStudent) {
    for (const r of rows) touch(id, r.updated_at);
  }
  for (const [id, rows] of speakingByStudent) {
    for (const r of rows) touch(id, r.updated_at);
  }
  for (const row of readingRecent.data ?? []) touch(row.student_id, row.created_at);
  for (const row of listeningRecent.data ?? []) {
    touch(row.student_id, row.completed_at);
  }
  for (const row of speakingRecent.data ?? []) touch(row.student_id, row.created_at);
  for (const row of vocabRecent.data ?? []) touch(row.student_id, row.last_studied_at);
  for (const row of dailyLimitsAll.data ?? []) touch(row.student_id, row.last_test_at);

  const compositeBands = [];
  let inactiveStudents3PlusDays = 0;

  for (const id of studentIds) {
    const readingBand = studentReadingBand(readingByStudent.get(id) ?? []);
    const listeningBand = studentListeningBand(listeningByStudent.get(id) ?? []);
    const speakingBand = studentSpeakingBand(speakingByStudent.get(id) ?? []);
    const band = compositeBand(readingBand, listeningBand, speakingBand, null);
    if (band !== null) compositeBands.push(band);

    const lastMs = lastActiveMs.get(id);
    const inactiveDays = daysSince(lastMs);
    if (lastMs === undefined || (inactiveDays !== null && inactiveDays >= INACTIVE_DAYS)) {
      inactiveStudents3PlusDays += 1;
    }
  }

  return {
    totalStudents: studentIds.length,
    testsToday,
    averageBandScore: averageBand(compositeBands),
    inactiveStudents3PlusDays,
  };
}
