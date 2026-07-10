import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resolveSarahVoiceTier } from "@/lib/speaking/sarahVoiceTier";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tier = await resolveSarahVoiceTier(userId);

    return NextResponse.json({
      tier,
      label: tier === "premium" ? "Sarah Pro (ElevenLabs)" : "Sarah (OpenAI)",
      description:
        tier === "premium"
          ? "Ultra-realistic British examiner voice"
          : "Natural AI examiner voice",
    });
  } catch (err) {
    console.error("[speaking/voice-tier]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not load voice tier" },
      { status: 500 }
    );
  }
}
