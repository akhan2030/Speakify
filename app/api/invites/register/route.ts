import { NextResponse } from "next/server";
import { findValidInvite } from "@/lib/invites";
import { createTeacherUser } from "@/lib/teacherUsers";
import { getSupabaseAdmin } from "@/lib/supabaseServer";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const token = String(body.token ?? "").trim();
    const fullName = String(body.fullName ?? "").trim();
    const password = String(body.password ?? "");

    if (!token) {
      return NextResponse.json({ error: "Invite token is required." }, { status: 400 });
    }

    let supabase;
    try {
      supabase = getSupabaseAdmin();
    } catch {
      return NextResponse.json(
        { error: "Registration is not available." },
        { status: 503 }
      );
    }

    const { invite, error: inviteError } = await findValidInvite(supabase, token);
    if (!invite) {
      return NextResponse.json({ error: inviteError }, { status: 400 });
    }

    const { userId, error, status } = await createTeacherUser(supabase, {
      fullName,
      email: invite.email,
      password,
    });

    if (!userId) {
      return NextResponse.json({ error }, { status });
    }

    const { error: markUsedError } = await supabase
      .from("invite_tokens")
      .update({ used: true })
      .eq("token", token)
      .eq("used", false);

    if (markUsedError) {
      console.error("[api/invites/register] mark used", markUsedError);
      await supabase.from("users").delete().eq("id", userId);
      return NextResponse.json(
        { error: "Could not complete registration. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      userId,
      email: invite.email,
      name: fullName,
    });
  } catch (err) {
    console.error("[api/invites/register]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Registration failed." },
      { status: 500 }
    );
  }
}
