import { createClient } from "@supabase/supabase-js";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { recommendTrack } from "@/lib/accelerator/tracks";
import { getCourseBySlug, type CourseCatalogItem } from "@/lib/courses/catalog";
import { normalizeProgramType } from "@/lib/programType";

function getSupabase() {
  const url = (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
  if (!url || !process.env.SUPABASE_SERVICE_KEY) return null;
  return createClient(url, process.env.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const ACADEMIC_SLUG: Record<string, string> = {
  foundation: "ielts-foundation",
  plus: "ielts-plus",
  elite: "ielts-elite",
};

const GT_SLUG: Record<string, string> = {
  foundation: "ielts-gt-foundation",
  plus: "ielts-gt-plus",
  elite: "ielts-gt-elite",
};

/**
 * If the visitor is logged in and has completed placement, return the
 * recommended IELTS course to pin at the top of the hub.
 */
export async function getRecommendedCourse(): Promise<{
  course: CourseCatalogItem;
  placementBand: number;
} | null> {
  try {
    const session = await getServerSession(authOptions);
    const studentId = session?.user?.id;
    if (!studentId) return null;

    const supabase = getSupabase();
    if (!supabase) return null;

    const { data: user } = await supabase
      .from("users")
      .select("placement_band, program_type, program_selected, accelerator_track")
      .eq("id", studentId)
      .maybeSingle();

    const placementBand = Number(user?.placement_band);
    if (!Number.isFinite(placementBand) || placementBand <= 0) return null;

    const track = recommendTrack(placementBand);
    const programType = normalizeProgramType(
      user?.program_selected ?? user?.program_type
    );
    const slugMap = programType === "ielts_general" ? GT_SLUG : ACADEMIC_SLUG;
    const slug = slugMap[track] ?? ACADEMIC_SLUG.plus;
    const course = getCourseBySlug(slug);
    if (!course) return null;

    return { course, placementBand };
  } catch (err) {
    console.error("[getRecommendedCourse]", err);
    return null;
  }
}
