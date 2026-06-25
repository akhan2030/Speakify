import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/auth";
import { normalizeRole } from "@/lib/roles";

export const runtime = "nodejs";

const MODULES = new Set([
  "Writing",
  "Speaking",
  "Reading",
  "Listening",
  "Vocabulary",
]);

function getSupabaseUrl() {
  return (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
}

function getSupabase() {
  return createClient(getSupabaseUrl(), process.env.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function requireTeacher() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (normalizeRole(session.user.role) !== "teacher") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session, teacherId: session.user.id };
}

function formatDate(dateKey) {
  if (!dateKey) return "—";
  return new Date(`${dateKey}T12:00:00.000Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function studentLabelFromJoin(users) {
  if (!users || typeof users !== "object") return "Student";
  if (Array.isArray(users)) {
    const first = users[0];
    return first?.name ?? first?.email ?? "Student";
  }
  return users.name ?? users.email ?? "Student";
}

function mapRow(row) {
  return {
    id: row.id,
    studentId: row.student_id,
    studentName: studentLabelFromJoin(row.users),
    studentEmail:
      row.users && !Array.isArray(row.users) ? row.users.email ?? null : null,
    module: row.module,
    taskDescription: row.task_description,
    dueDate: row.due_date,
    dueDateLabel: formatDate(row.due_date),
    status: row.status ?? "pending",
    submission: row.submission ?? null,
    teacherFeedback: row.teacher_feedback ?? null,
    createdAt: row.created_at,
  };
}

export async function GET() {
  try {
    const auth = await requireTeacher();
    if (auth.error) return auth.error;

    if (!process.env.SUPABASE_SERVICE_KEY || !getSupabaseUrl()) {
      return NextResponse.json({ assignments: [] });
    }

    const supabase = getSupabase();

    let rows;
    let error;

    const joined = await supabase
      .from("homework")
      .select("*, users:student_id(name, email)")
      .order("created_at", { ascending: false });

    rows = joined.data;
    error = joined.error;

    if (error?.message?.includes("relationship") || error?.code === "PGRST200") {
      const plain = await supabase
        .from("homework")
        .select("*")
        .order("created_at", { ascending: false });
      rows = plain.data;
      error = plain.error;

      if (!error && (rows ?? []).length) {
        const studentIds = [
          ...new Set(rows.map((r) => r.student_id).filter(Boolean)),
        ];
        const { data: users } = await supabase
          .from("users")
          .select("id, name, email")
          .in("id", studentIds);
        const userById = new Map((users ?? []).map((u) => [u.id, u]));
        rows = rows.map((row) => ({
          ...row,
          users: userById.get(row.student_id) ?? null,
        }));
      }
    }

    if (error) {
      if (error.message?.includes("homework")) {
        return NextResponse.json({ assignments: [], tableMissing: true });
      }
      throw error;
    }

    const assignments = (rows ?? []).map((row) => mapRow(row));

    return NextResponse.json({ assignments });
  } catch (err) {
    console.error("[teacher/homework] GET", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load homework" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const auth = await requireTeacher();
    if (auth.error) return auth.error;

    const body = await request.json().catch(() => ({}));
    const studentId = String(body?.studentId ?? "").trim();
    const homeworkModule = String(body?.module ?? "").trim();
    const taskDescription = String(body?.taskDescription ?? "").trim();
    const dueDate = String(body?.dueDate ?? "").trim();

    if (!studentId || !taskDescription || !dueDate) {
      return NextResponse.json(
        { error: "studentId, taskDescription, and dueDate are required" },
        { status: 400 }
      );
    }

    if (!MODULES.has(homeworkModule)) {
      return NextResponse.json({ error: "Invalid module" }, { status: 400 });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      return NextResponse.json(
        { error: "dueDate must be YYYY-MM-DD" },
        { status: 400 }
      );
    }

    if (!process.env.SUPABASE_SERVICE_KEY || !getSupabaseUrl()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const supabase = getSupabase();
    const { teacherId } = auth;

    const { data: student } = await supabase
      .from("users")
      .select("id, name")
      .eq("id", studentId)
      .eq("role", "student")
      .maybeSingle();

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("homework")
      .insert({
        student_id: studentId,
        teacher_id: teacherId,
        module: homeworkModule,
        task_description: taskDescription,
        due_date: dueDate,
        status: "pending",
      })
      .select(
        "id, student_id, teacher_id, module, task_description, due_date, status, submission, teacher_feedback, created_at"
      )
      .single();

    if (error) {
      if (error.message?.includes("homework")) {
        return NextResponse.json(
          {
            error:
              "homework table missing. Run supabase/teacher_homework_tables.sql in Supabase.",
          },
          { status: 503 }
        );
      }
      throw error;
    }

    return NextResponse.json({
      ok: true,
      assignment: mapRow({ ...data, users: { name: student.name, email: null } }),
    });
  } catch (err) {
    console.error("[teacher/homework] POST", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to assign homework" },
      { status: 500 }
    );
  }
}
