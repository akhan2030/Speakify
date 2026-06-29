import { NextResponse } from "next/server";
import { findValidInvite } from "@/lib/invites";
import { getSupabaseAdmin } from "@/lib/supabaseServer";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token") ?? "";

    let supabase;
    try {
      supabase = getSupabaseAdmin();
    } catch {
      return NextResponse.json(
        { valid: false, error: "Registration is not available." },
        { status: 503 }
      );
    }

    const { invite, error } = await findValidInvite(supabase, token);
    if (!invite) {
      return NextResponse.json({ valid: false, error }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      email: invite.email,
      expiresAt: invite.expires_at,
    });
  } catch (err) {
    console.error("[api/invites/validate]", err);
    return NextResponse.json(
      { valid: false, error: "Could not validate invite." },
      { status: 500 }
    );
  }
}
