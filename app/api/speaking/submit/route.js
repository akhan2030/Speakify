import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Save speaking attempt — placeholder */
export async function POST() {
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
