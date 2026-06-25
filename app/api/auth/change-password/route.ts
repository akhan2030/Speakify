import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { getSupabaseAdmin } from "@/lib/supabaseServer";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const currentPassword =
      typeof body.currentPassword === "string" ? body.currentPassword : "";
    const newPassword =
      typeof body.newPassword === "string" ? body.newPassword : "";

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current and new password are required." },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters." },
        { status: 400 }
      );
    }

    if (newPassword === currentPassword) {
      return NextResponse.json(
        { error: "New password must be different from your current password." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const email = session.user.email.trim().toLowerCase();

    const { data: user, error: lookupError } = await supabase
      .from("users")
      .select("id, password, must_change_password")
      .eq("email", email)
      .maybeSingle();

    if (lookupError || !user) {
      return NextResponse.json({ error: "Account not found." }, { status: 404 });
    }

    const valid = await verifyPassword(currentPassword, user.password);
    if (!valid) {
      return NextResponse.json(
        { error: "Current password is incorrect." },
        { status: 401 }
      );
    }

    const passwordHash = await hashPassword(newPassword);
    const { error: updateError } = await supabase
      .from("users")
      .update({
        password: passwordHash,
        must_change_password: false,
      })
      .eq("id", user.id);

    if (updateError) {
      if (updateError.message?.includes("must_change_password")) {
        const { error: fallbackError } = await supabase
          .from("users")
          .update({ password: passwordHash })
          .eq("id", user.id);
        if (fallbackError) {
          console.error("[auth/change-password] update", fallbackError);
          return NextResponse.json(
            { error: "Could not update password." },
            { status: 500 }
          );
        }
      } else {
        console.error("[auth/change-password] update", updateError);
        return NextResponse.json(
          { error: "Could not update password." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Password updated successfully. Please sign in again.",
    });
  } catch (err) {
    console.error("[auth/change-password]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Password change failed" },
      { status: 500 }
    );
  }
}
