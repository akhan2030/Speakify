import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Return a pre-generated listening mock test for the student — placeholder */
export async function GET() {
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
