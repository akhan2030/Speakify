import { redirect } from "next/navigation";
import { isValidTrack } from "@/lib/accelerator/tracks";

export default function IeltsAcceleratorTrackPage({
  params,
}: {
  params: { track: string };
}) {
  const track = String(params.track ?? "");
  if (!isValidTrack(track)) {
    redirect("/dashboard/ielts/student/progress?tab=programme");
  }
  redirect(`/dashboard/ielts/student/accelerator/${track}/practice`);
}
