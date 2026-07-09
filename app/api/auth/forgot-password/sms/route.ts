import { NextResponse } from "next/server";
import { handlePhonePasswordResetRequest } from "@/lib/auth/forgotPasswordHandlers";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handlePhonePasswordResetRequest(request, "sms");
}
