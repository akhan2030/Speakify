import { NextResponse } from "next/server";
import { verifyRegistrationEmailToken } from "@/lib/auth/verification";
import { getSupabaseAdmin } from "@/lib/supabaseServer";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const token = String(body.token ?? "").trim();
    if (!token) {
      return NextResponse.json({ error: "Verification token is required." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const result = await verifyRegistrationEmailToken(supabase, token);
    if (!result.ok) {
      return NextResponse.json({ error: result.error ?? "Verification failed." }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[verify-registration/email]", err);
    return NextResponse.json({ error: "Verification failed." }, { status: 500 });
  }
}
