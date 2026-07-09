import { NextResponse } from "next/server";
import { handleEmailPasswordResetRequest } from "@/lib/auth/forgotPasswordHandlers";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleEmailPasswordResetRequest(request);
}
