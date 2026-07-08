import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

/** GT prompt attempt tracking — localStorage fallback until prompt_id column is added. */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const taskType = new URL(request.url).searchParams.get("taskType");
    if (taskType !== "task1" && taskType !== "task2") {
      return NextResponse.json({ error: "taskType must be task1 or task2" }, { status: 400 });
    }

    return NextResponse.json({ promptIds: [] });
  } catch (err) {
    console.error("[ielts-general/writing-prompts/attempted]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load attempted prompts" },
      { status: 500 }
    );
  }
}
